import http from 'node:http';
import test from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';

async function startServer(envExtra = {}) {
  const port = Math.floor(20000 + Math.random() * 20000);
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['server.mjs'], {
      env: { ...process.env, PORT: String(port), ...envExtra },
      stdio: ['ignore', 'pipe', 'inherit']
    });
    let started = false;
    const timer = setTimeout(() => {
      if (!started) {
        child.kill();
        reject(new Error('Server failed to start within timeout'));
      }
    }, 5000);

    child.stdout.on('data', data => {
      if (data.toString().includes(String(port))) {
        started = true;
        clearTimeout(timer);
        resolve({
          child,
          port,
          async close() {
            child.kill('SIGTERM');
            await new Promise(r => child.on('close', r));
          }
        });
      }
    });
    child.on('error', err => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

test('server integration tests - READ_ONLY=1 mode vs normal mode', async () => {
  const { child, port, close } = await startServer({ READ_ONLY: '1' });
  try {
    const resGet = await fetch(`http://127.0.0.1:${port}/fixture/index.html`);
    assert.strictEqual(resGet.status, 200);
    const html = await resGet.text();
    assert.ok(html.length > 0);

    const resState = await fetch(`http://127.0.0.1:${port}/api/state`);
    assert.strictEqual(resState.status, 200);
    const stateJson = await resState.json();
    assert.ok(stateJson);

    const resReset = await fetch(`http://127.0.0.1:${port}/api/reset`, { method: 'POST' });
    assert.strictEqual(resReset.status, 403);
    const resetBody = await resReset.json();
    assert.ok(resetBody.error.includes('Read-only'));
  } finally {
    await close();
  }
});

test('server integration tests - Normal mode, security checks & API semantics', async () => {
  const { child, port, close } = await startServer({ READ_ONLY: '0' });
  try {
    const resGet = await fetch(`http://127.0.0.1:${port}/fixture/index.html`);
    assert.strictEqual(resGet.status, 200);
    assert.strictEqual(resGet.headers.get('x-content-type-options'), 'nosniff');
    assert.strictEqual(resGet.headers.get('x-frame-options'), 'SAMEORIGIN');

    const resState = await fetch(`http://127.0.0.1:${port}/api/state`);
    assert.strictEqual(resState.status, 200);

    const resWrongHost = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port,
        path: '/api/reset',
        method: 'POST',
        headers: { 'Host': 'evil.com' }
      }, res => {
        res.resume();
        resolve(res.statusCode);
      });
      req.on('error', reject);
      req.end();
    });
    assert.strictEqual(resWrongHost, 403);

    const resWrongOrigin = await fetch(`http://127.0.0.1:${port}/api/reset`, {
      method: 'POST',
      headers: { 'Host': `127.0.0.1:${port}`, 'Origin': 'http://evil.com' }
    });
    assert.strictEqual(resWrongOrigin.status, 403);

    const resCrossSite = await fetch(`http://127.0.0.1:${port}/api/reset`, {
      method: 'POST',
      headers: { 'Host': `127.0.0.1:${port}`, 'Sec-Fetch-Site': 'cross-site' }
    });
    assert.strictEqual(resCrossSite.status, 403);

    const resUnsupportedVerb = await fetch(`http://127.0.0.1:${port}/api/state`, { method: 'PUT' });
    assert.strictEqual(resUnsupportedVerb.status, 405);

    const resTraversal = await fetch(`http://127.0.0.1:${port}/../package.json`);
    assert.ok([400, 403, 404].includes(resTraversal.status));
  } finally {
    await close();
  }
});
