import Storage from 'expo-sqlite/kv-store';
import type { StateStorage } from 'zustand/middleware';

// Synchronous key-value storage on SQLite. Works in Expo Go and dev builds,
// and hydrates stores before the first render.
export const kvStorage: StateStorage = {
  getItem: (key) => Storage.getItemSync(key),
  setItem: (key, value) => Storage.setItemSync(key, value),
  removeItem: (key) => {
    Storage.removeItemSync(key);
  },
};
