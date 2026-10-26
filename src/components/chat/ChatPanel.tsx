import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { speak, stopSpeaking } from '../../services/speech';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useVoiceReplies } from '../../hooks/useVoiceReplies';
import { QUICK_REPLIES, useChatbot, type ChatItem, type RouteCard } from '../../hooks/useChatbot';
import { makeStyles, useTheme } from '../../hooks/useTheme';
import type { Place } from '../../services/places';
import type { LatLng } from '../../services/routing';
import { radius } from '../../theme';
import { formatDistance, splitPlaceLabel } from '../../utils/route';

const SHEET_RATIO = 0.82;

type Props = {
  visible: boolean;
  origin: LatLng;
  hasLocation: boolean;
  onClose: () => void;
  onOpenPlace: (place: Place) => void;
};

export default function ChatPanel({ visible, origin, hasLocation, onClose, onOpenPlace }: Props) {
  const { colors, shadows } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { items, busy, send, reset } = useChatbot(origin, hasLocation);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<ChatItem>>(null);
  const lastSpokenRef = useRef<string | null>(null);
  const voiceReplies = useVoiceReplies();
  const voice = useVoiceInput({
    onInterim: setDraft,
    onFinal: (text) => submit(text),
  });

  useEffect(() => {
    if (visible) listRef.current?.scrollToEnd({ animated: true });
  }, [items, busy, visible]);

  function submit(text: string) {
    if (!text.trim() || busy) return;
    stopSpeaking();
    setDraft('');
    void send(text);
  }

  // Read each new assistant reply aloud. The greeting and errors stay silent.
  useEffect(() => {
    const last = items[items.length - 1];
    if (!last || last.role !== 'assistant' || last.error || last.id === 'greeting') return;
    if (lastSpokenRef.current === last.id) return;
    lastSpokenRef.current = last.id;
    if (voiceReplies.enabled && visible) speak(last.text);
  }, [items, voiceReplies.enabled, visible]);

  // Stop talking and listening when the panel closes or voice replies are switched off.
  const { abort: abortListening } = voice;
  useEffect(() => {
    if (!visible) {
      stopSpeaking();
      abortListening();
    }
  }, [visible, abortListening]);

  useEffect(() => {
    if (!voiceReplies.enabled) stopSpeaking();
  }, [voiceReplies.enabled]);

  const toggleMic = () => {
    if (voice.listening) {
      voice.stop();
      return;
    }
    stopSpeaking();
    setDraft('');
    void voice.start();
  };

  const handleReset = () => {
    stopSpeaking();
    reset();
  };

  const openRoute = (card: RouteCard) => {
    onClose();
    onOpenPlace(card.place);
  };

  const canSend = draft.trim().length > 0 && !busy;

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior="padding">
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close assistant"
        />
        <View style={[styles.sheet, shadows.card, { height: height * SHEET_RATIO }]}>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Ionicons name="sparkles" size={20} color={colors.onPrimary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Travel assistant</Text>
              <Text style={styles.status}>
                {voice.listening ? 'Listening…' : busy ? 'Thinking…' : 'Ask me for places and routes'}
              </Text>
            </View>
            <IconButton
              icon={voiceReplies.enabled ? 'volume-high' : 'volume-mute'}
              label={voiceReplies.enabled ? 'Turn off voice replies' : 'Turn on voice replies'}
              onPress={voiceReplies.toggle}
            />
            <IconButton icon="refresh" label="Start a new chat" onPress={handleReset} />
            <IconButton icon="close" label="Close assistant" onPress={onClose} />
          </View>

          <FlatList
            ref={listRef}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            data={items}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => <Bubble item={item} onOpenRoute={openRoute} />}
            ListFooterComponent={
              <View style={styles.footer}>
                {items.length === 1 && !busy && (
                  <View style={styles.chips}>
                    {QUICK_REPLIES.map((reply) => (
                      <Pressable
                        key={reply}
                        style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
                        onPress={() => submit(reply)}
                        accessibilityRole="button"
                      >
                        <Text style={styles.chipText}>{reply}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                {busy && (
                  <View style={[styles.bubble, styles.assistantBubble, styles.typing]}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                )}
              </View>
            }
          />

          {voice.error && (
            <Text style={styles.voiceError} accessibilityRole="alert">
              {voice.error}
            </Text>
          )}

          <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder={voice.listening ? 'Listening…' : 'Where do you want to go?'}
              placeholderTextColor={colors.muted}
              multiline
              maxLength={500}
              returnKeyType="send"
              submitBehavior="blurAndSubmit"
              onSubmitEditing={() => submit(draft)}
              accessibilityLabel="Message"
            />
            {voice.available && (
              <Pressable
                style={({ pressed }) => [
                  styles.mic,
                  voice.listening && styles.micActive,
                  pressed && styles.pressed,
                ]}
                onPress={toggleMic}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={voice.listening ? 'Stop listening' : 'Speak your message'}
                accessibilityState={{ selected: voice.listening }}
              >
                <Ionicons
                  name={voice.listening ? 'stop' : 'mic'}
                  size={20}
                  color={voice.listening ? colors.onPrimary : colors.primary}
                />
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [styles.send, !canSend && styles.sendDisabled, pressed && styles.pressed]}
              onPress={() => submit(draft)}
              disabled={!canSend}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              <Ionicons name="arrow-up" size={20} color={colors.onPrimary} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type IconButtonProps = {
  icon: 'refresh' | 'close' | 'volume-high' | 'volume-mute';
  label: string;
  onPress: () => void;
};

function IconButton({ icon, label, onPress }: IconButtonProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
    >
      <Ionicons name={icon} size={20} color={colors.muted} />
    </Pressable>
  );
}

type BubbleProps = {
  item: ChatItem;
  onOpenRoute: (card: RouteCard) => void;
};

function Bubble({ item, onOpenRoute }: BubbleProps) {
  const styles = useStyles();
  const mine = item.role === 'user';

  return (
    <View style={[styles.row, mine && styles.rowMine]}>
      <View
        style={[
          styles.bubble,
          mine ? styles.userBubble : styles.assistantBubble,
          item.error && styles.errorBubble,
        ]}
      >
        <Text style={[styles.bubbleText, mine && styles.userText, item.error && styles.errorText]} selectable>
          {item.text}
        </Text>
      </View>
      {item.routes?.map((card) => (
        <RouteCardView key={`${card.place.location.latitude},${card.place.location.longitude}`} card={card} onOpen={onOpenRoute} />
      ))}
    </View>
  );
}

function RouteCardView({ card, onOpen }: { card: RouteCard; onOpen: (card: RouteCard) => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { title, subtitle } = splitPlaceLabel(card.place.label);
  const minutes = Math.max(1, Math.round(card.durationSeconds / 60));

  return (
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <Ionicons name="navigate" size={18} color={colors.primary} />
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {`${formatDistance(card.distanceMeters)} · ${minutes} min${subtitle ? ` · ${subtitle}` : ''}`}
        </Text>
      </View>
      <Pressable
        style={({ pressed }) => [styles.cardButton, pressed && styles.pressed]}
        onPress={() => onOpen(card)}
        accessibilityRole="button"
        accessibilityLabel={`Open route to ${title} on the map`}
      >
        <Text style={styles.cardButtonText}>Open on map</Text>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  status: {
    fontSize: 12,
    color: colors.muted,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  footer: {
    gap: 10,
  },
  row: {
    alignItems: 'flex-start',
    gap: 8,
  },
  rowMine: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '86%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  assistantBubble: {
    borderBottomLeftRadius: 6,
    backgroundColor: colors.surface,
  },
  userBubble: {
    borderBottomRightRadius: 6,
    backgroundColor: colors.primary,
  },
  errorBubble: {
    backgroundColor: colors.accentSoft,
  },
  typing: {
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
  },
  userText: {
    color: colors.onPrimary,
  },
  errorText: {
    color: colors.danger,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: '100%',
    padding: 12,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  cardText: {
    flexShrink: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.muted,
  },
  cardButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  cardButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 22,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surfaceAlt,
  },
  mic: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  micActive: {
    backgroundColor: colors.danger,
  },
  voiceError: {
    paddingHorizontal: 16,
    paddingTop: 8,
    fontSize: 12,
    color: colors.danger,
    backgroundColor: colors.surface,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  sendDisabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.8,
  },
}));
