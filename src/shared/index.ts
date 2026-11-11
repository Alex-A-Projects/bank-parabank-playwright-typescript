/**
 * Public surface of the shared layer.
 *
 * `src/shared/` is the ONLY cross-suite import path. A spec in
 * `tests-db/` may import from here; it may not import from `src/ui/` or
 * `src/api/`.
 */

export { assertAll, collectFailures } from './assertions';
export {
  accountTypeNameFor,
  AccountTypeCode,
  AccountTypeNames,
} from './account-types';
export type {
  AccountTypeCodeValue,
  AccountTypeName,
} from './account-types';
export { CustomerBuilder, customerFactory } from './factories';
export type { CustomerPayload } from './factories';
export {
  addDays,
  formatIsoDate,
  formatParaBankDate,
  timestamp,
} from './date';
export {
  apiBaseURL,
  API_ENV,
  baseURL,
  baseUrlFor,
  CLOUD_BASE_URL,
  dbAppBaseURL,
  dbConfig,
  demoCustomer,
  env,
  envAxesDiffer,
  LOCAL_BASE_URL,
  repoPath,
  requireEnv,
  TEST_ENV,
} from './env';
export type { TestEnv } from './env';
export {
  MAX_USERNAME_LENGTH,
  randomCity,
  randomPhone,
  randomSsn,
  randomState,
  randomStreet,
  randomSuffix,
  randomZip,
  uniqueUsername,
} from './generators';
export { Paths } from './paths';
export {
  featureGateSkipReason,
  isFeatureEnabled,
  knownEnvs,
  knownFeatures,
  mutatingTestSkipReason,
} from './policy';
export {
  assertKnownTags,
  featureNameFromTag,
  featureTag,
  FEATURE_TAG_PREFIX,
  isFeatureTag,
  Tags,
} from './tags';
export type { Tag } from './tags';
export { Tickets, ticketTitle } from './tickets';
export type { Ticket } from './tickets';
