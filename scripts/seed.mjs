import { readFile } from 'node:fs/promises';
// No administrative credentials are needed for catalogue setup.
// Run this SQL in the project's owner-only SQL Editor AFTER 001_bella.sql.
process.stdout.write(await readFile(new URL('../supabase/seed.sql', import.meta.url), 'utf8'));
