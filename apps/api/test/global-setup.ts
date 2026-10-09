import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { config } from 'dotenv';

export default function globalSetup(): void {
  config({ path: resolve(__dirname, '../.env.test'), override: true, quiet: true });
  const cwd = resolve(__dirname, '..');
  execSync('npx prisma migrate deploy', { cwd, stdio: 'ignore' });
  execSync('npx tsx prisma/seed/index.ts --dishes-only', { cwd, stdio: 'ignore' });
}
