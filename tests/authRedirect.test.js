import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getSafeNextPath } from '../src/authRedirect.js';

describe('authentication destinations', () => {
  for (const path of ['/submit', '/track', '/submit?example=value', '/track?ref=a%26b#status', '/home', '/profile', '/support', '/submit-success']) {
    it(`preserves ${path}`, () => assert.equal(getSafeNextPath(path), path));
  }
  for (const path of [undefined, null, '', 42, {}, 'https://evil.example', '//evil.example', 'javascript:alert(1)', '/\\evil.example', '/\nevil.example', '/\tevil.example', ' /submit', '/login', '/signup', '/confirm', '/', '/unknown', '/submit/../login', '/%2f%2fevil.example', '/submit%2f..%2flogin']) {
    it(`falls back for ${JSON.stringify(path)}`, () => assert.equal(getSafeNextPath(path), '/home'));
  }
  it('preserves a destination through query encoding and confirmation state', () => {
    const original = '/track?example=value&filter=a%26b';
    const login = new URLSearchParams(`next=${encodeURIComponent(original)}`);
    const next = getSafeNextPath(login.get('next'));
    const signup = new URLSearchParams(`next=${encodeURIComponent(next)}`);
    const confirmationState = { next: getSafeNextPath(signup.get('next')) };
    assert.equal(getSafeNextPath(confirmationState.next), original);
  });
});
