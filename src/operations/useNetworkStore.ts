import { useSyncExternalStore } from 'react';
import { globalNetworkStore, NetworkStoreState } from './store';

export function useNetworkStore(): NetworkStoreState & {
  store: typeof globalNetworkStore;
} {
  const state = useSyncExternalStore(
    (listener) => globalNetworkStore.subscribe(listener),
    () => globalNetworkStore.getState()
  );

  return {
    ...state,
    store: globalNetworkStore,
  };
}
