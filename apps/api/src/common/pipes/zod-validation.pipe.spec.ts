import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(z.object({ age: z.number().min(15) }));

  it('returns parsed data on success', () => {
    expect(pipe.transform({ age: 31 })).toEqual({ age: 31 });
  });

  it('throws validation_failed with field paths', () => {
    expect(() => pipe.transform({ age: 3 })).toThrow(
      expect.objectContaining({
        code: 'validation_failed',
        details: [expect.objectContaining({ path: 'age' })],
      }),
    );
  });
});
