import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ThemeTransition from './src/components/ThemeTransition';
import AppShell from './src/navigation/AppShell';
import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { loadAuth, useAuth } from './src/hooks/useAuth';
import { loadProfile } from './src/hooks/useProfile';
import { loadTheme, useTheme } from './src/hooks/useTheme';

const ONBOARDING_DONE_KEY = 'onboarding_done_v1';

type Stage = 'loading' | 'onboarding' | 'app';

export default function App() {
  const [stage, setStage] = useState<Stage>('loading');
  const { colors } = useTheme();
  const { session, loaded: authLoaded } = useAuth();

  useEffect(() => {
    void loadProfile();
    void loadAuth();
    Promise.all([loadTheme(), AsyncStorage.getItem(ONBOARDING_DONE_KEY)])
      .then(([, value]) => setStage(value === 'true' ? 'app' : 'onboarding'))
      .catch(() => setStage('onboarding'));
  }, []);

  const finishOnboarding = useCallback(() => {
    setStage('app');
    AsyncStorage.setItem(ONBOARDING_DONE_KEY, 'true').catch(() => undefined);
  }, []);

  const resetOnboarding = useCallback(() => {
    setStage('onboarding');
    AsyncStorage.removeItem(ONBOARDING_DONE_KEY).catch(() => undefined);
  }, []);

  // Onboarding first, then the auth gate, then the app. Signing out returns to the gate.
  const showAuth = stage === 'app' && authLoaded && !session;
  const showApp = stage === 'app' && authLoaded && !!session;

  return (
    <SafeAreaProvider>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {stage === 'onboarding' && (
          <Animated.View
            style={styles.fill}
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(350)}
          >
            <OnboardingScreen onFinish={finishOnboarding} />
          </Animated.View>
        )}
        {showAuth && (
          <Animated.View
            style={styles.fill}
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(250)}
          >
            <AuthScreen />
          </Animated.View>
        )}
        {showApp && (
          <Animated.View
            style={styles.fill}
            entering={FadeIn.duration(500).delay(150)}
            exiting={FadeOut.duration(350)}
          >
            <AppShell onResetOnboarding={resetOnboarding} />
          </Animated.View>
        )}
        <ThemeTransition />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  fill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});
