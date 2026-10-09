import { StyleSheet, View } from 'react-native';
import { spacing } from '@/theme';
import { Button, Card, FileUp, Text } from '@/ui';

export interface UploadCardProps {
  onUpload: () => void;
  uploading: boolean;
  title?: string;
}

export function UploadCard({
  onUpload,
  uploading,
  title = 'Add a lab report (PDF or photo)',
}: UploadCardProps) {
  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.text}>
          <Text variant="heading">{title}</Text>
          <Text variant="caption" color="inkMuted">
            Up to 10 MB. I read the values; you stay in charge.
          </Text>
        </View>
      </View>
      <Button
        label={uploading ? 'Uploading' : 'Choose file'}
        icon={FileUp}
        onPress={onUpload}
        loading={uploading}
        variant="secondary"
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  text: { flex: 1, gap: spacing.xxs },
});
