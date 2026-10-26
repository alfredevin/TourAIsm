import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputInstance,
} from 'react-native';

import { makeStyles, useTheme } from '../../hooks/useTheme';
import { SERVICE_ERROR_MESSAGES, ServiceError, type ServiceErrorKind } from '../../services/ors';
import { useRecentPlaces } from '../../hooks/useRecentPlaces';
import { searchPlaces, type Place } from '../../services/places';
import type { LatLng } from '../../services/routing';
import { radius } from '../../theme';

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 400;

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; places: Place[] }
  | { status: 'error'; kind: ServiceErrorKind };

type Props = {
  near: LatLng;
  focusRequest: number;
  onSearchingChange: (searching: boolean) => void;
  onSelect: (place: Place) => void;
};

export default function PlaceSearch({ near, focusRequest, onSearchingChange, onSelect }: Props) {
  const { colors, shadows } = useTheme();
  const styles = useStyles();
  const inputRef = useRef<TextInputInstance>(null);
  const recents = useRecentPlaces();
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState<SearchState>({ status: 'idle' });
  const { latitude, longitude } = near;

  useEffect(() => {
    const text = query.trim();
    if (text.length < MIN_QUERY_LENGTH) {
      setSearch({ status: 'idle' });
      return;
    }

    const request = new AbortController();
    setSearch({ status: 'loading' });
    const timer = setTimeout(() => {
      searchPlaces(text, { latitude, longitude }, request.signal)
        .then((places) => {
          if (!request.signal.aborted) setSearch({ status: 'ready', places });
        })
        .catch((error: unknown) => {
          if (request.signal.aborted) return;
          const kind: ServiceErrorKind = error instanceof ServiceError ? error.kind : 'failed';
          setSearch({ status: 'error', kind });
        });
    }, DEBOUNCE_MS);

    return () => {
      request.abort();
      clearTimeout(timer);
    };
  }, [query, latitude, longitude, attempt]);

  useEffect(() => {
    if (focusRequest > 0) inputRef.current?.focus();
  }, [focusRequest]);

  const showRecents = focused && query.trim().length === 0 && recents.length > 0;

  const handleQueryChange = (text: string) => {
    setQuery(text);
    onSearchingChange(text.trim().length > 0 || (focused && recents.length > 0));
  };

  const handleFocus = () => {
    setFocused(true);
    if (recents.length > 0) onSearchingChange(true);
  };

  const handleBlur = () => {
    setFocused(false);
    if (query.trim().length === 0) onSearchingChange(false);
  };

  const handleClear = () => {
    setQuery('');
    if (!focused || recents.length === 0) onSearchingChange(false);
  };

  const handleSelect = (place: Place) => {
    Keyboard.dismiss();
    inputRef.current?.blur();
    setFocused(false);
    setQuery('');
    setSearch({ status: 'idle' });
    onSearchingChange(false);
    onSelect(place);
  };

  const renderPlace = (place: Place, index: number, icon: 'location-outline' | 'time-outline') => (
    <Pressable
      key={`${place.label}-${index}`}
      onPress={() => handleSelect(place)}
      accessibilityRole="button"
      style={({ pressed }) => [styles.result, pressed && styles.resultPressed]}
    >
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.resultText} numberOfLines={2}>
        {place.label}
      </Text>
    </Pressable>
  );

  const renderResults = () => {
    if (showRecents) {
      return (
        <>
          <Text style={styles.sectionLabel}>Recent</Text>
          {recents.map((place, index) => renderPlace(place, index, 'time-outline'))}
        </>
      );
    }

    if (search.status === 'loading') {
      return <Text style={styles.hint}>Searching...</Text>;
    }

    if (search.status === 'error') {
      return (
        <View style={styles.errorRow}>
          <Text style={styles.errorText}>{SERVICE_ERROR_MESSAGES[search.kind]}</Text>
          <Pressable hitSlop={8} onPress={() => setAttempt((count) => count + 1)}>
            <Text style={styles.retry}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    if (search.status === 'ready') {
      if (search.places.length === 0) {
        return <Text style={styles.hint}>No places found</Text>;
      }
      return search.places.map((place, index) => renderPlace(place, index, 'location-outline'));
    }

    return null;
  };

  const results = renderResults();

  return (
    <View>
      <View style={[styles.field, shadows.card]}>
        <Ionicons name="search" size={20} color={colors.muted} />
        <TextInput
          ref={inputRef}
          value={query}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChangeText={handleQueryChange}
          placeholder="Where to?"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          autoCorrect={false}
          style={styles.input}
        />
        {query.length > 0 && (
          <Pressable hitSlop={8} onPress={handleClear} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={20} color={colors.muted} />
          </Pressable>
        )}
      </View>
      {results !== null && <View style={[styles.list, shadows.card]}>{results}</View>}
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: 16,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0,
  },
  list: {
    marginTop: 8,
    paddingVertical: 8,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  sectionLabel: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 4,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  hint: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.muted,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: colors.muted,
  },
  retry: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  resultPressed: {
    backgroundColor: colors.primarySoft,
  },
  resultText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
}));
