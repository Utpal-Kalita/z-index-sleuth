import test from 'node:test';
import assert from 'node:assert';
import { classifyKane } from '../lib/kane.mjs';

test('null, strings, arrays and primitive NDJSON lines do not crash or pass by themselves', () => {
  const stdout = 'null\n"some string"\n[1, 2, 3]\n123\ntrue';
  const result = classifyKane(0, stdout);
  assert.strictEqual(result.passed, false);
  assert.strictEqual(result.runEnd, null);
  assert.strictEqual(result.eventCount, 0);
});

test('primitives and null can safely coexist with one valid supported pass', () => {
  const stdout = 'null\n"hello"\n[1,2]\n{"type":"run_end","v":1,"status":"passed"}';
  const result = classifyKane(0, stdout);
  assert.strictEqual(result.passed, true);
  assert.notStrictEqual(result.runEnd, null);
  assert.strictEqual(result.runEnd.status, 'passed');
  assert.strictEqual(result.eventCount, 1);
});

test('malformed run_end stays false', () => {
  const malformedEndings = [
    '{"type":"run_end","v":2,"status":"passed"}',
    '{"type":"run_end","v":1,"status":"unknown"}',
    '{"type":"run_end"}',
    'null',
    '[]'
  ];
  for (const line of malformedEndings) {
    const result = classifyKane(0, line);
    assert.strictEqual(result.passed, false, `Failed for line: ${line}`);
  }
});

test('multiple endings fail', () => {
  const stdout = '{"type":"run_end","v":1,"status":"passed"}\n{"type":"run_end","v":1,"status":"passed"}';
  const result = classifyKane(0, stdout);
  assert.strictEqual(result.passed, false);
  assert.notStrictEqual(result.runEnd, null);
});

test('supported passed ending preceded by unsupported v2 run_end fails', () => {
  const stdout = '{"type":"run_end","v":2,"status":"passed"}\n{"type":"run_end","v":1,"status":"passed"}';
  const result = classifyKane(0, stdout);
  assert.strictEqual(result.passed, false);
});
