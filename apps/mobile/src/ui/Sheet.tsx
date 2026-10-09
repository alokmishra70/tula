import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { X } from './icons';
import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBreakpoint } from '@/lib/use-breakpoint';
import { colors, elevation, layout, motion, radius, spacing } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Sticky area under the content, e.g. the "Log meal" button. */
  footer?: ReactNode;
}

const SNAP_POINTS = ['60%', '92%'];

/** One sheet API: bottom sheet under 768 px, centred modal above. Screens never branch on platform. */
export function Sheet(props: SheetProps) {
  const desktop = useBreakpoint() === 'desktop';
  if (desktop) return <ModalSheet {...props} placement="center" />;
  // The gesture-driven sheet is native-only; narrow browsers get a bottom-anchored modal.
  if (Platform.OS === 'web') return <ModalSheet {...props} placement="bottom" />;
  return <BottomSheet {...props} />;
}

function SheetHeader({ title, onClose }: { title?: string; onClose: () => void }) {
  return (
    <View style={styles.header}>
      <Text variant="heading" accessibilityRole="header" style={styles.headerTitle}>
        {title ?? ''}
      </Text>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
        hitSlop={spacing.sm}
      >
        <Icon icon={X} color="inkMuted" />
      </Pressable>
    </View>
  );
}

function BottomSheet({ open, onClose, title, children, footer }: SheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (open) ref.current?.present();
    else ref.current?.dismiss();
  }, [open]);

  const renderBackdrop = useCallback(
    (backdrop: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...backdrop}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={SNAP_POINTS}
      enableDynamicSizing={false}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      animationConfigs={reduceMotion ? { duration: 1 } : { damping: motion.sheetDamping }}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handle}
      accessibilityViewIsModal
    >
      <SheetHeader title={title} onClose={() => ref.current?.dismiss()} />
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </BottomSheetScrollView>
      {footer ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>{footer}</View>
      ) : null}
    </BottomSheetModal>
  );
}

function ModalSheet({
  open,
  onClose,
  title,
  children,
  footer,
  placement,
}: SheetProps & { placement: 'center' | 'bottom' }) {
  const bottom = placement === 'bottom';
  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <Modal
      visible={open}
      transparent
      animationType={bottom ? 'slide' : 'fade'}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, bottom && styles.overlayBottom]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.modal, bottom && styles.modalBottom]} accessibilityViewIsModal>
          <SheetHeader title={title} onClose={onClose} />
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: layout.hairline,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
  },
  sheetBackground: { backgroundColor: colors.surface, borderRadius: radius.lg },
  handle: { backgroundColor: colors.line },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.scrim,
    padding: spacing.xl,
  },
  overlayBottom: { justifyContent: 'flex-end', padding: 0 },
  modalBottom: {
    maxWidth: '100%',
    maxHeight: '92%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  modal: {
    width: '100%',
    maxWidth: layout.modalWidth,
    maxHeight: '90%',
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...elevation,
  },
});
