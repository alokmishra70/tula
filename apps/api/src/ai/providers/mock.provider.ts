import { randomUUID } from 'node:crypto';
import type { PortionUnit } from '@tula/shared';
import { LlmUnsupportedInputError } from '../llm-errors';
import {
  LlmProvider,
  type InputPart,
  type LlmChatChunk,
  type LlmChatRequest,
  type StructuredRequest,
  type ToolCall,
} from '../llm-provider';
import type { MealParseOutput, ReportExtractOutput } from '../prompts';

type Handler = (inputs: InputPart[]) => unknown;

const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  half: 0.5,
};
const UNIT_WORDS: Record<string, PortionUnit> = {
  katori: 'katori',
  katoris: 'katori',
  bowl: 'bowl',
  bowls: 'bowl',
  glass: 'glass',
  glasses: 'glass',
  cup: 'cup',
  cups: 'cup',
  plate: 'plate',
  plates: 'plate',
  piece: 'piece',
  pieces: 'piece',
  slice: 'slice',
  slices: 'slice',
  tbsp: 'tbsp',
  spoon: 'tbsp',
};

const THALI: MealParseOutput['items'] = [
  item('Roti', 2, 'roti', 240, 7, 40, 6, 5),
  item('Dal tadka', 1, 'katori', 160, 9, 22, 4, 5),
  item('Aloo sabzi', 1, 'katori', 170, 3, 22, 8, 3),
  item('Curd', 1, 'katori', 90, 5, 6, 5, 0),
];

const SAMPLE_REPORT: ReportExtractOutput = {
  isLabReport: true,
  readable: true,
  labName: 'Sample Diagnostics',
  reportDate: '2026-09-02',
  rows: [
    { rawName: 'HbA1c', value: 5.9, unit: '%', refLow: 4, refHigh: 5.6 },
    { rawName: 'Fasting Blood Sugar', value: 104, unit: 'mg/dL', refLow: 70, refHigh: 100 },
    { rawName: 'Total Cholesterol', value: 228, unit: 'mg/dL', refLow: null, refHigh: 200 },
    { rawName: 'LDL Cholesterol', value: 152, unit: 'mg/dL', refLow: null, refHigh: 130 },
    { rawName: 'HDL Cholesterol', value: 41, unit: 'mg/dL', refLow: 40, refHigh: null },
    { rawName: 'Triglycerides', value: 168, unit: 'mg/dL', refLow: null, refHigh: 150 },
    { rawName: 'Vitamin D (25-OH)', value: 18, unit: 'ng/mL', refLow: 30, refHigh: 100 },
    { rawName: 'Vitamin B12', value: 310, unit: 'pg/mL', refLow: 200, refHigh: 900 },
    { rawName: 'Haemoglobin', value: 14.6, unit: 'g/dL', refLow: 13, refHigh: 17 },
    { rawName: 'TSH', value: 2.1, unit: 'µIU/mL', refLow: 0.4, refHigh: 4.5 },
  ],
};

/**
 * Offline stand-in for local development and tests. Only parsing prompts have handlers;
 * copywriting prompts throw so callers exercise their deterministic fallbacks.
 */
export class MockLlmProvider extends LlmProvider {
  readonly name = 'mock';

  private readonly handlers: Record<string, Handler> = {
    'meal-parse': (inputs) => parseMeal(inputs),
    'report-extract': () => SAMPLE_REPORT,
  };

  async generateStructured<T>({ prompt, inputs }: StructuredRequest<T>): Promise<T> {
    const handler = this.handlers[prompt.id];
    if (!handler) throw new LlmUnsupportedInputError(this.name, `No mock for prompt ${prompt.id}`);
    return prompt.schema.parse(handler(inputs));
  }

  async *streamText({ messages }: LlmChatRequest): AsyncIterable<LlmChatChunk> {
    const last = messages.at(-1);
    if (last?.role === 'tool') {
      yield* words(describeToolResult(last.name, last.content));
      return;
    }
    const call = last?.role === 'user' ? toolFor(last.content) : null;
    if (call) {
      yield { type: 'tool_call', call };
      return;
    }
    yield* words('I can help with your meals, your plan and your reports.');
  }
}

function item(
  name: string,
  quantity: number,
  unit: PortionUnit,
  kcal: number,
  proteinG: number,
  carbsG: number,
  fatG: number,
  fiberG: number,
): MealParseOutput['items'][number] {
  return {
    name,
    quantity,
    unit,
    kcal,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    confidence: 0.85,
    clarification: null,
  };
}

function parseMeal(inputs: InputPart[]): MealParseOutput {
  const description = inputs
    .filter((part): part is Extract<InputPart, { type: 'text' }> => part.type === 'text')
    .map((part) => /<meal_description>\n([\s\S]*)\n<\/meal_description>/.exec(part.text)?.[1])
    .find(Boolean);
  if (!description) return { isFood: true, items: THALI };

  const items = description
    .split(/,|\band\b|\+|&/i)
    .map((segment) => segment.trim().toLowerCase())
    .filter(Boolean)
    .map((segment) => {
      const tokens = segment.split(/\s+/);
      let quantity = 1;
      const first = tokens[0] ?? '';
      if (/^\d+(\.\d+)?$/.test(first)) quantity = Number(tokens.shift());
      else if (first in NUMBER_WORDS) quantity = NUMBER_WORDS[tokens.shift()!]!;
      const unit = UNIT_WORDS[tokens[0] ?? ''];
      if (unit) tokens.shift();
      if (tokens[0] === 'of') tokens.shift();
      const name = tokens.join(' ').replace(/(?<!s)s$/, '');
      return {
        ...item(capitalise(name), quantity, unit ?? 'serving', 150 * quantity, 5, 20, 5, 2),
        confidence: 0.7,
      };
    })
    .filter((parsed) => parsed.name.length > 0);
  return { isFood: items.length > 0, items };
}

function toolFor(message: string): ToolCall | null {
  const text = message.toLowerCase();
  const call = (name: string, args: Record<string, unknown> = {}) => ({
    id: randomUUID(),
    name,
    arguments: args,
  });
  const logged = /^(log|ate|had)\s+(.+)/.exec(text);
  if (logged) return call('log_meal', { description: logged[2] });
  if (/week/.test(text)) return call('get_week_history');
  if (/report|marker|ldl|hba1c|vitamin/.test(text)) return call('get_report_markers');
  if (/today|doing|left|dinner|eat/.test(text)) return call('get_today_summary');
  return null;
}

function* words(sentence: string): Generator<LlmChatChunk> {
  for (const word of sentence.split(/(?<= )/)) yield { type: 'text', text: word };
}

const round = (value: unknown) => Math.round(Number(value) || 0).toLocaleString('en-IN');

/** Plain-language replies built only from the tool's numbers, as a real model is told to do. */
function describeToolResult(tool: string, content: string): string {
  const data: unknown = JSON.parse(content);
  switch (tool) {
    case 'get_today_summary': {
      const { eaten, kcalRemaining } = data as {
        eaten: { proteinG: number };
        kcalRemaining: number;
      };
      return kcalRemaining >= 0
        ? `${round(kcalRemaining)} kcal left today, with ${round(eaten.proteinG)} g protein so far.`
        : `About ${round(-kcalRemaining)} kcal over today. Tomorrow's a fresh ring.`;
    }
    case 'get_week_history': {
      const days = data as Array<{ onTarget: boolean }>;
      return `${days.filter((day) => day.onTarget).length} of the last ${days.length} days were on target.`;
    }
    case 'get_report_markers': {
      const flagged = (data as Array<{ marker: string; status: string }>).filter(
        (m) => m.status !== 'in_range',
      );
      return flagged.length
        ? `To watch: ${flagged.map((m) => `${m.marker} ${m.status.replace('_', ' ')}`).join(', ')}. Worth a chat with your doctor.`
        : 'All your markers are in range.';
    }
    case 'log_meal': {
      const result = data as { logged: boolean; items?: string[]; kcalRemainingToday?: number };
      return result.logged
        ? `Logged ${(result.items ?? []).join(', ')}. ${round(result.kcalRemainingToday)} kcal left today.`
        : "I couldn't log that. Try naming the dish and amount.";
    }
    default:
      return 'Done.';
  }
}

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
