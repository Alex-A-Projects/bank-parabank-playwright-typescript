import type { ApiResponse } from './api-response.model';

/**
 * The outcome of an API operation.
 *
 * Every operation returns all four pieces of information the test layer
 * might need: the HTTP status, the parsed payload (when the call
 * succeeded), the SOAP fault message (when it did not) and the raw
 * response for wire-format assertions.
 */
export interface ApiResult<T> {
  /** HTTP status code. */
  readonly status: number;
  /** The parsed payload, or `null` when the call failed or returned nothing. */
  readonly data: T | null;
  /** The SOAP fault string, when the server answered with a fault. */
  readonly fault: string | null;
  /** The raw response. */
  readonly raw: ApiResponse;
}

/** Build an {@link ApiResult} from a raw response and a parsed payload. */
export function apiResult<T>(
  status: number,
  data: T | null,
  fault: string | null,
  raw: ApiResponse,
): ApiResult<T> {
  return { status, data, fault, raw };
}
