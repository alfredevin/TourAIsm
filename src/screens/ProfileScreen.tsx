import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { makeStyles, useTheme } from '../hooks/useTheme';
import SpriteCharacter from '../components/character/SpriteCharacter';
import NameTag from '../components/NameTag';
import { FormSection } from '../components/profile/ProfileControls';
import { CHARACTERS, type CharacterGender } from '../data/characters';
import { useProfile, updateProfile } from '../hooks/useProfile';
import { TAB_BAR_SPACE } from '../navigation/TabBar';
import { radius, typography } from '../theme';
import { DEFAULT_NAME, MAX_NAME_LENGTH } from '../types/profile';

const GROUPS: { title: string; gender: CharacterGender }[] = [
  { title: 'Female', gender: 'girl' },
  { title: 'Male', gender: 'boy' },
];

export default function ProfileScreen() {
  const { colors, shadows } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const [draft, setDraft] = useState<string | null>(null);

  const handleName = (text: string) => {
    const next = text.slice(0, MAX_NAME_LENGTH);
    setDraft(next);
    updateProfile({ name: next.trim() || DEFAULT_NAME });
  };

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + TAB_BAR_SPACE },
        ]}
      >
        <Text style={styles.title}>Profile</Text>

        <View style={[styles.preview, shadows.card]}>
          <SpriteCharacter characterId={profile.characterId} direction="down" state="idle" size={120} />
          {profile.showNameTag && (
            <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
              <NameTag name={profile.name} />
            </Animated.View>
          )}
        </View>

        <FormSection title="Name">
          <View style={[styles.card, shadows.soft]}>
            <TextInput
              value={draft ?? profile.name}
              onChangeText={handleName}
              maxLength={MAX_NAME_LENGTH}
              placeholder={DEFAULT_NAME}
              placeholderTextColor={colors.muted}
              autoCorrect={false}
              returnKeyType="done"
              style={styles.input}
              accessibilityLabel="Name"
            />
            <Text style={styles.counter}>
              {(draft ?? profile.name).length}/{MAX_NAME_LENGTH}
            </Text>
          </View>
        </FormSection>

        {GROUPS.map((group) => (
          <FormSection key={group.gender} title={group.title}>
            <View style={styles.grid}>
              {CHARACTERS.filter((character) => character.gender === group.gender).map((character) => {
                const selected = character.id === profile.characterId;
                return (
                  <Pressable
                    key={character.id}
                    onPress={() => updateProfile({ characterId: character.id })}
                    accessibilityRole="button"
                    accessibilityLabel={character.name}
                    accessibilityState={{ selected }}
                    style={[styles.tile, shadows.soft, selected && styles.tileSelected]}
                  >
                    <SpriteCharacter characterId={character.id} direction="down" state="idle" size={72} />
                    <Text style={styles.tileName}>{character.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </FormSection>
        ))}

        <View style={[styles.card, styles.switchRow, shadows.soft]}>
          <Text style={styles.switchLabel}>Show name tag on the map</Text>
          <Switch
            value={profile.showNameTag}
            onValueChange={(value) => updateProfile({ showNameTag: value })}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  fill: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    gap: 24,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  preview: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 28,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  card: {
    borderRadius: radius.button,
    backgroundColor: colors.surface,
  },
  input: {
    height: 52,
    paddingHorizontal: 18,
    fontSize: 16,
    color: colors.text,
  },
  counter: {
    alignSelf: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 12,
    fontSize: 12,
    color: colors.muted,
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    gap: 6,
    borderRadius: radius.button,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.surface,
  },
  tileSelected: {
    borderColor: colors.primary,
  },
  tileName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  switchLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
}));
