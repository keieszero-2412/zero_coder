// Membership colors never establish administrator identity. Profile fields are not inputs.
export function resolveAccess(claims = {}, uidGrant = null, emailGrant = null, bypass = false) {
  if (claims.admin === true) return { role: 'Admin', colorCode: 'Green' };
  const code = uidGrant ? uidGrant.code || 'Red'
    : claims.accessCode || (claims.email_verified === true && emailGrant ? emailGrant.code || 'Blue' : null);
  if (code === 'Blue' || code === 'Gray') return { role: 'User', colorCode: code };
  if (!code && bypass === true) return { role: 'User', colorCode: 'Gray' };
  return { role: 'Unauthorized', colorCode: 'Red' };
}
export const basicAccessEnabled = (canonical, legacy) => canonical?.schemaVersion === 2
  ? canonical.bypassBlueCode === true : legacy?.bypassBlueCode === true;
