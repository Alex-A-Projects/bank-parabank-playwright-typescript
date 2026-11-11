import type { APIResponse } from '@playwright/test';
import type { ApiResponse } from '../models/api-response.model';

/**
 * Wraps a Playwright `APIResponse` in the suite's own response shape.
 *
 * ZERO ASSERTIONS - the response is reported exactly as the server sent
 * it, and the test layer decides what a correct response looks like.
 */
export class Response implements ApiResponse {
  readonly status: number;
  readonly contentType: string;
  readonly body: string;

  constructor(response: APIResponse, body: string) {
    this.status = response.status();
    this.contentType = (response.headers()['content-type'] ?? '')
      .split(';')[0]
      .trim()
      .toLowerCase();
    this.body = body;
  }

  get isJson(): boolean {
    return this.contentType.includes('json');
  }

  get isXml(): boolean {
    return this.contentType.includes('xml');
  }

  json<T = unknown>(): T | null {
    if (!this.isJson) {
      return null;
    }
    try {
      return JSON.parse(this.body) as T;
    } catch {
      return null;
    }
  }
}
