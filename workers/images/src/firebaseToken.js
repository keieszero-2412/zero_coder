const publicKeys = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const decode = part => Uint8Array.from(atob(part.replace(/-/g,'+').replace(/_/g,'/')),char=>char.charCodeAt(0));
export function createTokenVerifier({ fetcher = fetch, now = () => Date.now() } = {}) {
  let keys = [], expires = 0, lastRefresh = 0, inFlight;
  async function refresh() {
    if (!inFlight) inFlight = (async () => {
      const response = await fetcher(publicKeys, { signal: AbortSignal.timeout(5000), redirect: 'manual' });
      if (!response.ok) throw new Error('Firebase signing keys unavailable.');
      const text = await response.text();
      if (text.length > 65536) throw new Error('Invalid signing-key response.');
      const result = JSON.parse(text);
      if (!Array.isArray(result.keys) || !result.keys.length) throw new Error('Invalid signing keys.');
      keys = result.keys;
      expires = now() + Math.min(3600, Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] || 300)) * 1000;
      lastRefresh = now();
    })().finally(() => { inFlight = null; });
    return inFlight;
  }
  return async function verifyFirebaseToken(token, projectId) {
    if (typeof token !== 'string' || token.length > 16384 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) throw new Error('Invalid Firebase ID token.');
    const parts = token.split('.'), header = JSON.parse(new TextDecoder().decode(decode(parts[0]))), claims = JSON.parse(new TextDecoder().decode(decode(parts[1])));
    const seconds = Math.floor(now()/1000);
    if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid || header.kid.length > 200
      || claims.aud !== projectId || claims.iss !== `https://securetoken.google.com/${projectId}`
      || typeof claims.sub !== 'string' || !claims.sub || claims.sub.length > 128
      || !Number.isFinite(claims.exp) || claims.exp <= seconds
      || !Number.isFinite(claims.iat) || claims.iat <= 0 || claims.iat > seconds + 30
      || !Number.isFinite(claims.auth_time) || claims.auth_time <= 0 || claims.auth_time > seconds + 30) throw new Error('Firebase ID token claims are invalid or expired.');
    if (expires <= now()) await refresh();
    let key = keys.find(item => item.kid === header.kid);
    if (!key && now()-lastRefresh > 60000) { await refresh(); key = keys.find(item => item.kid === header.kid); }
    if (!key || key.kty !== 'RSA' || (key.alg && key.alg !== 'RS256') || (key.use && key.use !== 'sig')) throw new Error('Unknown Firebase signing key.');
    const imported = await crypto.subtle.importKey('jwk', key, { name:'RSASSA-PKCS1-v1_5',hash:'SHA-256' },false,['verify']);
    if (!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',imported,decode(parts[2]),new TextEncoder().encode(`${parts[0]}.${parts[1]}`))) throw new Error('Firebase ID token signature is invalid.');
    return claims;
  };
}
