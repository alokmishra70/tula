import { Redirect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { DemoSwitcher, loadDemoProfile, useOnboarding } from '@/features/onboarding';
import { spacing } from '@/theme';
import { Button, LeafIllustration, Screen, Text } from '@/ui';

export default function WelcomeScreen() {
  const router = useRouter();
  const { step, mode, start } = useOnboarding();
  const [demoOpen, setDemoOpen] = useState(false);
  const { demo, next } = useLocalSearchParams<{ demo?: string; next?: string }>();

  // Development shortcut for screenshots and reviews: /welcome?demo=rohan&next=/reports
  useEffect(() => {
    if (__DEV__ && (demo === 'rohan' || demo === 'priya')) {
      void loadDemoProfile(demo).then(() =>
        router.replace((next?.startsWith('/') ? next : '/today') as Href),
      );
    }
  }, [demo, next, router]);

  if (mode === 'setup' && step !== 'welcome') return <Redirect href={`/${step}`} />;

  return (
    <Screen
      footer={
        <Button
          label="Start"
          size="l"
          fullWidth
          onPress={() => {
            start('setup');
            router.push('/goal');
          }}
        />
      }
    >
      <View style={styles.hero}>
        <LeafIllustration />
        <Pressable
          onLongPress={() => setDemoOpen(true)}
          delayLongPress={800}
          accessibilityRole="header"
        >
          <Text variant="display">Let&apos;s set up your plan. About a minute.</Text>
        </Pressable>
        <Text variant="body" color="inkMuted">
          Photograph your meals. I&apos;ll do the maths and tell you what to do next.
        </Text>
      </View>
      <DemoSwitcher open={demoOpen} onClose={() => setDemoOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.lg, paddingTop: spacing.xxxl },
});
