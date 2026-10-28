import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const VOICE_REPLIES_KEY = 'voice_replies_v1';

// Read outside React so alerts can respect the setting without subscribing to it.
export async function isVoiceEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(VOICE_REPLIES_KEY)) !== 'false';
  } catch {
    return true;
  }
}

// Whether the assistant reads its replies aloud. On by default, remembered across launches.
export function useVoiceReplies() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(VOICE_REPLIES_KEY)
      .then((saved) => {
        if (saved === 'false') setEnabled(false);
      })
      .catch(() => undefined);
  }, []);

  const toggle = useCallback(() => {
    setEnabled((current) => {
      void AsyncStorage.setItem(VOICE_REPLIES_KEY, String(!current)).catch(() => undefined);
      return !current;
    });
  }, []);

  return { enabled, toggle };
}
