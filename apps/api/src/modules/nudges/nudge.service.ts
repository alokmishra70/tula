import { Inject, Injectable } from '@nestjs/common';
import type { Nudge } from '@tula/shared';
import { AI_TIMEOUTS_MS } from '../../ai/ai.constants';
import { LlmProvider } from '../../ai/llm-provider';
import { nudgeCopyInputs, nudgeCopyPrompt } from '../../ai/prompts';
import { Clock } from '../../common/clock';
import { AppException } from '../../common/errors/app.exception';
import {
  NUDGE_COOLDOWN_MS,
  NudgeEngine,
  type NudgeCandidate,
  type NudgeContext,
} from '../../domain/nudges';
import { NudgeRepository, type NudgeRecord } from './nudge.repository';

export const NUDGE_ENGINE = Symbol('NUDGE_ENGINE');

@Injectable()
export class NudgeService {
  constructor(
    @Inject(NUDGE_ENGINE) private readonly engine: NudgeEngine,
    private readonly nudges: NudgeRepository,
    private readonly llm: LlmProvider,
    private readonly clock: Clock,
  ) {}

  /** At most one nudge; the same one keeps showing while it applies. */
  async current(userId: string, context: NudgeContext): Promise<Nudge | null> {
    const now = this.clock.now();
    const history = await this.nudges.shownSince(
      userId,
      new Date(now.getTime() - NUDGE_COOLDOWN_MS),
    );
    const candidate = this.engine.select(context, history, now);
    if (!candidate) return null;

    // Same nudge as before; the live rule supplies the label so it stays consistent.
    const active = history.find((entry) => !entry.resolved && entry.rule === candidate.rule);
    if (active) return toDto({ ...active, actionLabel: candidate.actionLabel });

    const created = await this.nudges.create(
      userId,
      {
        rule: candidate.rule,
        message: await this.writeCopy(candidate),
        action: candidate.action,
        mealType: candidate.mealType,
        shownAt: now,
      },
      candidate.actionLabel,
    );
    return toDto(created);
  }

  async resolve(userId: string, id: string, how: 'acted' | 'dismissed'): Promise<void> {
    if (!(await this.nudges.resolve(userId, id, how, this.clock.now())))
      throw AppException.notFound('Nudge');
  }

  private async writeCopy(candidate: NudgeCandidate): Promise<string> {
    try {
      const { message } = await this.llm.generateStructured({
        prompt: nudgeCopyPrompt,
        inputs: nudgeCopyInputs({
          rule: candidate.rule,
          draft: candidate.fallbackMessage,
          facts: candidate.facts,
        }),
        timeoutMs: AI_TIMEOUTS_MS.copy,
      });
      return message;
    } catch {
      return candidate.fallbackMessage;
    }
  }
}

const toDto = ({ id, rule, message, action, actionLabel, mealType }: NudgeRecord): Nudge => ({
  id,
  rule,
  message,
  action,
  actionLabel,
  mealType,
});
