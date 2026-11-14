import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc as rootDoc, getDoc as rootGetDoc, setDoc as rootSetDoc, terminate } from 'firebase/firestore';
import { syncNoteToFirestore, deleteNoteInFirestore, subscribeNotesFromFirestore } from '../../src/utils/notesStorage.js';
const require = createRequire(new URL('../../tools/firebase/package.json',import.meta.url));
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } = require('firebase/firestore');
const SOLE_ADMIN_UID = 'y2umaD5NGygETtZEnuuUzus6j4i2';
const SOLE_ADMIN_EMAIL = 'keieszero2412@gmail.com';
let env;
before(async()=>{
 if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8080')throw new Error('Tests require explicit loopback demo emulator.');
 const rules=process.env.FIREBASE_BASELINE==='true'?'rules_version = "2"; service cloud.firestore { match /databases/{database}/documents { match /{d=**} { allow read, write: if true; } } }':readFileSync(new URL('../../firestore.rules',import.meta.url),'utf8');
 env=await initializeTestEnvironment({projectId:'demo-zerocoder-r2',firestore:{host:'127.0.0.1',port:8080,rules}});
 await env.clearFirestore();
 await env.withSecurityRulesDisabled(async ctx=>{
  const db=ctx.firestore();for(const [path,data]of Object.entries({'users/alice':{email:'alice@example.com',username:'Alice',role:'User',colorCode:'Gray'},'users/bob':{email:'bob@example.com',username:'Bob',role:'User',colorCode:'Blue'},'user_access/alice':{code:'Gray'},'user_access/bob':{code:'Blue'},'authorized_emails/alice@example.com':{code:'Gray'},'authorized_emails/bypass@zerocoder.admin':{bypassBlueCode:false},'problems/p1':{title:'Practice'},'feedbacks/f1':{userId:'alice',username:'Alice',email:'alice@example.com',description:'Legacy',imageUrls:['data:image/jpeg;base64,/9j/'],status:'new',createdAt:new Date()},'users/alice/images/asset':{ownerUid:'alice',feature:'notes',state:'ready'},'users/alice/images/support':{ownerUid:'alice',feature:'feedback',state:'ready'}}))await setDoc(doc(db,path),data);
 });
});
after(async()=>env?.cleanup());
const actor=(uid,claims={})=>env.authenticatedContext(uid,{email:`${uid}@example.com`,email_verified:true,...claims}).firestore();
test('anonymous cannot enumerate users/grants/requests or write data',async()=>{
 const db=env.unauthenticatedContext().firestore();for(const path of ['users/alice','authorized_emails/alice@example.com','access_requests/alice','feedbacks/f1','problems/p1'])await assertFails(getDoc(doc(db,path)));
 await assertFails(setDoc(doc(db,'access_requests/fake'),{email:'victim@example.com'}));
});
test('UID-owned profiles are private and editable fields cannot elevate privileges',async()=>{
 const db=actor('alice');await assertSucceeds(getDoc(doc(db,'users/alice')));await assertFails(getDoc(doc(db,'users/bob')));await assertFails(getDocs(collection(db,'users')));
 await assertSucceeds(updateDoc(doc(db,'users/alice'),{username:'Alice changed'}));await assertFails(updateDoc(doc(db,'users/alice'),{role:'Admin',colorCode:'Green'}));
 await assertFails(setDoc(doc(db,'user_access/alice'),{code:'Blue'}));await assertFails(setDoc(doc(db,'authorized_emails/alice@example.com'),{code:'Blue'}));
});
test('Gray and Blue can read practice; explicit Red overrides bypass; forged admin fields do not authorize',async()=>{
 await assertSucceeds(getDoc(doc(actor('alice'),'problems/p1')));await assertSucceeds(getDoc(doc(actor('bob'),'problems/p1')));
 await assertFails(getDoc(doc(actor('blocked',{role:'Admin',colorCode:'Green'}),'problems/p1')));
 await env.withSecurityRulesDisabled(async c=>{await setDoc(doc(c.firestore(),'user_access/blocked'),{code:'Red'});await setDoc(doc(c.firestore(),'authorized_emails/bypass@zerocoder.admin'),{bypassBlueCode:true});});
 await assertFails(getDoc(doc(actor('blocked'),'problems/p1')));
 await env.withSecurityRulesDisabled(async c=>setDoc(doc(c.firestore(),'authorized_emails/bypass@zerocoder.admin'),{bypassBlueCode:false}));
});
test('only pinned sole admin grants codes, manages settings, and reads support images; other admin-claim UIDs, admin:false, and profile role spoofing are denied',async()=>{
 const rogue=actor('support',{admin:true});
 await assertFails(getDocs(collection(rogue,'users')));
 await assertFails(setDoc(doc(rogue,'authorized_emails/rogue@example.com'),{code:'Blue'}));
 await assertFails(setDoc(doc(rogue,'user_access/bob'),{code:'Red'}));
 await assertFails(setDoc(doc(rogue,'settings/auth'),{schemaVersion:2,bypassBlueCode:true}));
 await assertFails(getDoc(doc(rogue,'users/alice/images/support')));
 await assertFails(getDoc(doc(rogue,'feedbacks/f1')));

 const soleNoClaim=actor(SOLE_ADMIN_UID,{email:SOLE_ADMIN_EMAIL,admin:false});
 await assertFails(getDocs(collection(soleNoClaim,'users')));
 await assertFails(setDoc(doc(soleNoClaim,'authorized_emails/new@example.com'),{code:'Blue'}));
 await assertFails(setDoc(doc(soleNoClaim,'settings/auth'),{schemaVersion:2,bypassBlueCode:false}));

 await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'users/spoofed'),{email:'spoofed@example.com',username:'Spoofed',role:'Admin',colorCode:'Green'}));
 const spoofed=actor('spoofed');
 await assertFails(getDocs(collection(spoofed,'users')));
 await assertFails(setDoc(doc(spoofed,'user_access/spoofed'),{code:'Blue'}));
 await assertFails(getDoc(doc(spoofed,'problems/p1')));

 const db=actor(SOLE_ADMIN_UID,{email:SOLE_ADMIN_EMAIL,admin:true});
 await assertSucceeds(getDocs(collection(db,'users')));
 await assertSucceeds(getDoc(doc(db,'feedbacks/f1')));
 for(const code of ['Gray','Blue','Red'])await assertSucceeds(setDoc(doc(db,'authorized_emails/new@example.com'),{code}));
 await assertSucceeds(setDoc(doc(db,'user_access/alice'),{code:'Gray'}));
 await assertSucceeds(getDoc(doc(db,'user_access/bob')));
 await assertSucceeds(getDocs(collection(db,'user_access')));
 await assertSucceeds(getDocs(collection(db,'authorized_emails')));
 await assertSucceeds(setDoc(doc(db,'settings/auth'),{schemaVersion:2,bypassBlueCode:false}));
 await assertSucceeds(getDocs(collection(db,'settings')));
 await assertSucceeds(getDoc(doc(db,'users/alice/images/support')));
 await assertFails(getDoc(doc(db,'users/alice/images/asset')));
 await assertFails(getDoc(doc(db,'users/alice/notes/n1')));
 await assertFails(deleteDoc(doc(db,'users/alice')));
 await assertSucceeds(deleteDoc(doc(db,'authorized_emails/new@example.com')));
 await assertFails(setDoc(doc(db,'trusted_assessments/a'),{score:100}));
});
test('drafts and client practice progress enforce UID identity',async()=>{
 const db=actor('alice');await assertSucceeds(setDoc(doc(db,'code_drafts/alice_p1'),{uid:'alice',problemId:'p1',code:'print(1)'}));await assertFails(setDoc(doc(db,'code_drafts/bob_p1'),{uid:'bob',problemId:'p1',code:'stolen'}));
 await assertSucceeds(setDoc(doc(db,'user_progress/alice'),{p1:true}));await assertFails(setDoc(doc(db,'user_progress/bob'),{p1:true}));await assertFails(getDoc(doc(actor('bob'),'user_progress/alice')));
});
test('access requests use verified Auth UID; legacy email-keyed dismiss works only for emailOwner; unverified and forged identities are denied',async()=>{
 const db=actor('alice');const request={uid:'alice',email:'alice@example.com',username:'Alice',requestedCode:'Blue',status:'pending',requestedAt:serverTimestamp()};
 await assertSucceeds(setDoc(doc(db,'access_requests/alice'),request));
 await assertFails(setDoc(doc(db,'access_requests/alice'),{...request,username:'A'.repeat(81)}));
 await assertFails(setDoc(doc(db,'access_requests/bob'),{...request,uid:'bob'}));
 await assertFails(setDoc(doc(actor('unverified',{email_verified:false}),'access_requests/unverified'),{...request,uid:'unverified',email:'unverified@example.com'}));
 await assertFails(getDoc(doc(actor('bob'),'access_requests/alice')));
 await assertFails(deleteDoc(doc(db,'access_requests/alice')));

 await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'access_requests/alice@example.com'),{uid:'alice',email:'alice@example.com',username:'Alice',requestedCode:'Blue',status:'rejected',requestedAt:new Date()}));
 await assertSucceeds(getDoc(doc(db,'access_requests/alice@example.com')));
 await assertFails(updateDoc(doc(actor('bob'),'access_requests/alice@example.com'),{status:'dismissed_rejected'}));
 await assertFails(updateDoc(doc(actor('alice',{email_verified:false}),'access_requests/alice@example.com'),{status:'dismissed_rejected'}));
 await assertFails(updateDoc(doc(db,'access_requests/alice@example.com'),{status:'approved'}));
 await assertSucceeds(updateDoc(doc(db,'access_requests/alice@example.com'),{status:'dismissed_rejected'}));

 const adminDb=actor(SOLE_ADMIN_UID,{email:SOLE_ADMIN_EMAIL,admin:true});
 await assertSucceeds(getDocs(collection(adminDb,'access_requests')));
 await assertSucceeds(deleteDoc(doc(adminDb,'access_requests/alice@example.com')));
});
test('new Feedback excludes Base64, validates R2 refs and replies, allows admin reply, and blocks all deletes while preserving legacy edits',async()=>{
 const db=actor('alice');await assertSucceeds(getDoc(doc(db,'feedbacks/f1')));await assertFails(getDoc(doc(actor('bob'),'feedbacks/f1')));
 await assertSucceeds(updateDoc(doc(db,'feedbacks/f1'),{description:'Edited',updatedAt:serverTimestamp()}));await assertFails(updateDoc(doc(db,'feedbacks/f1'),{imageUrls:['data:image/png;base64,evil']}));
 await assertFails(setDoc(doc(db,'feedbacks/new'),{userId:'alice',description:'new',imageUrls:['data:image/png;base64,evil']}));

 await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'users/alice/images/fb_ready'),{ownerUid:'alice',feature:'feedback',parentId:'f_r2',state:'ready'}));
 await assertSucceeds(setDoc(doc(db,'feedbacks/f_r2'),{userId:'alice',username:'Alice',email:'alice@example.com',description:'R2 feedback',imageIds:['fb_ready'],imageUrls:[],status:'new',createdAt:serverTimestamp()}));
 await assertFails(setDoc(doc(actor('blocked'),'feedbacks/f_blocked'),{userId:'blocked',username:'Blocked',email:'blocked@example.com',description:'Blocked',imageIds:[],imageUrls:[],status:'new',createdAt:serverTimestamp()}));
 await assertFails(setDoc(doc(actor('bob'),'feedbacks/f_wrong_img'),{userId:'bob',username:'Bob',email:'bob@example.com',description:'Steal',imageIds:['fb_ready'],imageUrls:[],status:'new',createdAt:serverTimestamp()}));

 const adminDb=actor(SOLE_ADMIN_UID,{email:SOLE_ADMIN_EMAIL,admin:true});
 await assertSucceeds(updateDoc(doc(adminDb,'feedbacks/f_r2'),{adminReply:'Checking',status:'replied',repliedAt:serverTimestamp()}));
 await assertFails(deleteDoc(doc(db,'feedbacks/f_r2')));
 await assertFails(deleteDoc(doc(adminDb,'feedbacks/f_r2')));
 await assertSucceeds(updateDoc(doc(db,'feedbacks/f_r2'),{replies:[{sender:'admin',senderName:'Admin',text:'Checking',createdAt:Timestamp.now()},{sender:'user',senderName:'Alice',text:'Thanks',createdAt:Timestamp.now()}],status:'user_replied',updatedAt:serverTimestamp()}));
});
test('users, settings, authorized_emails, user_access, and notes enforce role boundaries and delete denial',async()=>{
 const newbie=actor('newbie');
 await assertSucceeds(setDoc(doc(newbie,'users/newbie'),{username:'Newbie',email:'newbie@example.com',role:'User',colorCode:'Red',createdAt:serverTimestamp()}));
 await assertFails(setDoc(doc(actor('hacker'),'users/hacker'),{username:'Hacker',email:'hacker@example.com',role:'Admin',colorCode:'Green',createdAt:serverTimestamp()}));
 await assertSucceeds(getDoc(doc(newbie,'settings/auth')));
 await assertFails(getDoc(doc(newbie,'settings/private')));
 await assertFails(getDoc(doc(actor('alice'),'settings/private')));
 await assertFails(setDoc(doc(newbie,'settings/auth'),{schemaVersion:2,bypassBlueCode:true}));
 await assertFails(getDocs(collection(newbie,'settings')));
 await assertFails(deleteDoc(doc(actor('alice'),'user_access/alice')));
 await assertFails(deleteDoc(doc(actor('alice'),'authorized_emails/alice@example.com')));
 await assertSucceeds(getDoc(doc(actor('alice'),'authorized_emails/alice@example.com')));
 await assertFails(getDoc(doc(actor('bob'),'authorized_emails/alice@example.com')));
 await assertFails(setDoc(doc(newbie,'users/newbie/notes/n_unauth'),{id:'n_unauth',ownerUid:'newbie',title:'T',content:'C',tags:[],source:null,revision:1,createdAt:1,updatedAt:1,imageIds:[]}));
});
test('only IAM Worker writes image metadata; notes enforce owner-only access, revision increment, delete denial, and cleanup lock',async()=>{
 const db=actor('alice');await assertFails(setDoc(doc(db,'users/alice/images/new'),{ownerUid:'alice',state:'ready'}));
 await assertSucceeds(setDoc(doc(db,'users/alice/notes/n1'),{id:'n1',ownerUid:'alice',title:'Note',content:'<p>Text</p>',tags:[],source:null,revision:1,createdAt:1,updatedAt:1,imageIds:[]}));
 await assertSucceeds(updateDoc(doc(db,'users/alice/notes/n1'),{id:'n1',ownerUid:'alice',title:'Note v2',content:'<p>Text</p>',tags:[],source:null,revision:2,createdAt:1,updatedAt:2,imageIds:[]}));
 await assertFails(updateDoc(doc(db,'users/alice/notes/n1'),{id:'n1',ownerUid:'alice',title:'Bad rev',content:'<p>Text</p>',tags:[],source:null,revision:2,createdAt:1,updatedAt:3,imageIds:[]}));
 await assertFails(getDoc(doc(actor('bob'),'users/alice/notes/n1')));
 await assertFails(getDoc(doc(actor(SOLE_ADMIN_UID,{email:SOLE_ADMIN_EMAIL,admin:true}),'users/alice/notes/n1')));
 await assertFails(deleteDoc(doc(db,'users/alice/notes/n1')));
 await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'users/alice/maintenance/image_cleanup'),{active:true}));
 await assertFails(updateDoc(doc(db,'users/alice/notes/n1'),{imageIds:['asset'],revision:3}));await assertFails(setDoc(doc(db,'users/alice/maintenance/image_cleanup'),{active:false}));
});

test('Email/Password auth rules: Sole Admin works with email_verified=false; authorized_emails requires email_verified=true; bypass OFF blocks spoofed profiles', async () => {
 const adminUnverified = actor(SOLE_ADMIN_UID, {
  email: SOLE_ADMIN_EMAIL,
  email_verified: false,
  admin: true,
  firebase: { sign_in_provider: 'password' }
 });
 await assertSucceeds(getDocs(collection(adminUnverified, 'users')));
 await assertSucceeds(setDoc(doc(adminUnverified, 'settings/auth'), { schemaVersion: 2, bypassBlueCode: false }));

 const emailUser = 'pw-email-only@example.com';
 await env.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), `authorized_emails/${emailUser}`), { code: 'Blue' });
  await setDoc(doc(ctx.firestore(), 'users/pw_spoofed'), {
   email: 'pw_spoofed@example.com',
   username: 'Spoofed',
   role: 'Admin',
   colorCode: 'Blue'
  });
 });

 const unverifiedEmailActor = actor('pw_email_uid', { email: emailUser, email_verified: false });
 await assertFails(getDoc(doc(unverifiedEmailActor, 'problems/p1')));
 await assertFails(getDoc(doc(unverifiedEmailActor, `authorized_emails/${emailUser}`)));

 const verifiedEmailActor = actor('pw_email_uid', { email: emailUser, email_verified: true });
 await assertSucceeds(getDoc(doc(verifiedEmailActor, 'problems/p1')));
 await assertSucceeds(getDoc(doc(verifiedEmailActor, `authorized_emails/${emailUser}`)));

 await assertFails(getDoc(doc(actor('pw_spoofed'), 'problems/p1')));
});

test('Notes Firestore end-to-end (Emulator): create, update, skip identical, conflict copy (conflictOf), soft-delete, and onSnapshot subscription', async () => {
 const app = initializeApp({ projectId: 'demo-zerocoder-r2', apiKey: 'demo-key' }, `notes-e2e-${Date.now()}`);
 const rootAuth = getAuth(app);
 const rootDb = getFirestore(app);
 connectAuthEmulator(rootAuth, 'http://127.0.0.1:9099', { disableWarnings: true });
 connectFirestoreEmulator(rootDb, '127.0.0.1', 8080);
 let unsub = () => {};

 try {
  const email = `notes-e2e-${Date.now()}@example.com`;
  const cred = await createUserWithEmailAndPassword(rootAuth, email, 'EmulatorNotes123!');
  const uid = cred.user.uid;
  await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), `user_access/${uid}`), { code: 'Blue' }));

  const events = [];
  unsub = subscribeNotesFromFirestore(rootDb, uid, (remoteNotes, deletedIds) => {
   events.push({ remoteNotes, deletedIds });
  });

  const noteId = 'note-e2e-1';
  const baseTime = 10000;
  const created = await syncNoteToFirestore(rootDb, uid, {
   id: noteId,
   title: 'First Note',
   content: '<p>Initial body</p>',
   tags: ['sql', 'midterm'],
   source: { category: 'Learn', course: 'database', lectureId: 'L1' },
   createdAt: baseTime,
   updatedAt: baseTime,
   revision: 1,
   imageIds: []
  });
  assert.equal(created.revision, 1);

  const sameResult = await syncNoteToFirestore(rootDb, uid, {
   ...created,
   updatedAt: baseTime + 500
  });
  assert.equal(sameResult.revision, 1);

  const updated = await syncNoteToFirestore(rootDb, uid, {
   ...created,
   title: 'Updated Note',
   content: '<p>Edited v2</p>',
   updatedAt: baseTime + 1000
  });
  assert.equal(updated.revision, 2);

  // Rapid sequential save from the SAME client session carrying stale revision/updatedAt must NOT create a conflict copy
  const rapidSameSession = await syncNoteToFirestore(rootDb, uid, {
   ...created,
   title: 'Updated Note',
   content: '<p>Edited v3 same session</p>',
   updatedAt: baseTime + 1050,
   revision: 1
  });
  assert.equal(rapidSameSession.revision, 3);
  assert.equal(rapidSameSession.conflictCopy, undefined);

  // Advance remote revision to 4 via another device, then sync stale local revision 1
  await rootSetDoc(rootDoc(rootDb, 'users', uid, 'notes', noteId), {
   id: noteId,
   ownerUid: uid,
   title: 'Updated Note',
   content: '<p>Remote Device Edit</p>',
   tags: ['sql', 'midterm'],
   source: { category: 'Learn', course: 'database', lectureId: 'L1' },
   createdAt: baseTime,
   updatedAt: baseTime + 5000,
   revision: 4,
   imageIds: []
  });

  const conflictRes = await syncNoteToFirestore(rootDb, uid, {
   id: noteId,
   title: 'Local Stale Title',
   content: '<p>Local Offline Edit</p>',
   tags: ['sql', 'midterm'],
   source: { category: 'Learn', course: 'database', lectureId: 'L1' },
   createdAt: baseTime,
   updatedAt: baseTime + 2000,
   revision: 1,
   imageIds: []
  });
  assert.equal(conflictRes.revision, 4);
  assert.equal(conflictRes.content, '<p>Remote Device Edit</p>');
  assert.ok(conflictRes.conflictCopy, 'Conflict copy should be created when remote revision and timestamp are newer');
  assert.equal(conflictRes.conflictCopy.conflictOf, noteId);
  assert.equal(conflictRes.conflictCopy.revision, 1);

  const conflictDoc = await rootGetDoc(rootDoc(rootDb, 'users', uid, 'notes', conflictRes.conflictCopy.id));
  assert.equal(conflictDoc.exists(), true);
  assert.equal(conflictDoc.data().conflictOf, noteId);

  await deleteNoteInFirestore(rootDb, uid, noteId);
  const deletedDoc = await rootGetDoc(rootDoc(rootDb, 'users', uid, 'notes', noteId));
  assert.equal(deletedDoc.data().deleted, true);
  assert.equal(deletedDoc.data().revision, 5);

  // Wait briefly for snapshot callback delivery
  await new Promise((r) => setTimeout(r, 150));
  assert.ok(events.length >= 1, 'Expected subscribeNotesFromFirestore to receive snapshots');
  const lastEvent = events.at(-1);
  assert.equal(lastEvent.deletedIds.includes(noteId), true);
  assert.equal(lastEvent.remoteNotes.some((n) => n.id === conflictRes.conflictCopy.id), true);
 } finally {
  unsub();
  await signOut(rootAuth);
  await terminate(rootDb);
  await deleteApp(app);
 }
});
