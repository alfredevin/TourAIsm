import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import type { MapLayout } from '../types/map';

const LAYOUT_KEY = 'map_layout_v1';
const DEFAULT_LAYOUT: MapLayout = 'frame';

export function useMapLayout() {
  const [layout, setLayout] = useState<MapLayout>(DEFAULT_LAYOUT);

  useEffect(() => {
    AsyncStorage.getItem(LAYOUT_KEY)
      .then((saved) => {
        if (saved === 'frame' || saved === 'full') setLayout(saved);
      })
      .catch(() => undefined);
  }, []);

  const toggleLayout = useCallback(() => {
    setLayout((current) => {
      const next: MapLayout = current === 'frame' ? 'full' : 'frame';
      void AsyncStorage.setItem(LAYOUT_KEY, next).catch(() => undefined);
      return next;
    });
  }, []);

  const showLayout = useCallback((next: MapLayout) => {
    setLayout(next);
    void AsyncStorage.setItem(LAYOUT_KEY, next).catch(() => undefined);
  }, []);

  return { layout, toggleLayout, showLayout };
}
