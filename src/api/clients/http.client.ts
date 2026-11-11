import type { APIRequestContext } from '@playwright/test';
import { Response } from './api-response';
import type { ApiResponse } from '../models/api-response.model';

/** Query-string values a request can carry. */
export type QueryParams = Record<string, string | number | boolean | undefined>;

/** Options accepted by the HTTP client. */
export interface RequestOptions {
  query?: QueryParams;
  headers?: Record<string, string>;
  /** A raw request body (already serialised). */
  data?: string;
}

/**
 * The HTTP transport.
 *
 * The lowest layer of the API suite: it knows how to build a URL, send a
 * request and read the response, and nothing else. It performs no
 * assertions and no interpretation of ParaBank's payload.
 */
export class HttpClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl: string,
  ) {}

  /** The base URL every path is resolved against. */
  get base(): string {
    return this.baseUrl;
  }

  /** Build the absolute URL for a path plus optional query parameters. */
  buildUrl(path: string, query?: QueryParams): string {
    const base = this.baseUrl.endsWith('/') ? this.baseUrl : this.baseUrl + '/';
    const url = new URL(path.replace(/^\//, ''), base);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  /** Send a GET request. */
  async get(path: string, options: RequestOptions = {}): Promise<ApiResponse> {
    const response = await this.request.get(this.buildUrl(path, options.query), {
      headers: options.headers,
    });
    return new Response(response, await response.text());
  }

  /** Send a POST request. */
  async post(path: string, options: RequestOptions = {}): Promise<ApiResponse> {
    const response = await this.request.post(this.buildUrl(path, options.query), {
      headers: options.headers,
      data: options.data,
    });
    return new Response(response, await response.text());
  }
}
