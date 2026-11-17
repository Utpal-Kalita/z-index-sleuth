import test from 'node:test';
import assert from 'node:assert';
import { parseResponse, validateRepair } from '../lib/repair.mjs';

test('parseResponse - JSON wrapper parsing (direct JSON string)', () => {
  const raw = JSON.stringify({ css: '.loading-overlay { pointer-events: none; }', explanation: 'Fixed overlay' });
  const res = parseResponse(raw);
  assert.strictEqual(res.css, '.loading-overlay { pointer-events: none; }');
  assert.strictEqual(res.explanation, 'Fixed overlay');
});

test('parseResponse - JSON wrapper parsing (CLI response wrapper with markdown code fence)', () => {
  const inner = JSON.stringify({ css: '.loading-overlay { pointer-events: none; }', explanation: 'Fixed overlay' });
  const raw = JSON.stringify({ response: `\`\`\`json\n${inner}\n\`\`\`` });
  const res = parseResponse(raw);
  assert.strictEqual(res.css, '.loading-overlay { pointer-events: none; }');
});

test('parseResponse - invalid json or missing fields throws', () => {
  assert.throws(() => parseResponse('not json'), /JSON/);
  assert.throws(() => parseResponse(JSON.stringify({ css: 'foo' })), /Gemini did not return/);
});

test('validateRepair - CSS mutation guard acceptance of actual source repair', () => {
  const original = '.loading-overlay { display: block; } #generate-btn { color: red; }';
  const proposed = '.loading-overlay { display: block; pointer-events: none; } #generate-btn { color: red; }';
  assert.strictEqual(validateRepair(original, proposed), true);
});

test('validateRepair - CSS mutation guard rejections of changed button styles', () => {
  const original = '.loading-overlay { display: block; } #generate-btn { color: red; }';
  const proposed = '.loading-overlay { display: block; } #generate-btn { color: blue; }';
  assert.throws(() => validateRepair(original, proposed), /outside the loading-overlay/);
});

test('validateRepair - CSS mutation guard rejections of unchanged CSS', () => {
  const original = '.loading-overlay { display: block; }';
  assert.throws(() => validateRepair(original, original), /Gemini returned no source change/);
});

test('validateRepair - rejections of @import in overlay', () => {
  const original = '.loading-overlay { display: block; }';
  const proposed = '.loading-overlay { display: block; } @import url("evil.css");';
  assert.throws(() => validateRepair(original, proposed), /External resources|outside the loading-overlay/);
});

test('validateRepair - rejections of external url in overlay', () => {
  const original = '.loading-overlay { display: block; }';
  const proposed = '.loading-overlay { display: block; background: url("http://evil.com/tracker.png"); }';
  assert.throws(() => validateRepair(original, proposed), /External resources|outside the loading-overlay/);
});

test('validateRepair - rejects invalid size or empty', () => {
  assert.throws(() => validateRepair('a', ''), /Invalid CSS size/);
  assert.throws(() => validateRepair('a', 'x'.repeat(50001)), /Invalid CSS size/);
});
