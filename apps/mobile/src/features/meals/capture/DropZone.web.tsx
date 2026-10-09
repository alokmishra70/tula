import { useState, type DragEvent } from 'react';
import { colors, layout, radius, spacing, typography } from '@/theme';

export function DropZone({ onFile }: { onFile: (uri: string) => void }) {
  const [over, setOver] = useState(false);
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setOver(false);
    const file = Array.from(event.dataTransfer.files).find((f) => f.type.startsWith('image/'));
    if (file) onFile(URL.createObjectURL(file));
  };
  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      style={{
        padding: spacing.lg,
        borderRadius: radius.md,
        border: `${layout.hairline}px dashed ${over ? colors.accent : colors.inkFaint}`,
        background: over ? colors.accentSoft : colors.surfaceSunken,
        color: colors.inkMuted,
        textAlign: 'center',
        fontFamily: typography.caption.fontFamily,
        fontSize: typography.caption.fontSize,
      }}
    >
      Or drop a meal photo here
    </div>
  );
}
