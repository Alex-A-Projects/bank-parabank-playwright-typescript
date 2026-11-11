import { HttpClient } from '../clients/http.client';
import { RestClient } from '../clients/rest.client';
import { SoapClient } from '../clients/soap.client';
import { RestStrategy } from './rest.strategy';
import { SoapStrategy } from './soap.strategy';
import type { ParaBankStrategy, StrategyId } from './parabank-strategy';

/** Every transport the API suite can speak. */
export const STRATEGY_IDS: readonly StrategyId[] = ['soap', 'rest-json', 'rest-xml'];

/**
 * Strategy factory.
 *
 * Picks the transport implementation for a given strategy id. Adding a
 * new transport means adding one class and one entry here - no test or
 * service has to change.
 */
export const strategyFactory = {
  create(id: StrategyId, http: HttpClient): ParaBankStrategy {
    switch (id) {
      case 'soap':
        return new SoapStrategy(new SoapClient(http));
      case 'rest-json':
        return new RestStrategy(new RestClient(http, '/services/bank', 'json'));
      case 'rest-xml':
        return new RestStrategy(new RestClient(http, '/services/bank', 'xml'));
      default: {
        const exhaustive: never = id;
        throw new Error(`Unknown ParaBank strategy "${String(exhaustive)}".`);
      }
    }
  },

  /**
   * Resolves the transport the API suite should speak.
   *
   * The transport comes from `API_TRANSPORT`; SOAP is the default because
   * it is the transport ParaBank documents most completely.
   */
  resolveId(value: string | undefined = process.env.API_TRANSPORT): StrategyId {
    const candidate = (value ?? 'soap').trim().toLowerCase();
    if (!STRATEGY_IDS.includes(candidate as StrategyId)) {
      throw new Error(
        `Unknown API_TRANSPORT="${value}". Valid options: ${STRATEGY_IDS.join(', ')}.`,
      );
    }
    return candidate as StrategyId;
  },
};
