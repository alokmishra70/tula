import { DEMO_DEVICE_IDS } from '@tula/shared';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { setDeviceId } from '@/lib/device-id';
import { queryClient } from '@/lib/query-client';
import { useSession } from '@/lib/session';
import { spacing } from '@/theme';
import { Button, Sheet, Text } from '@/ui';

const PROFILES = [
  { key: 'rohan', title: 'Rohan, 31', detail: 'Losing weight. LDL 152, HbA1c 5.9.' },
  { key: 'priya', title: 'Priya, 38', detail: 'Improving markers. Low vitamin D and B12.' },
] as const;

/** Hidden from regular users: long-press the welcome title to load a seeded profile. */
export function DemoSwitcher({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const load = async (key: keyof typeof DEMO_DEVICE_IDS) => {
    await loadDemoProfile(key);
    onClose();
    router.replace('/today');
  };
  return (
    <Sheet open={open} onClose={onClose} title="Demo profiles">
      <View style={styles.root}>
        {PROFILES.map((profile) => (
          <View key={profile.key} style={styles.option}>
            <Text variant="heading">{profile.title}</Text>
            <Text variant="caption" color="inkMuted">
              {profile.detail}
            </Text>
            <Button
              label={`Open as ${profile.title.split(',')[0]}`}
              variant="secondary"
              onPress={() => void load(profile.key)}
            />
          </View>
        ))}
      </View>
    </Sheet>
  );
}

export const loadDemoProfile = async (key: keyof typeof DEMO_DEVICE_IDS) => {
  await setDeviceId(DEMO_DEVICE_IDS[key]);
  queryClient.clear();
  useSession.getState().setOnboarded(true);
};

const styles = StyleSheet.create({
  root: { gap: spacing.lg },
  option: { gap: spacing.xs },
});
