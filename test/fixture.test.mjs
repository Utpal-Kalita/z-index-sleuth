import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parseResponse, validateRepair } from '../lib/repair.mjs';

test('actual fixture CSS validation between baseline and repaired', async () => {
  const baselinePath = fileURLToPath(new URL('../baseline/fixture.css', import.meta.url));
  const repairedPath = fileURLToPath(new URL('../public/evidence/repaired.css', import.meta.url));

  const baseCss = await fs.readFile(baselinePath, 'utf8');
  assert.ok(baseCss.includes('.loading-overlay'));

    const repairedCss = await fs.readFile(repairedPath, 'utf8');
    assert.ok(repairedCss.length > 0);
    validateRepair(baseCss, repairedCss);
});
