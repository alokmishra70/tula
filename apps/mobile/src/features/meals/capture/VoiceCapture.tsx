import { LIMITS } from '@tula/shared';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as Linking from 'expo-linking';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, withTiming } from 'react-native-reanimated';
import { haptics } from '@/lib/haptics';
import { colors, layout, radius, spacing } from '@/theme';
import { Button, Icon, Mic, Square, Text } from '@/ui';

const METER_FLOOR_DB = -60;
const MAX_PULSE = 0.3;
const MAX_MS = LIMITS.voiceMaxSeconds * 1000;

export interface VoiceCaptureProps {
  onRecorded: (uri: string, mimeType: string) => void;
  onTypeInstead: () => void;
}

const mimeFor = (uri: string) =>
  uri.endsWith('.webm') ? 'audio/webm' : uri.endsWith('.wav') ? 'audio/wav' : 'audio/mp4';

export function VoiceCapture({ onRecorded, onTypeInstead }: VoiceCaptureProps) {
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const state = useAudioRecorderState(recorder, 100);
  const [denied, setDenied] = useState(false);
  const stopping = useRef(false);
  const reduceMotion = useReducedMotion();

  const start = async () => {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setDenied(true);
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    haptics.light();
  };

  const stop = async () => {
    if (stopping.current) return;
    stopping.current = true;
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false });
    if (recorder.uri) onRecorded(recorder.uri, mimeFor(recorder.uri));
  };

  useEffect(() => {
    if (state.isRecording && state.durationMillis >= MAX_MS) void stop();
  });

  const level =
    state.metering === undefined
      ? 0
      : Math.max(0, 1 - (state.metering ?? METER_FLOOR_DB) / METER_FLOOR_DB);
  const pulse = useAnimatedStyle(() => ({
    transform: [{ scale: reduceMotion ? 1 : withTiming(1 + level * MAX_PULSE, { duration: 100 }) }],
  }));

  if (denied) {
    return (
      <View style={styles.root}>
        <Text variant="body" color="inkMuted" align="center">
          Tula needs the microphone to hear what you ate. Recordings are only used to log your meal.
        </Text>
        <Button
          label="Open settings"
          onPress={() => void Linking.openSettings()}
          variant="secondary"
        />
        <Button label="Type instead" variant="ghost" onPress={onTypeInstead} />
      </View>
    );
  }

  const seconds = Math.floor(state.durationMillis / 1000);
  return (
    <View style={styles.root}>
      <Text variant="body" color="inkMuted" align="center">
        {state.isRecording
          ? 'Listening. Say what you ate.'
          : 'Tap and say what you ate, in English or Hindi.'}
      </Text>
      <Animated.View style={[styles.halo, pulse]}>
        <Pressable
          onPress={() => void (state.isRecording ? stop() : start())}
          accessibilityRole="button"
          accessibilityLabel={state.isRecording ? 'Stop recording' : 'Start recording'}
          style={styles.mic}
        >
          <Icon icon={state.isRecording ? Square : Mic} color="onAccent" />
        </Pressable>
      </Animated.View>
      <Text variant="heading" numeric accessibilityLiveRegion="polite">
        0:{String(seconds).padStart(2, '0')} / 0:{LIMITS.voiceMaxSeconds}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xl },
  halo: { borderRadius: radius.pill, backgroundColor: colors.accentSoft, padding: spacing.md },
  mic: {
    width: layout.micButton,
    height: layout.micButton,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
