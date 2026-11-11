import { test as base } from '@playwright/test';
import { HttpClient } from '../clients/http.client';
import { RestClient } from '../clients/rest.client';
import { SoapClient } from '../clients/soap.client';
import { strategyFactory } from '../strategies/strategy.factory';
import { ParaBankService } from '../services/parabank.service';
import { apiBaseURL } from '../../shared/env';
import type { ApiCoreFixtures } from './core.fixture';
import type { ParaBankStrategy } from '../strategies/parabank-strategy';

/**
 * API client fixture layer.
 *
 * The fixtures are wired top-down: one HTTP transport feeds the two
 * protocol clients, the protocol clients feed the strategy, and the
 * strategy feeds the facade a test actually uses.
 *
 * ZERO ASSERTIONS - the fixtures only build things.
 */
export interface ApiClientFixtures {
  /** The HTTP transport every protocol client is built on. */
  httpClient: HttpClient;
  /** The SOAP client. */
  soapClient: SoapClient;
  /** The REST client; its payload format follows the selected transport. */
  restClient: RestClient;
  /** The strategy for the selected transport. */
  strategy: ParaBankStrategy;
  /** The facade a test uses. */
  paraBank: ParaBankService;
}

export const apiClientFixtures = {
  httpClient: async ({ request }, use: (value: HttpClient) => Promise<void>) => {
    await use(new HttpClient(request, apiBaseURL));
  },

  soapClient: async ({ httpClient }, use: (value: SoapClient) => Promise<void>) => {
    await use(new SoapClient(httpClient));
  },

  restClient: async (
    { httpClient, appConfig },
    use: (value: RestClient) => Promise<void>,
  ) => {
    const format = appConfig.transport === 'rest-json' ? 'json' : 'xml';
    await use(new RestClient(httpClient, '/services/bank', format));
  },

  strategy: async (
    { httpClient, appConfig },
    use: (value: ParaBankStrategy) => Promise<void>,
  ) => {
    await use(strategyFactory.create(appConfig.transport, httpClient));
  },

  paraBank: async ({ strategy }, use: (value: ParaBankService) => Promise<void>) => {
    await use(new ParaBankService(strategy));
  },
} satisfies Parameters<
  typeof base.extend<ApiCoreFixtures & ApiClientFixtures>
>[0];
