#!/usr/bin/env node
// Shared Playwright helpers for the dev-loop CLIs (probe.mjs, smoke.mjs):
// open a stage page against the local dev server, step the trainer, and read
// the flash-highlight state (the trained row) back out of the DOM as plain
// data.
//
// The state readers key off the CSS-module class *names* (rowHighlighted)
// which survive hashing as substrings — see web/primitives/MatrixTable.

import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export const DEFAULT_BASE = process.env.LLM_TRAINER_BASE ?? 'http://127.0.0.1:5174/llm-training';

/** All app routes, scraped from navigation.tsx so the list can't go stale. */
export function navPaths() {
  const src = readFileSync(resolve(import.meta.dirname, '../src/navigation.tsx'), 'utf8');
  return [...src.matchAll(/path: '([^']+)'/g)].map((m) => m[1]).filter((p) => p !== '/');
}

/** Launch a browser page with console/page errors collected into `errors`. */
export async function launch({ width = 1800, height = 1200 } = {}) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    // React dev warnings are noise here; keep real errors.
    if (m.type() === 'error' && !/Warning:/.test(m.text())) errors.push(`console: ${m.text()}`);
  });
  return { browser, page, errors };
}

/** Open a stage page and advance training `steps` times via the `n` binding
 *  (the trainer dock is collapsed by default, so the key is the reliable way). */
export async function openStage(page, path, { base = DEFAULT_BASE, steps = 0 } = {}) {
  await page.goto(base + path, { waitUntil: 'networkidle' });
  for (let s = 0; s < steps; s++) {
    await page.keyboard.press('n');
  }
  if (steps > 0) await page.waitForTimeout(400);
}

/** Read every table's highlight state: one entry per <table>, in DOM order. */
export function snapshot(page) {
  return page.evaluate(() => {
    const clip = (s, n = 24) => (s ?? '').trim().replace(/\s+/g, ' ').slice(0, n);
    return [...document.querySelectorAll('table')].map((t, ti) => {
      const headers = [...t.querySelectorAll('thead th')].map((th) => ({
        text: clip(th.textContent, 16),
      }));
      const rows = [...t.querySelectorAll('tbody tr')].map((tr) => ({
        heading: clip(tr.querySelector('th')?.textContent),
        highlighted: /rowHighlighted/.test(tr.className),
      }));
      return { ti, headers, rows };
    });
  });
}

/** One line per table that has any active flash-highlight state. */
export function describeState(tables) {
  const lines = [];
  for (const t of tables) {
    const flashed = t.rows.filter((r) => r.highlighted).map((r) => `r${t.rows.indexOf(r)}"${r.heading}"`);
    if (flashed.length) lines.push(`t${t.ti}: flash: ${flashed.join(' ')}`);
  }
  return lines;
}
