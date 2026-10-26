import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export function useAppActive(): boolean {
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setAppActive(state === 'active');
    });
    return () => subscription.remove();
  }, []);

  return appActive;
}
