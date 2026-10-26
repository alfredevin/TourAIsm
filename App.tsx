import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ThemeTransition from './src/components/ThemeTransition';
import AppShell from './src/navigation/AppShell';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { loadProfile } from './src/hooks/useProfile';
import { loadTheme, useTheme } from './src/hooks/useTheme';

const ONBOARDING_DONE_KEY = 'onboarding_done_v1';

type Stage = 'loading' | 'onboarding' | 'home';

export default function App() {
  const [stage, setStage] = useState<Stage>('loading');
  const { colors } = useTheme();

  useEffect(() => {
    void loadProfile();
    Promise.all([loadTheme(), AsyncStorage.getItem(ONBOARDING_DONE_KEY)])
      .then(([, value]) => setStage(value === 'true' ? 'home' : 'onboarding'))
      .catch(() => setStage('onboarding'));
  }, []);

  const finishOnboarding = useCallback(() => {
    setStage('home');
    AsyncStorage.setItem(ONBOARDING_DONE_KEY, 'true').catch(() => undefined);
  }, []);

  const resetOnboarding = useCallback(() => {
    setStage('onboarding');
    AsyncStorage.removeItem(ONBOARDING_DONE_KEY).catch(() => undefined);
  }, []);

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
        {stage === 'home' && (
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
