import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.join(__dirname, '../..');
const testDb = path.join(backendDir, 'prisma/test.db');

process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
fs.closeSync(fs.openSync(testDb, 'w'));

execSync('npx prisma db push --skip-generate', {
  cwd: backendDir,
  env: { ...process.env, DATABASE_URL: 'file:./test.db' },
  stdio: 'pipe',
});
