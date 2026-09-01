import { createContext, useContext, useMemo, useState } from 'react';
import { regions, detectRegion } from '../regions';
import { load, save } from '../lib/storage';

const RegionContext = createContext(null);

export function RegionProvider({ children }) {
  const [regionId, setRegionId] = useState(() => {
    const saved = load('region');
    return saved && regions[saved] ? saved : detectRegion();
  });
  const [autoDetected] = useState(() => !load('region'));

  const value = useMemo(
    () => ({
      region: regions[regionId],
      regionId,
      autoDetected,
      allRegions: Object.values(regions),
      setRegion: (id) => {
        if (regions[id]) {
          setRegionId(id);
          save('region', id);
        }
      }
    }),
    [regionId, autoDetected]
  );

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}

export function useRegion() {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error('useRegion must be used inside <RegionProvider>');
  return ctx;
}
