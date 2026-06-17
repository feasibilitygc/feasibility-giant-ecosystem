import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  cooperativeId?: string;
  userId?: string;
  bypassTenantIsolation?: boolean;
}

export const requestContextStore = new AsyncLocalStorage<RequestContext>();

/**
 * Retrieves the current request's cooperative ID.
 */
export function getCooperativeId(): string | undefined {
  const store = requestContextStore.getStore();
  return store?.cooperativeId;
}

/**
 * Helper to run an operation bypassing tenant isolation (useful for Super Admin queries)
 */
export function runWithoutIsolation<T>(callback: () => Promise<T>): Promise<T> {
  const store = requestContextStore.getStore() || {};
  return requestContextStore.run({ ...store, bypassTenantIsolation: true }, callback);
}
