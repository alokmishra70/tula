import { MARKER_CODES, type AddBiomarkerRequest, type MarkerCode } from '@tula/shared';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors, layout, radius, spacing, typography } from '@/theme';
import { Button, Chip, ChipRow, Text } from '@/ui';
import { MARKER_LABELS } from '../copy';

const DEFAULT_UNITS: Record<MarkerCode, string> = {
  hba1c: '%',
  fasting_glucose: 'mg/dL',
  total_cholesterol: 'mg/dL',
  ldl: 'mg/dL',
  hdl: 'mg/dL',
  triglycerides: 'mg/dL',
  vitamin_d: 'ng/mL',
  vitamin_b12: 'pg/mL',
  haemoglobin: 'g/dL',
  tsh: 'µIU/mL',
  creatinine: 'mg/dL',
  uric_acid: 'mg/dL',
};

/** For partial extractions: add a value the reader missed. */
export function AddMarkerForm({
  present,
  onAdd,
}: {
  present: MarkerCode[];
  onAdd: (body: AddBiomarkerRequest) => Promise<unknown>;
}) {
  const missing = MARKER_CODES.filter((code) => !present.includes(code));
  const [code, setCode] = useState<MarkerCode | null>(null);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const parsed = Number(value.replace(',', '.'));
  if (missing.length === 0) return null;

  return (
    <View style={styles.root}>
      <Text variant="heading">Add a missing value</Text>
      <ChipRow>
        {missing.map((option) => (
          <Chip
            key={option}
            label={MARKER_LABELS[option]}
            selected={code === option}
            onPress={() => setCode(option)}
          />
        ))}
      </ChipRow>
      {code ? (
        <View style={styles.row}>
          <TextInput
            value={value}
            onChangeText={setValue}
            keyboardType="decimal-pad"
            placeholder="Value"
            placeholderTextColor={colors.inkFaint}
            accessibilityLabel={`${MARKER_LABELS[code]} value in ${DEFAULT_UNITS[code]}`}
            style={styles.input}
          />
          <Text variant="body" color="inkMuted">
            {DEFAULT_UNITS[code]}
          </Text>
          <Button
            label="Add"
            loading={saving}
            disabled={!value.trim() || !Number.isFinite(parsed)}
            onPress={() => {
              setSaving(true);
              void onAdd({ code, value: parsed, unit: DEFAULT_UNITS[code] })
                .then(() => {
                  setCode(null);
                  setValue('');
                })
                .finally(() => setSaving(false));
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
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
