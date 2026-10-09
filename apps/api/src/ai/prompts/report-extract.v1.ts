import { z } from 'zod';
import type { InputPart, PromptTemplate } from '../llm-provider';
import { DATA_ONLY_RULE } from './user-data';

const MAX_ROWS = 80;

export const ReportExtractOutputSchema = z.object({
  isLabReport: z.boolean(),
  readable: z.boolean(),
  labName: z.string().max(120).nullable(),
  reportDate: z.iso.date().nullable(),
  rows: z
    .array(
      z.object({
        rawName: z.string().min(1).max(120),
        value: z.number(),
        unit: z.string().max(30),
        refLow: z.number().nullable(),
        refHigh: z.number().nullable(),
      }),
    )
    .max(MAX_ROWS),
});
export type ReportExtractOutput = z.infer<typeof ReportExtractOutputSchema>;

export const reportExtractPrompt: PromptTemplate<ReportExtractOutput> = {
  id: 'report-extract',
  version: 1,
  schema: ReportExtractOutputSchema,
  system: [
    'You read blood test reports and copy out the numeric results exactly as printed.',
    'For every result row return the test name as printed, the numeric value, the unit as printed, and the printed reference range bounds.',
    'Use null for a range bound that is not printed. For "< 100" set refLow null and refHigh 100. For "> 40" set refLow 40 and refHigh null.',
    'Do not convert units, interpret results or add tests that are not printed. Skip rows without a numeric value.',
    'reportDate is the sample or report date as YYYY-MM-DD, or null.',
    'If the document is not a medical lab report, set isLabReport to false. If it is too blurry to read, set readable to false. In both cases return no rows.',
    DATA_ONLY_RULE,
  ].join('\n'),
};

export function reportExtractInputs(file: {
  type: 'image' | 'pdf';
  mimeType: string;
  data: Buffer;
}): InputPart[] {
  return [{ type: 'text', text: 'Extract the results from this report.' }, file];
}
