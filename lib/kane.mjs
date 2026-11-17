import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

export function classifyKane(exitCode, stdout, stderr = '', signal = null) {
  const events = stdout.split('\n').flatMap(line => { try { return [JSON.parse(line)]; } catch { return []; } });
  const endings = events.filter(e => e.type === 'run_end');
  const runEnd = endings.at(-1) || null;
  const valid = endings.length === 1 && runEnd.v === 1;
  const passed = exitCode === 0 && valid && runEnd.status === 'passed';
  const errorType = signal || exitCode === 3 ? 'timeout' : passed ? 'none' : exitCode === 2 ? 'setup_error' : exitCode === 1 && valid && runEnd.status === 'failed' ? 'assertion_failed' : 'unknown';
  const evidencePath = stderr.match(/kane-cli evidence serve\s+([^`\r\n]+\.evidence)/)?.[1] || events.findLast(e => typeof e.pack === 'string')?.pack || null;
  return { passed, exitCode, errorType, runEnd, evidencePath, stdout, stderr, signal, eventCount: events.length };
}

export async function runKane(url, objective) {
  const binary = fileURLToPath(new URL('../node_modules/@testmuai/kane-cli/bin/kane-cli.cjs', import.meta.url));
  const args = [binary, 'run', objective, '--url', url, '--agent', '--headless', '--max-steps', '12', '--timeout', '150'];
  return new Promise(resolve => {
    let stdout = '', stderr = '', settled = false;
    const child = spawn(process.execPath, args, { shell: false, env: { ...process.env, NODE_USE_SYSTEM_CA: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
    const finish = result => { if (!settled) { settled = true; clearTimeout(timer); resolve({ ...result, objective, objectiveSha256: crypto.createHash('sha256').update(objective).digest('hex') }); } };
    const timer = setTimeout(() => { child.kill('SIGTERM'); setTimeout(() => child.kill('SIGKILL'), 3000).unref(); }, 170000);
    child.stdout.on('data', d => { stdout += d.toString(); if (stdout.length > 2e6) child.kill('SIGTERM'); });
    child.stderr.on('data', d => { stderr += d.toString(); if (stderr.length > 2e6) child.kill('SIGTERM'); });
    child.on('error', e => finish(classifyKane(2, stdout, stderr + '\n' + e.message)));
    child.on('close', (code, signal) => finish(classifyKane(code, stdout, stderr, signal)));
  });
}
