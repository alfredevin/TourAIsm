import * as Speech from 'expo-speech';

// The assistant writes plain text, but strip any markdown it slips in so it isn't read aloud.
function toSpeakable(text: string): string {
  return text
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[*_`#>~]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, Math.min(Speech.maxSpeechInputLength, 3000));
}

export function speak(text: string, language?: string): void {
  const speakable = toSpeakable(text);
  if (!speakable) return;
  void Speech.stop().then(() => Speech.speak(speakable, { rate: 1, language }));
}

export function stopSpeaking(): void {
  void Speech.stop();
}
