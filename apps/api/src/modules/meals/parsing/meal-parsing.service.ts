import { Inject, Injectable } from '@nestjs/common';
import type { MealItemDraft } from '@tula/shared';
import { AI_TIMEOUTS_MS } from '../../../ai/ai.constants';
import { LlmProvider } from '../../../ai/llm-provider';
import { mealParseInputs, mealParsePrompt } from '../../../ai/prompts';
import { MealEnricher } from '../meal-enricher';
import { MealInputParser, type ParseSource, type RawMealInput } from './meal-input-parser';

export const MEAL_INPUT_PARSERS = Symbol('MEAL_INPUT_PARSERS');

export type ParseResult =
  | { outcome: 'parsed'; items: MealItemDraft[] }
  | { outcome: 'not_food' }
  | { outcome: 'nothing_recognised' };

/** Turns any meal input into enriched draft items. AI failures propagate as AiUnavailableError. */
@Injectable()
export class MealParsingService {
  private readonly parsers: ReadonlyMap<ParseSource, MealInputParser>;

  constructor(
    @Inject(MEAL_INPUT_PARSERS) parsers: MealInputParser[],
    private readonly llm: LlmProvider,
    private readonly enricher: MealEnricher,
  ) {
    this.parsers = new Map(parsers.map((parser) => [parser.source, parser]));
  }

  async parse(userId: string, input: RawMealInput): Promise<ParseResult> {
    const parser = this.parsers.get(input.source);
    if (!parser) throw new Error(`No parser for ${input.source}`);

    const output = await this.llm.generateStructured({
      prompt: mealParsePrompt,
      inputs: mealParseInputs(await parser.toModelInput(userId, input)),
      timeoutMs: AI_TIMEOUTS_MS.mealParse,
    });
    if (!output.isFood) return { outcome: 'not_food' };
    if (output.items.length === 0) return { outcome: 'nothing_recognised' };
    return { outcome: 'parsed', items: await this.enricher.enrich(output.items) };
  }
}
