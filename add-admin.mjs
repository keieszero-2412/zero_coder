import { SOLE_ADMIN_UID, SOLE_ADMIN_EMAIL } from './src/utils/accessPolicy.js';

/**
 * Single-Admin Policy Verification Notice:
 * Client-editable Firestore documents (`authorized_emails` or `users/{uid}.role`)
 * NEVER grant trusted administrator privileges in ZeroCoder.
 *
 * Trusted Admin status requires server-side Firebase Auth Custom Claims (`admin: true`)
 * bound exclusively to the sole project owner UID.
 */
const targetEmail = (process.argv[2] || SOLE_ADMIN_EMAIL).trim().toLowerCase();

if (targetEmail !== SOLE_ADMIN_EMAIL) {
  console.error(`Refusing to configure Admin for "${targetEmail}".`);
  console.error(`Single-Admin Policy permits only ${SOLE_ADMIN_EMAIL} (UID: ${SOLE_ADMIN_UID}).`);
  process.exit(1);
}

console.log('ZeroCoder Single-Admin Policy Check:');
console.log(`- Sole Admin Email : ${SOLE_ADMIN_EMAIL}`);
console.log(`- Sole Admin UID   : ${SOLE_ADMIN_UID}`);
console.log('- Client-SDK Firestore role escalation is permanently disabled.');
console.log('- To apply trusted Admin Custom Claims via Firebase Admin / Identity Toolkit, run the approved Phase 6.4 server-side procedure.');
