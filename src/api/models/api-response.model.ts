/**
 * The response object every API client returns.
 *
 * The API suite asserts on the *outcome* of a call (status code, parsed
 * payload), so the response has to carry both the raw body and a
 * convenient parsed view of it.
 */
export interface ApiResponse {
  /** HTTP status code. */
  readonly status: number;
  /** The `content-type` header, lower-cased and without parameters. */
  readonly contentType: string;
  /** The raw response body. */
  readonly body: string;
  /** True when the body was served as JSON. */
  readonly isJson: boolean;
  /** True when the body was served as XML. */
  readonly isXml: boolean;
  /** The parsed JSON body, or `null` when the body is not JSON. */
  json<T = unknown>(): T | null;
}
