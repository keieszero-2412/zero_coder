// Membership colors never establish administrator identity. Profile fields are not inputs.
export const SOLE_ADMIN_UID = 'y2umaD5NGygETtZEnuuUzus6j4i2';
export const SOLE_ADMIN_EMAIL = 'keieszero2412@gmail.com';

export function isTrustedSoleAdmin(user, claims = {}) {
  if (!user || user.uid !== SOLE_ADMIN_UID) return false;
  if (claims?.admin === false) return false;
  return claims?.admin === true || (user.email || '').toLowerCase() === SOLE_ADMIN_EMAIL;
}

export function resolveAccess(claims = {}, uidGrant = null, emailGrant = null, bypass = false) {
  const actorUid = claims?.sub || claims?.uid;
  if (claims?.admin === true && actorUid === SOLE_ADMIN_UID) {
    return { role: 'Admin', colorCode: 'Green' };
  }
  const code = uidGrant ? uidGrant.code || 'Red'
    : claims.accessCode || (claims.email_verified === true && emailGrant ? emailGrant.code || 'Blue' : null);
  if (code === 'Blue' || code === 'Gray') return { role: 'User', colorCode: code };
  if (!code && bypass === true) return { role: 'User', colorCode: 'Gray' };
  return { role: 'Unauthorized', colorCode: 'Red' };
}
export function evaluateAccessPolicy({ claims = {}, userAccess = null, authorizedEmail = null, bypass = false } = {}) {
  return resolveAccess(claims, userAccess, authorizedEmail, bypass);
}
export const basicAccessEnabled = (canonical, legacy) => canonical?.schemaVersion === 2
  ? canonical.bypassBlueCode === true : legacy?.bypassBlueCode === true;
