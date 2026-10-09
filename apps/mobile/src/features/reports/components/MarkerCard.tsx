import type { Biomarker, UpdateBiomarkerRequest } from '@tula/shared';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { formatNumber } from '@/lib/format';
import { colors, layout, radius, spacing, typography } from '@/theme';
import { Button, Card, ChevronDown, Chip, Icon, RangeBar, Sparkline, Text } from '@/ui';
import { MARKER_LABELS, STATUS_CHIP, STATUS_WORD } from '../copy';

export interface MarkerCardProps {
  marker: Biomarker;
  initiallyExpanded?: boolean;
  onCorrect: (body: UpdateBiomarkerRequest) => Promise<unknown>;
}

export function MarkerCard({ marker, initiallyExpanded = false, onCorrect }: MarkerCardProps) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [editing, setEditing] = useState(marker.needsConfirmation);
  const name = marker.code ? MARKER_LABELS[marker.code] : marker.rawName;
  const value = marker.normalizedValue ?? marker.value;
  const unit = marker.canonicalUnit ?? marker.unit;
  const chip = STATUS_CHIP[marker.status];

  return (
    <Card>
      <Pressable
        onPress={() => setExpanded((open) => !open)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${name} ${formatNumber(value, 1)} ${unit}, ${STATUS_WORD[marker.status]}`}
        style={styles.header}
      >
        <View style={styles.title}>
          <Text variant="heading">{name}</Text>
          <Text variant="body" numeric>
            {formatNumber(value, 1)}{' '}
            <Text variant="caption" color="inkMuted">
              {unit}
            </Text>
          </Text>
        </View>
        <Chip label={STATUS_WORD[marker.status]} status={chip} />
        <Icon icon={ChevronDown} color="inkFaint" />
      </Pressable>

      {marker.status !== 'unclassified' ? (
        <RangeBar
          value={value}
          low={marker.refLow}
          high={marker.refHigh}
          status={marker.status}
          unit={unit}
        />
      ) : null}

      {marker.status === 'critical' ? (
        <Text variant="bodyStrong" color="alert">
          Please see a doctor soon about this value.
        </Text>
      ) : null}

      {expanded && marker.explanation ? (
        <View style={styles.details}>
          <Text variant="body">{marker.explanation.what}</Text>
          <Text variant="body" color="inkMuted">
            {marker.explanation.why}
          </Text>
          {marker.explanation.action ? (
            <View style={styles.action}>
              <Text variant="caption" color="inkMuted">
                Your daily action
              </Text>
              <Text variant="bodyStrong" color="accent">
                {marker.explanation.action}
              </Text>
            </View>
          ) : null}
          {marker.trend.length > 1 ? (
            <Sparkline
              values={marker.trend.map((point) => point.value)}
              accessibilityLabel={`${name} over ${marker.trend.length} reports, latest ${formatNumber(value, 1)}`}
            />
          ) : null}
        </View>
      ) : null}

      {marker.needsConfirmation || editing ? (
        <CorrectValue
          initial={marker.value}
          unit={marker.unit}
          prompt={
            marker.needsConfirmation
              ? 'This value looks unusual. Check it against your report.'
              : 'Correct the value'
          }
          onSave={async (next) => {
            await onCorrect({ value: next });
            setEditing(false);
          }}
        />
      ) : expanded ? (
        <Button label="Correct this value" variant="ghost" onPress={() => setEditing(true)} />
      ) : null}
    </Card>
  );
}

function CorrectValue({
  initial,
  unit,
  prompt,
  onSave,
}: {
  initial: number;
  unit: string;
  prompt: string;
  onSave: (value: number) => Promise<void>;
}) {
  const [text, setText] = useState(String(initial));
  const [saving, setSaving] = useState(false);
  const parsed = Number(text.replace(',', '.'));
  const valid = text.trim() !== '' && Number.isFinite(parsed) && parsed >= 0;
  return (
    <View style={styles.correct}>
      <Text variant="caption" color="warn">
        {prompt}
      </Text>
      <View style={styles.correctRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          keyboardType="decimal-pad"
          accessibilityLabel={`Value in ${unit}`}
          style={styles.input}
        />
        <Text variant="body" color="inkMuted">
          {unit}
        </Text>
        <Button
          label="Confirm"
          disabled={!valid}
          loading={saving}
          onPress={() => {
            setSaving(true);
            void onSave(parsed).finally(() => setSaving(false));
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: layout.minTouchTarget,
  },
  title: { flex: 1, gap: spacing.xxs / 2 },
  details: { gap: spacing.xs },
  action: {
    gap: spacing.xxs,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
  },
  correct: { gap: spacing.xs },
  correctRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    ...typography.body,
    flex: 1,
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSunken,
    color: colors.ink,
  },
});
