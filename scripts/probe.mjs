#!/usr/bin/env node
// Inspect a stage page's tables and flash-highlight state from the CLI —
// the manual dev loop (open page, step, read the DOM) as one command.
//
//   node scripts/probe.mjs /bigram/training/scalar --step 1
//   node scripts/probe.mjs /bigram/training/scalar --step 1 --shot /tmp/w.png
//   node scripts/probe.mjs /mlp/training --dump --json
//
// Flags:
//   --step N        press the `n` step binding N times after load
//   --dump          print every table's headers + row headings
//   --shot FILE     full-page screenshot
//   --json          machine-readable snapshot instead of prose
//   --base URL      dev server base (default http://127.0.0.1:5174/llm-training)

import { launch, openStage, snapshot, describeState, DEFAULT_BASE } from './browse.mjs';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args.splice(i, 2)[1] : undefined;
};
const has = (name) => {
  const i = args.indexOf(name);
  return i >= 0 && !!args.splice(i, 1);
};

const base = flag('--base') ?? DEFAULT_BASE;
const steps = Number(flag('--step') ?? 0);
const shot = flag('--shot');
const json = has('--json');
const dump = has('--dump');
const path = args[0];
if (!path) {
  console.error('usage: node scripts/probe.mjs <path> [--step N] [--dump] [--shot file] [--json]');
  process.exit(1);
}

const { browser, page, errors } = await launch();
try {
  await openStage(page, path, { base, steps });

  const report = (label, tables) => {
    if (json) return console.log(JSON.stringify({ label, tables }, null, 2));
    console.log(`--- ${label}`);
    const lines = describeState(tables);
    console.log(lines.length ? lines.map((l) => `  ${l}`).join('\n') : '  (no active highlights)');
  };

  const tables = await snapshot(page);
  if (dump) {
    for (const t of tables) {
      console.log(`table ${t.ti}: [${t.headers.map((h) => h.text).join(' | ')}]`);
      console.log(`  rows: ${t.rows.map((r) => r.heading).join(' · ')}`);
    }
  }
  report(`${path} after ${steps} step(s)`, tables);

  if (shot) {
    await page.screenshot({ path: shot, fullPage: true });
    console.log(`screenshot: ${shot}`);
  }
  if (errors.length) {
    console.log('errors:');
    for (const e of errors) console.log(`  ${e}`);
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
