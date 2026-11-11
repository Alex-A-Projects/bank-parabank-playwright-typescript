import { HttpClient } from './http.client';
import { parseXml, readXmlText, toArray } from './xml.parser';
import type { ApiResponse } from '../models/api-response.model';

/**
 * The SOAP transport namespace, taken from ParaBank's published WSDL
 * (`http://service.parabank.parasoft.com/`).
 */
export const SOAP_SERVICE_NAMESPACE = 'http://service.parabank.parasoft.com/';

/** The SOAP envelope namespace. */
export const SOAP_ENVELOPE_NAMESPACE = 'http://schemas.xmlsoap.org/soap/envelope/';

/** A nested element inside a complex SOAP argument. */
export interface SoapArgNode {
  [name: string]: SoapArgValue;
}

/** A value that can be sent as a SOAP argument. */
export type SoapArgValue = string | number | boolean | SoapArgNode | SoapArgValue[];

/** SOAP operation arguments. */
export type SoapArgs = Record<string, SoapArgValue>;

/** The parsed body of a SOAP response. */
export interface SoapEnvelope {
  /** The operation's response element, already unwrapped from the envelope. */
  payload: unknown;
  /** The fault string when the call failed, otherwise `null`. */
  fault: string | null;
}

/** Escape the five characters XML reserves. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Render one SOAP argument.
 *
 * A scalar becomes `<ser:name>value</ser:name>`; a nested object becomes
 * `<ser:name><ser:child>...</ser:child></ser:name>`, which is how the
 * WSDL's complex types (such as `payee`) are framed.
 */
function renderArg(name: string, value: SoapArgValue): string {
  if (Array.isArray(value)) {
    return value.map((item) => renderArg(name, item)).join('');
  }
  if (value !== null && typeof value === 'object') {
    const inner = Object.entries(value)
      .map(([child, childValue]) => renderArg(child, childValue))
      .join('');
    return `<ser:${name}>${inner}</ser:${name}>`;
  }
  return `<ser:${name}>${escapeXml(String(value))}</ser:${name}>`;
}

/**
 * SoapClient - talks to ParaBank's SOAP endpoint.
 *
 * ZERO ASSERTIONS. It builds the envelope, sends the request and parses
 * the reply; the service and test layers decide what is correct.
 */
export class SoapClient {
  /**
   * @param http     the HTTP transport
   * @param endpoint the SOAP endpoint path, relative to the base URL
   */
  constructor(
    private readonly http: HttpClient,
    private readonly endpoint = '/services/ParaBank',
  ) {}

  /**
   * Build the request envelope for an operation.
   *
   * The element names are the WSDL's parameter names and are
   * case-sensitive.
   */
  buildEnvelope(operation: string, args: SoapArgs = {}): string {
    const inner = Object.entries(args)
      .map(([name, value]) => renderArg(name, value))
      .join('');
    return `<?xml version="1.0"?>
<soapenv:Envelope xmlns:soapenv="${SOAP_ENVELOPE_NAMESPACE}" xmlns:ser="${SOAP_SERVICE_NAMESPACE}">
  <soapenv:Body>
    <ser:${operation}>${inner}</ser:${operation}>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  /** Send a SOAP call and return the raw response. */
  async call(operation: string, args: SoapArgs = {}): Promise<ApiResponse> {
    return await this.http.post(this.endpoint, {
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
      data: this.buildEnvelope(operation, args),
    });
  }

  /**
   * Send a SOAP call and unwrap the response.
   *
   * A successful call answers with `<ns2:{operation}Response>`; a failed
   * one answers with HTTP 500 and a `<soap:Fault>`. Both shapes are
   * reported through the same envelope object so the test layer can
   * assert on either.
   */
  async callAndParse(operation: string, args: SoapArgs = {}): Promise<{
    response: ApiResponse;
    envelope: SoapEnvelope;
  }> {
    const response = await this.call(operation, args);
    return { response, envelope: this.parseEnvelope(response.body, operation) };
  }

  /** Parse a SOAP body into its payload (or fault). */
  parseEnvelope(body: string, operation: string): SoapEnvelope {
    const fault = readXmlText(body, 'faultstring');

    const parsed = parseXml<{
      Envelope?: { Body?: Record<string, unknown> };
    }>(body);

    const bodyElement = parsed?.Envelope?.Body ?? {};

    if (fault !== null) {
      return { payload: null, fault };
    }

    // The response element is `{operation}Response`, but a few operations
    // answer with a differently-named element - fall back to the single
    // child of the body when the expected name is absent.
    const expected = bodyElement[`${operation}Response`];
    if (expected !== undefined) {
      return { payload: expected, fault: null };
    }

    const keys = Object.keys(bodyElement);
    if (keys.length === 1) {
      return { payload: bodyElement[keys[0]], fault: null };
    }

    return { payload: bodyElement, fault: null };
  }

  /**
   * Read the repeated elements of a SOAP response.
   *
   * `getAccounts` answers with `<ns2:account>` children inside
   * `<ns2:getAccountsResponse>`; this pulls them out as a flat array.
   */
  static repeated(payload: unknown, elementName: string): unknown[] {
    if (payload === null || typeof payload !== 'object') {
      return [];
    }
    const container = payload as Record<string, unknown>;
    return toArray(container[elementName]);
  }
}
