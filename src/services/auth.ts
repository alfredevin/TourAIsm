import type { Session as SupabaseSession } from '@supabase/supabase-js';

import { devLog } from './logger';
import { supabase, supabaseConfigured } from './supabase';

// Accounts live in Supabase Auth. Supabase signs in with email, so the username is mapped to
// a synthetic address. No email is ever sent: turn "Confirm email" OFF in the Supabase dashboard.
const EMAIL_DOMAIN = 'touraism.app';

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 64;

export type Session = { id: string; name: string };

export type AuthResult<T> = { ok: true; value: T } | { ok: false; error: string };

export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 20;

const USERNAME_PATTERN = /^[a-zA-Z0-9_.]+$/;

// Usernames are unique case-insensitively but keep the casing the user typed for display.
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function validateUsername(username: string): string | null {
  const value = username.trim();
  if (!value) return 'Enter a username.';
  if (value.length < MIN_USERNAME_LENGTH) {
    return `Use at least ${MIN_USERNAME_LENGTH} characters.`;
  }
  if (value.length > MAX_USERNAME_LENGTH) {
    return `Use at most ${MAX_USERNAME_LENGTH} characters.`;
  }
  if (!USERNAME_PATTERN.test(value)) return 'Use letters, numbers, "_" or "." only.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Enter a password.';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Use at most ${MAX_PASSWORD_LENGTH} characters.`;
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Mix letters and numbers.';
  }
  return null;
}

function toEmail(username: string): string {
  return `${normalizeUsername(username)}@${EMAIL_DOMAIN}`;
}

export function toSession(session: SupabaseSession | null): Session | null {
  if (!session) return null;
  const username = session.user.user_metadata?.username;
  return { id: session.user.id, name: typeof username === 'string' ? username : 'Traveler' };
}

const NOT_CONFIGURED: AuthResult<never> = {
  ok: false,
  error: 'Accounts are not set up yet. Add the Supabase keys to .env and restart.',
};

export async function register(input: {
  username: string;
  password: string;
}): Promise<AuthResult<Session>> {
  if (!supabaseConfigured) return NOT_CONFIGURED;
  const username = input.username.trim();
  const usernameError = validateUsername(username);
  if (usernameError) return { ok: false, error: usernameError };
  const passwordError = validatePassword(input.password);
  if (passwordError) return { ok: false, error: passwordError };

  const { data, error } = await supabase.auth.signUp({
    email: toEmail(username),
    password: input.password,
    options: { data: { username } },
  });

  if (error) {
    devLog(`signUp failed: ${error.message}`);
    if (error.code === 'user_already_exists' || /already registered/i.test(error.message)) {
      return { ok: false, error: 'That username is already taken.' };
    }
    if (error.code === 'weak_password') return { ok: false, error: 'Choose a stronger password.' };
    if (error.status === 429) return { ok: false, error: 'Too many attempts. Wait a bit and retry.' };
    return { ok: false, error: 'Could not create your account. Try again.' };
  }

  const session = toSession(data.session);
  if (!session) {
    devLog('signUp returned no session: "Confirm email" is still ON in Supabase.');
    return { ok: false, error: 'Sign up is unavailable right now. Try again later.' };
  }
  return { ok: true, value: session };
}

export async function authenticate(input: {
  username: string;
  password: string;
}): Promise<AuthResult<Session>> {
  if (!supabaseConfigured) return NOT_CONFIGURED;
  if (!normalizeUsername(input.username) || !input.password) {
    return { ok: false, error: 'Enter your username and password.' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: toEmail(input.username),
    password: input.password,
  });

  if (error) {
    devLog(`signIn failed: ${error.message}`);
    if (error.code === 'invalid_credentials') {
      return { ok: false, error: 'Incorrect username or password.' };
    }
    if (error.status === 429) return { ok: false, error: 'Too many attempts. Wait a bit and retry.' };
    return { ok: false, error: 'Could not sign you in. Try again.' };
  }

  const session = toSession(data.session);
  return session ? { ok: true, value: session } : { ok: false, error: 'Could not sign you in.' };
}

export async function endSession(): Promise<void> {
  if (!supabaseConfigured) return;
  await supabase.auth.signOut().catch(() => undefined);
}
