import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { isVoiceEnabled } from '../hooks/useVoiceReplies';
import { speak } from './speech';

const CHANNEL_ID = 'arrivals';
const VOICE_LANGUAGE = 'fil-PH';

export type Alert = {
  title: string;
  body: string;
  // Spoken aloud when voice is on.
  speech: string;
};

let setup: Promise<boolean> | null = null;

// Sets up the handler and Android channel once, then asks for permission. Resolves false when the
// tourist declined, in which case alerts fall back to voice only.
function ensureNotifications(): Promise<boolean> {
  setup ??= (async () => {
    if (Platform.OS === 'web') return false;
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      if (Platform.OS === 'android') {
        // Android 13+ only shows the permission prompt once a channel exists.
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
          name: 'Arrival alerts',
          importance: AndroidImportance.HIGH,
        });
      }
      const current = await Notifications.getPermissionsAsync();
      if (current.granted) return true;
      if (!current.canAskAgain) return false;
      return (await Notifications.requestPermissionsAsync()).granted;
    } catch {
      return false;
    }
  })();
  return setup;
}

// Shows a notification and speaks it. Either half may be unavailable; neither blocks the other.
export async function announce({ title, body, speech }: Alert): Promise<void> {
  if (await isVoiceEnabled()) speak(speech, VOICE_LANGUAGE);

  if (!(await ensureNotifications())) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null,
    });
  } catch {
    // The voice alert already played.
  }
}
