import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Linking from 'expo-linking';
import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { haptics } from '@/lib/haptics';
import { colors, layout, radius, spacing } from '@/theme';
import { Button, Icon, Image as ImageIcon, Text, X, Zap, ZapOff } from '@/ui';
import { pickPhoto } from './photo-picker';

export interface CameraCaptureProps {
  onCaptured: (uri: string) => void;
  onCancel: () => void;
  onTypeInstead: () => void;
}

/** Full-screen camera with a square guide; explains and offers typing when permission is denied. */
export function CameraCapture({ onCaptured, onCancel, onTypeInstead }: CameraCaptureProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [busy, setBusy] = useState(false);
  const camera = useRef<CameraView>(null);
  const { width } = useWindowDimensions();
  const guide = width * layout.cropGuide;

  const shoot = async () => {
    if (!camera.current || busy) return;
    setBusy(true);
    haptics.light();
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.8, skipProcessing: true });
      if (photo?.uri) onCaptured(photo.uri);
    } finally {
      setBusy(false);
    }
  };

  const fromGallery = async () => {
    const uri = await pickPhoto();
    if (uri) onCaptured(uri);
  };

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <Modal visible animationType="slide" onRequestClose={onCancel}>
        <SafeAreaView style={styles.permission}>
          <Text variant="title">Camera access</Text>
          <Text variant="body" color="inkMuted">
            Tula uses the camera only to photograph your meals. Photos stay private to you.
          </Text>
          {permission.canAskAgain ? (
            <Button label="Allow camera" onPress={() => void requestPermission()} />
          ) : (
            <Button label="Open settings" onPress={() => void Linking.openSettings()} />
          )}
          <Button
            label="Choose from gallery"
            variant="secondary"
            onPress={() => void fromGallery()}
          />
          <Button label="Type instead" variant="ghost" onPress={onTypeInstead} />
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onCancel}>
      <View style={styles.root}>
        <CameraView
          ref={camera}
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
        />
        <View pointerEvents="none" style={styles.guideWrap}>
          <View style={[styles.guide, { width: guide, height: guide }]} />
        </View>
        <SafeAreaView style={styles.controls} edges={['top', 'bottom']}>
          <View style={styles.topRow}>
            <ControlButton label="Close camera" onPress={onCancel}>
              <Icon icon={X} color="onAccent" />
            </ControlButton>
            <ControlButton
              label={torch ? 'Turn flash off' : 'Turn flash on'}
              onPress={() => setTorch((on) => !on)}
            >
              <Icon icon={torch ? Zap : ZapOff} color="onAccent" />
            </ControlButton>
          </View>
          <View style={styles.bottomRow}>
            <ControlButton label="Choose from gallery" onPress={() => void fromGallery()}>
              <Icon icon={ImageIcon} color="onAccent" />
            </ControlButton>
            <Pressable
              onPress={() => void shoot()}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Take photo"
              style={styles.shutter}
            />
            <View style={styles.spacer} />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function ControlButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.control}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cameraBg },
  guideWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guide: {
    borderWidth: layout.dotBorder,
    borderColor: colors.cameraGuide,
    borderRadius: radius.md,
  },
  controls: { flex: 1, justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.sm },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.xl,
  },
  control: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.scrim,
  },
  shutter: {
    width: layout.shutter,
    height: layout.shutter,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: spacing.xxs,
    borderColor: colors.cameraGuide,
  },
  spacer: { width: layout.minTouchTarget },
  permission: {
    flex: 1,
    gap: spacing.md,
    padding: spacing.xl,
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
