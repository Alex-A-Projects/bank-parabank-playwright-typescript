import { parseXml, toArray } from './xml.parser';
import type { ApiResponse } from '../models/api-response.model';

/**
 * How a payload arrived on the wire.
 *
 * The framing decides how the payload is read: a JSON body is either a
 * bare object or a bare array, an XML body is always wrapped in a root
 * element, and a plain-text body carries the answer verbatim.
 */
export type PayloadFormat = 'json' | 'xml' | 'text';

/** A parsed payload together with the framing it arrived in. */
export interface ReaderPayload {
  /** The framing of the response body. */
  readonly format: PayloadFormat;
  /** The parsed body. */
  readonly value: unknown;
}

/**
 * PayloadReader - knows how one transport frames its payloads.
 *
 * The three transports frame the same banking data differently:
 *
 *   - SOAP wraps everything in an envelope and then in an
 *     `{operation}Response` element;
 *   - REST with a JSON body answers with a bare object or a bare array;
 *   - REST with an XML body answers with a singular root element
 *     (`<customer>`) or a plural one that holds the items
 *     (`<accounts><account/><account/></accounts>`).
 *
 * The reader hides that difference so the strategy implementations can
 * stay identical in shape.
 */
export interface PayloadReader {
  /** The operation's payload, unwrapped from the transport's framing. */
  payload(response: ApiResponse, operation: string): ReaderPayload;
  /** The repeated items of a collection payload. */
  repeated(payload: ReaderPayload, elementName: string): unknown[];
  /** The single object of a payload, or `null`. */
  single(payload: ReaderPayload, elementName: string): unknown | null;
}

/** The keys of a parsed element, ignoring XML declarations and PIs. */
function elementKeys(record: Record<string, unknown>): string[] {
  return Object.keys(record).filter((key) => !key.startsWith('?'));
}

/**
 * SOAP: `Envelope.Body.{operation}Response`.
 *
 * The response element is unwrapped here, so the strategy only ever
 * deals with the operation's own children.
 */
export const soapPayloadReader: PayloadReader = {
  payload(response: ApiResponse, operation: string): ReaderPayload {
    const parsed = parseXml<{ Envelope?: { Body?: Record<string, unknown> } }>(response.body);
    const body = parsed?.Envelope?.Body;
    if (!body) {
      return { format: 'xml', value: null };
    }
    const expected = body[`${operation}Response`];
    if (expected !== undefined) {
      return { format: 'xml', value: expected };
    }
    const keys = Object.keys(body);
    return { format: 'xml', value: keys.length === 1 ? body[keys[0]] : body };
  },

  repeated(payload: ReaderPayload, elementName: string): unknown[] {
    const value = payload.value;
    if (value === null || typeof value !== 'object') {
      return [];
    }
    return toArray((value as Record<string, unknown>)[elementName]);
  },

  single(payload: ReaderPayload, elementName: string): unknown | null {
    const value = payload.value;
    if (value === null || typeof value !== 'object') {
      return null;
    }
    const record = value as Record<string, unknown>;
    const direct = record[elementName];
    if (direct !== undefined) {
      return direct;
    }
    // The WSDL names some response children after the WSDL type rather
    // than after the element (`return` holding a `billPayResult`), so
    // fall back to the only child when the expected name is absent.
    const keys = elementKeys(record);
    return keys.length === 1 ? record[keys[0]] : null;
  },
};

/**
 * REST: the framing is decided by the response, not by the request.
 *
 * ParaBank answers in whatever the `Accept` header asked for, but the
 * reader sniffs the actual content type so a mismatched answer is still
 * read correctly instead of silently producing an empty result.
 */
export const restPayloadReader: PayloadReader = {
  payload(response: ApiResponse): ReaderPayload {
    if (response.isJson) {
      return { format: 'json', value: response.json() };
    }
    if (response.isXml) {
      return { format: 'xml', value: parseXml(response.body) };
    }
    return { format: 'text', value: response.body };
  },

  repeated(payload: ReaderPayload, elementName: string): unknown[] {
    const value = payload.value;
    if (Array.isArray(value)) {
      return value;
    }
    if (value === null || typeof value !== 'object') {
      return [];
    }
    const record = value as Record<string, unknown>;

    // `<accounts><account/><account/></accounts>` parsed with
    // `fast-xml-parser` becomes `{ accounts: { account: [...] } }`.
    const direct = record[elementName];
    if (direct !== undefined) {
      return toArray(direct);
    }
    const keys = elementKeys(record);
    if (keys.length === 1) {
      const only = record[keys[0]];
      if (Array.isArray(only)) {
        return only;
      }
      if (only !== null && typeof only === 'object') {
        const nested = (only as Record<string, unknown>)[elementName];
        if (nested !== undefined) {
          return toArray(nested);
        }
      }
    }
    return [];
  },

  single(payload: ReaderPayload, elementName: string): unknown | null {
    const value = payload.value;
    if (Array.isArray(value)) {
      return value.length > 0 ? value[0] : null;
    }
    if (value === null || typeof value !== 'object') {
      return null;
    }
    const record = value as Record<string, unknown>;

    const direct = record[elementName];
    if (direct !== undefined && !Array.isArray(direct)) {
      return direct;
    }
    const keys = elementKeys(record);
    if (keys.length === 1) {
      const only = record[keys[0]];
      if (only !== null && typeof only === 'object' && !Array.isArray(only)) {
        return only;
      }
    }
    // A JSON body is the object itself, e.g. `{"id":12212,...}`.
    if (payload.format === 'json') {
      return record;
    }
    return null;
  },
};
