import { Ionicons } from '@expo/vector-icons';
import { useRef, useState, type ComponentProps, type ComponentRef, type ReactNode, type Ref } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { signIn, signUp } from '../hooks/useAuth';
import { makeStyles, useTheme } from '../hooks/useTheme';
import { MAX_USERNAME_LENGTH, validatePassword, validateUsername } from '../services/auth';
import { APP_NAME, radius, typography } from '../theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type InputRef = ComponentRef<typeof TextInput>;
type Mode = 'login' | 'signup';
type Field = 'username' | 'password' | 'confirm';
type Errors = Partial<Record<Field, string>>;

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useTheme();
  const styles = useStyles();

  const [mode, setMode] = useState<Mode>('signup');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const passwordRef = useRef<InputRef>(null);
  const confirmRef = useRef<InputRef>(null);

  const signup = mode === 'signup';

  const switchMode = (next: Mode) => {
    if (busy || next === mode) return;
    setMode(next);
    setErrors({});
    setFormError(null);
    setConfirm('');
  };

  const clear = (field: Field) => {
    setFormError(null);
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (signup) {
      const usernameError = validateUsername(username);
      if (usernameError) next.username = usernameError;
    } else if (!username.trim()) {
      next.username = 'Enter your username.';
    }
    if (signup) {
      const passwordError = validatePassword(password);
      if (passwordError) next.password = passwordError;
      else if (confirm !== password) next.confirm = 'Passwords do not match.';
    } else if (!password) {
      next.password = 'Enter your password.';
    }
    return next;
  };

  const submit = async () => {
    if (busy) return;
    const found = validate();
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    const result = signup
      ? await signUp({ username, password })
      : await signIn({ username, password });
    // On success the session store moves App to the next stage, so only failures need UI.
    if (!result.ok) {
      setBusy(false);
      setFormError(result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.fill}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={styles.brand}>
          <View style={[styles.logo, shadows.card]}>
            <Ionicons name="navigate" size={32} color={colors.onPrimary} />
          </View>
          <Text style={styles.title}>{signup ? 'Create your account' : 'Welcome back'}</Text>
          <Text style={styles.subtitle}>
            {signup
              ? `Join ${APP_NAME} to save your profile and trips.`
              : `Log in to continue with ${APP_NAME}.`}
          </Text>
        </View>

        <View style={styles.switcher}>
          {(['signup', 'login'] as const).map((item) => {
            const selected = item === mode;
            return (
              <Pressable
                key={item}
                onPress={() => switchMode(item)}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                style={[styles.switchOption, selected && styles.switchOptionSelected]}
              >
                <Text style={[styles.switchLabel, selected && styles.switchLabelSelected]}>
                  {item === 'signup' ? 'Sign up' : 'Log in'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.form}>
          <Input
            icon="person-outline"
            label="Username"
            value={username}
            error={errors.username}
            hint={signup ? '3-20 characters: letters, numbers, "_" or ".".' : undefined}
            onChangeText={(text) => {
              setUsername(text.slice(0, MAX_USERNAME_LENGTH));
              clear('username');
            }}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <Input
            ref={passwordRef}
            icon="lock-closed-outline"
            label="Password"
            value={password}
            error={errors.password}
            hint={signup ? 'At least 8 characters with letters and numbers.' : undefined}
            onChangeText={(text) => {
              setPassword(text);
              clear('password');
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={signup ? 'new-password' : 'current-password'}
            textContentType={signup ? 'newPassword' : 'password'}
            returnKeyType={signup ? 'next' : 'go'}
            onSubmitEditing={signup ? () => confirmRef.current?.focus() : submit}
            trailing={
              <Pressable
                onPress={() => setShowPassword((current) => !current)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.muted}
                />
              </Pressable>
            }
          />

          {signup && (
            <Input
              ref={confirmRef}
              icon="shield-checkmark-outline"
              label="Confirm password"
              value={confirm}
              error={errors.confirm}
              onChangeText={(text) => {
                setConfirm(text);
                clear('confirm');
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={submit}
            />
          )}

          {formError && (
            <Animated.View
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(120)}
              style={styles.formError}
              accessibilityRole="alert"
            >
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.formErrorText}>{formError}</Text>
            </Animated.View>
          )}

          <Pressable
            onPress={submit}
            disabled={busy}
            accessibilityRole="button"
            style={({ pressed }) => [styles.submit, (pressed || busy) && styles.submitPressed]}
          >
            {busy ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.submitText}>{signup ? 'Create account' : 'Log in'}</Text>
            )}
          </Pressable>
        </View>

        <Text style={styles.footnote}>Accounts are stored on this device only.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type InputProps = Omit<ComponentProps<typeof TextInput>, 'style'> & {
  ref?: Ref<InputRef>;
  icon: IoniconName;
  label: string;
  error?: string;
  hint?: string;
  trailing?: ReactNode;
};

function Input({ ref, icon, label, error, hint, trailing, ...inputProps }: InputProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[styles.inputWrap, focused && styles.inputFocused, !!error && styles.inputError]}
      >
        <Ionicons name={icon} size={20} color={error ? colors.danger : colors.muted} />
        <TextInput
          ref={ref}
          {...inputProps}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={colors.muted}
          accessibilityLabel={label}
          style={styles.input}
        />
        {trailing}
      </View>
      {error ? (
        <Text style={styles.errorText} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  fill: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 24,
    gap: 20,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  brand: {
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginBottom: 8,
  },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.muted,
    textAlign: 'center',
  },
  switcher: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.button,
    backgroundColor: colors.surfaceAlt,
  },
  switchOption: {
    flex: 1,
    height: 42,
    borderRadius: radius.button - 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchOptionSelected: {
    backgroundColor: colors.surface,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.muted,
  },
  switchLabelSelected: {
    color: colors.text,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 54,
    paddingHorizontal: 14,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: colors.text,
    outlineWidth: 0,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
  },
  hintText: {
    fontSize: 12,
    color: colors.muted,
  },
  formError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: radius.button,
    backgroundColor: colors.accentSoft,
  },
  formErrorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.danger,
  },
  submit: {
    height: 56,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  submitPressed: {
    opacity: 0.85,
  },
  submitText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  footnote: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
    textAlign: 'center',
  },
}));
