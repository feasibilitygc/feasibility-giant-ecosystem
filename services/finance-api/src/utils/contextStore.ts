import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  cooperativeId?: string;
  userId?: string;
}

export const requestContextStore = new AsyncLocalStorage<RequestContext>();

/**
 * Retrieves the current request's cooperative ID.
 */
export function getCooperativeId(): string | undefined {
  const store = requestContextStore.getStore();
  return store?.cooperativeId;
}
