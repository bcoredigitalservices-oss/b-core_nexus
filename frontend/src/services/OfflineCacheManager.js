const KEYS = {
  DIRECTORY: 'bcore_directory',
  CATALOG: 'bcore_catalog',
  EVENTS: 'bcore_events',
  BEACON: 'bcore_beacon'
};

export const OfflineCacheManager = {
  getDirectory: () => {
    const data = localStorage.getItem(KEYS.DIRECTORY);
    return data ? JSON.parse(data) : [];
  },
  saveDirectory: (data) => {
    localStorage.setItem(KEYS.DIRECTORY, JSON.stringify(data));
  },
  getCatalog: () => {
    const data = localStorage.getItem(KEYS.CATALOG);
    return data ? JSON.parse(data) : [];
  },
  saveCatalog: (data) => {
    localStorage.setItem(KEYS.CATALOG, JSON.stringify(data));
  },
  getEvents: () => {
    const data = localStorage.getItem(KEYS.EVENTS);
    return data ? JSON.parse(data) : [];
  },
  saveEvents: (data) => {
    localStorage.setItem(KEYS.EVENTS, JSON.stringify(data));
  },
  getBeacon: () => {
    const data = localStorage.getItem(KEYS.BEACON);
    return data ? JSON.parse(data) : null;
  },
  saveBeacon: (data) => {
    if (data) {
      localStorage.setItem(KEYS.BEACON, JSON.stringify(data));
    } else {
      localStorage.removeItem(KEYS.BEACON);
    }
  },
  clearBeacon: () => {
    localStorage.removeItem(KEYS.BEACON);
  }
};

export default OfflineCacheManager;
