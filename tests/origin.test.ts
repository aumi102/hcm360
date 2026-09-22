import { describe, expect, it } from 'vitest';

import { buildJoinUrl, isLocalHostname, resolveOrigin } from '@/lib/origin';

/**
 * QR / join-URL generation.
 *
 * A wrong origin here is invisible in every test that does not check it, and then
 * fails in front of a room of students holding their phones up at a code that will
 * not open. Both directions are covered: production must never emit a local address,
 * and LAN development must never emit https.
 */

const NONE = { configuredOrigin: null, forwardedHost: null, forwardedProto: null, host: null };

describe('isLocalHostname', () => {
  it('recognises loopback', () => {
    for (const host of ['localhost', 'localhost:3000', '127.0.0.1', '127.0.0.1:3000', '0.0.0.0:3000']) {
      expect(isLocalHostname(host), host).toBe(true);
    }
  });

  it('recognises private LAN ranges used for phone testing', () => {
    for (const host of ['192.168.2.220:3000', '10.0.0.5:3000', '172.16.4.1', '172.31.255.255']) {
      expect(isLocalHostname(host), host).toBe(true);
    }
  });

  it('recognises mDNS and bare machine names', () => {
    expect(isLocalHostname('my-laptop.local:3000')).toBe(true);
    expect(isLocalHostname('devbox:3000')).toBe(true);
  });

  it('does not treat public hosts as local', () => {
    for (const host of ['hcm360.vercel.app', 'example.com:443', '172.32.0.1', '8.8.8.8']) {
      expect(isLocalHostname(host), host).toBe(false);
    }
  });
});

describe('resolveOrigin', () => {
  it('trusts the proxy headers Vercel sets', () => {
    const origin = resolveOrigin({
      ...NONE,
      forwardedHost: 'hcm360.vercel.app',
      forwardedProto: 'https',
      host: 'internal-host',
    });
    expect(origin).toBe('https://hcm360.vercel.app');
  });

  it('takes the first entry when a header carries a proxy chain', () => {
    const origin = resolveOrigin({
      ...NONE,
      forwardedHost: 'hcm360.vercel.app, inner.vercel.app',
      forwardedProto: 'https, http',
    });
    expect(origin).toBe('https://hcm360.vercel.app');
  });

  it('uses http for a LAN dev server so a phone can actually open the QR', () => {
    // The bug this guards: 192.168.x.x does not start with "localhost", so a naive
    // check produced https:// and an unopenable link during phone testing.
    expect(resolveOrigin({ ...NONE, host: '192.168.2.220:3000' })).toBe('http://192.168.2.220:3000');
  });

  it('uses http for localhost', () => {
    expect(resolveOrigin({ ...NONE, host: 'localhost:3000' })).toBe('http://localhost:3000');
  });

  it('assumes https for a publicly routable host with no proxy headers', () => {
    expect(resolveOrigin({ ...NONE, host: 'hcm360.vercel.app' })).toBe('https://hcm360.vercel.app');
  });

  it('lets an explicit origin win over everything', () => {
    const origin = resolveOrigin({
      configuredOrigin: 'https://daoduc360.example.edu.vn',
      forwardedHost: 'hcm360.vercel.app',
      forwardedProto: 'https',
      host: 'localhost:3000',
    });
    expect(origin).toBe('https://daoduc360.example.edu.vn');
  });

  it('normalises a configured origin that has a trailing slash or no scheme', () => {
    expect(resolveOrigin({ ...NONE, configuredOrigin: 'https://example.com/' })).toBe('https://example.com');
    expect(resolveOrigin({ ...NONE, configuredOrigin: 'example.com' })).toBe('https://example.com');
    expect(resolveOrigin({ ...NONE, configuredOrigin: '  https://example.com  ' })).toBe('https://example.com');
  });

  it('ignores an empty configured origin rather than producing "://"', () => {
    expect(resolveOrigin({ ...NONE, configuredOrigin: '   ', host: 'localhost:3000' })).toBe(
      'http://localhost:3000',
    );
  });

  it('falls back to localhost only when there is no host at all', () => {
    expect(resolveOrigin(NONE)).toBe('http://localhost:3000');
  });
});

describe('buildJoinUrl', () => {
  it('produces the scannable production URL', () => {
    const url = buildJoinUrl(
      { ...NONE, forwardedHost: 'hcm360.vercel.app', forwardedProto: 'https' },
      'ABCDE',
    );
    expect(url).toBe('https://hcm360.vercel.app/join/ABCDE');
  });

  it('never emits a localhost URL when the request came through a proxy', () => {
    const url = buildJoinUrl(
      { ...NONE, forwardedHost: 'hcm360.vercel.app', forwardedProto: 'https', host: 'localhost:3000' },
      'ABCDE',
    );
    expect(url).not.toContain('localhost');
  });

  it('produces a LAN URL a phone on the same Wi-Fi can open', () => {
    expect(buildJoinUrl({ ...NONE, host: '192.168.2.220:3000' }, 'ABCDE')).toBe(
      'http://192.168.2.220:3000/join/ABCDE',
    );
  });
});
