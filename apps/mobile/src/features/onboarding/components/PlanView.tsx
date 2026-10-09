import type { Plan } from '@tula/shared';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { formatNumber } from '@/lib/format';
import { spacing } from '@/theme';
import { Card, Chip, ChipRow, LeafIllustration, Text, useCountUp } from '@/ui';
import { ProjectionLine } from './ProjectionLine';

/** WHAT (targets), WHY (personal reasoning) and HOW (children) in one view. */
export function PlanView({ plan, children }: { plan: Plan; children?: ReactNode }) {
  const kcal = useCountUp(plan.targets.kcal);
  const { targets } = plan;
  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <LeafIllustration drawIn />
        <Text
          variant="display"
          numeric
          accessibilityLabel={`${formatNumber(targets.kcal)} kilocalories a day`}
        >
          {formatNumber(kcal)} kcal a day
        </Text>
        <ChipRow>
          <Chip label={`${targets.proteinG} g protein`} />
          <Chip label={`${targets.fiberG} g fibre`} />
          <Chip label={`${formatNumber(targets.waterMl / 1000, 1)} L water`} />
        </ChipRow>
      </View>

      <Card accentBorder>
        <Text variant="caption" color="inkMuted">
          Why this plan
        </Text>
        <Text variant="body">{plan.reasoning}</Text>
        <ProjectionLine projection={plan.projection} />
      </Card>

      {plan.foodSuggestions.length > 0 ? (
        <Card variant="sunken">
          <Text variant="caption" color="inkMuted">
            Foods that help
          </Text>
          <Text variant="body">{plan.foodSuggestions.join(' · ')}</Text>
        </Card>
      ) : null}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  hero: { gap: spacing.sm, paddingTop: spacing.lg },
});
