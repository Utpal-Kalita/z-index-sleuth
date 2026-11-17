import test from 'node:test';
import assert from 'node:assert';
import { classifyKane } from '../lib/kane.mjs';

test('classifyKane - valid pass', () => {
  const stdout = JSON.stringify({ type: 'run_end', v: 1, status: 'passed', summary: 'ok' });
  const res = classifyKane(0, stdout, '');
  assert.strictEqual(res.passed, true);
  assert.strictEqual(res.errorType, 'none');
  assert.deepStrictEqual(res.runEnd, { type: 'run_end', v: 1, status: 'passed', summary: 'ok' });
});

test('classifyKane - classifyKane false passes (exit 0 but no run_end)', () => {
  const stdout = '{"type":"step","message":"doing stuff"}\n';
  const res = classifyKane(0, stdout, '');
  assert.strictEqual(res.passed, false);
});

test('classifyKane - unsupported v', () => {
  const stdout = JSON.stringify({ type: 'run_end', v: 2, status: 'passed' });
  const res = classifyKane(0, stdout, '');
  assert.strictEqual(res.passed, false);
});

test('classifyKane - no run_end', () => {
  const res = classifyKane(1, '', '');
  assert.strictEqual(res.passed, false);
  assert.strictEqual(res.runEnd, null);
});

test('classifyKane - multiple run_end', () => {
  const stdout = [
    JSON.stringify({ type: 'run_end', v: 1, status: 'failed' }),
    JSON.stringify({ type: 'run_end', v: 1, status: 'passed' })
  ].join('\n');
  const res = classifyKane(0, stdout, '');
  assert.strictEqual(res.passed, false);
});

test('classifyKane - setup error', () => {
  const res = classifyKane(2, '', '');
  assert.strictEqual(res.errorType, 'setup_error');
});

test('classifyKane - timeout cases', () => {
  const res1 = classifyKane(3, '', '');
  assert.strictEqual(res1.errorType, 'timeout');
  const res2 = classifyKane(null, '', '', 'SIGTERM');
  assert.strictEqual(res2.errorType, 'timeout');
});

test('classifyKane - assertion failed', () => {
  const stdout = JSON.stringify({ type: 'run_end', v: 1, status: 'failed' });
  const res = classifyKane(1, stdout, '');
  assert.strictEqual(res.passed, false);
  assert.strictEqual(res.errorType, 'assertion_failed');
});
