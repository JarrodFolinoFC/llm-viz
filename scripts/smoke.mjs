#!/usr/bin/env node
// Smoke-sweep the app: visit every page in navigation.tsx (or the paths given),
// optionally step the trainer on training pages, and report page/console
// errors and the table count per page. Exits non-zero if any page errored.
//
//   node scripts/smoke.mjs                    # every nav page
//   node scripts/smoke.mjs --step 1           # …and press `n` once on each
//   node scripts/smoke.mjs /mlp/training /rnn/training/scalar
//   --base URL   dev server base (default http://127.0.0.1:5174/llm-training)

import { launch, openStage, navPaths, DEFAULT_BASE } from './browse.mjs';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args.splice(i, 2)[1] : undefined;
};
const base = flag('--base') ?? DEFAULT_BASE;
const steps = Number(flag('--step') ?? 0);
const paths = args.length ? args : navPaths();

const { browser, page, errors } = await launch();
let failed = 0;
try {
  for (const path of paths) {
    errors.length = 0;
    // Only training pages have the `n` step binding; pressing it elsewhere is a no-op.
    await openStage(page, path, { base, steps: path.includes('/training') ? steps : 0 });
    const tables = await page.locator('table').count();
    const ok = errors.length === 0;
    if (!ok) failed++;
    console.log(`${ok ? '✓' : '✗'} ${path}  (${tables} tables)`);
    for (const e of errors) console.log(`    ${e}`);
  }
} finally {
  await browser.close();
}
if (failed) {
  console.log(`\n${failed}/${paths.length} pages had errors`);
  process.exitCode = 1;
} else {
  console.log(`\nall ${paths.length} pages clean`);
}
