const isServer = typeof window === 'undefined';

export const localStorageShimLoaded = true;

if (isServer) {
  const existing = (globalThis as typeof globalThis & { localStorage?: Storage }).localStorage;
  const hasValidApi =
    typeof existing?.getItem === 'function' && typeof existing?.setItem === 'function';

  if (!hasValidApi) {
    const store = new Map<string, string>();
    const shim: Storage = {
      clear: () => {
        store.clear();
      },
      getItem: (key) => (store.has(key) ? store.get(key)! : null),
      key: (index) => Array.from(store.keys())[index] ?? null,
      get length() {
        return store.size;
      },
      removeItem: (key) => {
        store.delete(key);
      },
      setItem: (key, value) => {
        store.set(key, String(value));
      },
    };

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: shim,
    });
  }
}
