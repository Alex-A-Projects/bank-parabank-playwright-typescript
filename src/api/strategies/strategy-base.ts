import { readXmlText } from '../clients/xml.parser';
import { apiResult } from '../models/api-result.model';
import type { ApiResult } from '../models/api-result.model';
import type { ApiResponse } from '../models/api-response.model';
import type { PayloadReader } from '../clients/payload-reader';

/**
 * Shared plumbing for the strategy implementations.
 *
 * Every strategy follows the same three steps: call the transport, read
 * the payload with the transport's reader, and normalise the payload
 * into the suite's models. Only the first step differs between SOAP and
 * REST, so it is the only thing the subclasses implement.
 */
export abstract class StrategyBase {
  /** The reader that understands this transport's framing. */
  protected abstract readonly reader: PayloadReader;

  /**
   * The error message carried by a failed response.
   *
   * A SOAP fault puts its message in `<faultstring>`; a REST error
   * answers with a plain-text sentence such as
   * "Could not find transaction #1".
   */
  protected faultOf(raw: ApiResponse): string | null {
    const soapFault = readXmlText(raw.body, 'faultstring');
    if (soapFault !== null) {
      return soapFault;
    }
    if (raw.status >= 400 && raw.body.trim() !== '' && !raw.isXml) {
      return raw.body.trim();
    }
    return null;
  }

  /** Turn a raw response into a result holding one object. */
  protected toSingle<T>(
    raw: ApiResponse,
    operation: string,
    elementName: string,
    map: (value: unknown) => T,
  ): ApiResult<T> {
    const fault = this.faultOf(raw);
    if (fault !== null) {
      return apiResult<T>(raw.status, null, fault, raw);
    }
    const payload = this.reader.payload(raw, operation);
    const single = this.reader.single(payload, elementName);
    return apiResult<T>(raw.status, single === null ? null : map(single), null, raw);
  }

  /** Turn a raw response into a result holding a collection. */
  protected toCollection<T>(
    raw: ApiResponse,
    operation: string,
    elementName: string,
    map: (value: unknown) => T,
  ): ApiResult<T[]> {
    const fault = this.faultOf(raw);
    if (fault !== null) {
      return apiResult<T[]>(raw.status, null, fault, raw);
    }
    const payload = this.reader.payload(raw, operation);
    const items = this.reader.repeated(payload, elementName);
    return apiResult<T[]>(raw.status, items.map(map), null, raw);
  }

  /** Turn a raw response into a result holding free text. */
  protected toText(
    raw: ApiResponse,
    operation: string,
    elementName: string,
  ): ApiResult<string> {
    const fault = this.faultOf(raw);
    if (fault !== null) {
      return apiResult<string>(raw.status, null, fault, raw);
    }
    const payload = this.reader.payload(raw, operation);
    const single = this.reader.single(payload, elementName);
    let text = '';
    if (typeof single === 'string') {
      text = single;
    } else if (payload.format === 'text' && typeof payload.value === 'string') {
      // A plain-text result body, e.g. "Successfully deposited ...".
      text = payload.value.trim();
    } else if (single !== null) {
      text = this.firstString(single);
    }
    if (text === '' && !raw.isJson && !raw.isXml) {
      text = raw.body.trim();
    }
    return apiResult<string>(raw.status, text, null, raw);
  }

  /** Turn a raw response into a result with no payload. */
  protected toVoid(raw: ApiResponse): ApiResult<void> {
    const fault = this.faultOf(raw);
    return apiResult<void>(raw.status, null, fault, raw);
  }

  /** The first string-valued field of an object payload. */
  private firstString(value: unknown): string {
    if (value === null || typeof value !== 'object') {
      return '';
    }
    for (const item of Object.values(value as Record<string, unknown>)) {
      if (typeof item === 'string') {
        return item;
      }
    }
    return '';
  }
}
