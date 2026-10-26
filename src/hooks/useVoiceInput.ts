import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useCallback, useState } from 'react';

const RECOGNITION_LANGUAGE = 'en-US';

// Codes that mean "nothing went wrong" for the tourist: they stayed silent or tapped stop.
const QUIET_ERRORS = new Set(['aborted', 'no-speech']);

type Handlers = {
  // Called with the running transcript while the tourist is still talking.
  onInterim: (text: string) => void;
  // Called once with the final transcript.
  onFinal: (text: string) => void;
};

function messageFor(code: string): string {
  if (code === 'not-allowed') return 'Allow microphone access in Settings to talk to the assistant.';
  if (code === 'network') return 'Voice input needs an internet connection.';
  return 'I couldn’t hear that. Please try again.';
}

export function useVoiceInput({ onInterim, onFinal }: Handlers) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();

  useSpeechRecognitionEvent('start', () => setListening(true));
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript?.trim() ?? '';
    if (!transcript) return;
    if (event.isFinal) onFinal(transcript);
    else onInterim(transcript);
  });
  useSpeechRecognitionEvent('error', (event) => {
    if (!QUIET_ERRORS.has(event.error)) setError(messageFor(event.error));
  });

  const start = useCallback(async () => {
    setError(null);
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setError(messageFor('not-allowed'));
      return;
    }
    ExpoSpeechRecognitionModule.start({ lang: RECOGNITION_LANGUAGE, interimResults: true });
  }, []);

  const stop = useCallback(() => ExpoSpeechRecognitionModule.stop(), []);
  const abort = useCallback(() => ExpoSpeechRecognitionModule.abort(), []);

  return { available, listening, error, start, stop, abort };
}
