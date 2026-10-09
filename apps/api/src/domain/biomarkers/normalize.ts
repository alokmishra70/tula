import type { MarkerCode, MarkerStatus, Sex } from '@tula/shared';
import { classify } from './classify';
import {
  defaultRange,
  MARKER_REGISTRY,
  type MarkerDefinition,
  type Range,
} from './marker-registry';

export interface RawMarker {
  rawName: string;
  value: number;
  unit: string;
  refLow: number | null;
  refHigh: number | null;
}

export type ReviewReason = 'unknown_unit' | 'implausible_value';

export interface NormalizedMarker {
  code: MarkerCode | null;
  normalizedValue: number | null;
  canonicalUnit: string | null;
  range: Range;
  status: MarkerStatus;
  needsConfirmation: boolean;
  reviewReason: ReviewReason | null;
}

// Names containing these words are related tests we don't support (e.g. "Non-HDL", "LDL/HDL ratio").
const EXCLUDED_TOKENS = new Set(['non', 'vldl', 'ratio', 'index']);

const tokens = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);

const ALIAS_INDEX = [...MARKER_REGISTRY.values()]
  .flatMap((definition) =>
    definition.aliases.map((alias) => ({ definition, tokens: tokens(alias) })),
  )
  .sort((a, b) => b.tokens.join(' ').length - a.tokens.join(' ').length);

function containsPhrase(haystack: string[], phrase: string[]): boolean {
  for (let i = 0; i + phrase.length <= haystack.length; i++) {
    if (phrase.every((token, offset) => haystack[i + offset] === token)) return true;
  }
  return false;
}

export function resolveMarker(rawName: string): MarkerDefinition | null {
  const nameTokens = tokens(rawName);
  if (nameTokens.some((token) => EXCLUDED_TOKENS.has(token))) return null;
  return ALIAS_INDEX.find((entry) => containsPhrase(nameTokens, entry.tokens))?.definition ?? null;
}

export function normalizeUnit(unit: string): string {
  return unit.toLowerCase().replace(/[µμ]/g, 'u').replace(/mcg/g, 'ug').replace(/\s+/g, '');
}

const round = (value: number) => Math.round(value * 100) / 100;

export function normalizeMarker(raw: RawMarker, sex: Sex): NormalizedMarker {
  const definition = resolveMarker(raw.rawName);
  if (!definition) {
    return {
      code: null,
      normalizedValue: null,
      canonicalUnit: null,
      range: { low: raw.refLow, high: raw.refHigh },
      status: 'unclassified',
      needsConfirmation: false,
      reviewReason: null,
    };
  }

  const convert = definition.units[normalizeUnit(raw.unit)];
  if (!convert) {
    return {
      code: definition.code,
      normalizedValue: null,
      canonicalUnit: definition.canonicalUnit,
      range: defaultRange(definition, sex),
      status: 'unclassified',
      needsConfirmation: true,
      reviewReason: 'unknown_unit',
    };
  }

  const normalizedValue = round(convert(raw.value));
  const printedRange: Range = {
    low: raw.refLow === null ? null : round(convert(raw.refLow)),
    high: raw.refHigh === null ? null : round(convert(raw.refHigh)),
  };
  const hasPrintedRange = printedRange.low !== null || printedRange.high !== null;
  const range = hasPrintedRange ? printedRange : defaultRange(definition, sex);
  const plausible =
    normalizedValue >= definition.plausible.min && normalizedValue <= definition.plausible.max;

  return {
    code: definition.code,
    normalizedValue,
    canonicalUnit: definition.canonicalUnit,
    range,
    status: classify(normalizedValue, range, definition.critical),
    needsConfirmation: !plausible,
    reviewReason: plausible ? null : 'implausible_value',
  };
}
