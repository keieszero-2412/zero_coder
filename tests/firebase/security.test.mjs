import { test, before, after } from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(new URL('../../tools/firebase/package.json',import.meta.url));
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, collection, getDoc, getDocs, setDoc, updateDoc, serverTimestamp } = require('firebase/firestore');
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
test('trusted admin grants all member codes and reads support images but not private note originals',async()=>{
 const db=actor('support',{admin:true});await assertSucceeds(getDocs(collection(db,'users')));
 for(const code of ['Gray','Blue','Red'])await assertSucceeds(setDoc(doc(db,'authorized_emails/new@example.com'),{code}));
 await assertSucceeds(getDoc(doc(db,'users/alice/images/support')));await assertFails(getDoc(doc(db,'users/alice/images/asset')));
 await assertFails(setDoc(doc(db,'trusted_assessments/a'),{score:100}));
});
test('drafts and client practice progress enforce UID identity',async()=>{
 const db=actor('alice');await assertSucceeds(setDoc(doc(db,'code_drafts/alice_p1'),{uid:'alice',problemId:'p1',code:'print(1)'}));await assertFails(setDoc(doc(db,'code_drafts/bob_p1'),{uid:'bob',problemId:'p1',code:'stolen'}));
 await assertSucceeds(setDoc(doc(db,'user_progress/alice'),{p1:true}));await assertFails(setDoc(doc(db,'user_progress/bob'),{p1:true}));await assertFails(getDoc(doc(actor('bob'),'user_progress/alice')));
});
test('access requests use verified Auth UID; unverified email and forged identities are denied',async()=>{
 const db=actor('alice');const request={uid:'alice',email:'alice@example.com',username:'Alice',requestedCode:'Blue',status:'pending',requestedAt:serverTimestamp()};
 await assertSucceeds(setDoc(doc(db,'access_requests/alice'),request));await assertFails(setDoc(doc(db,'access_requests/bob'),{...request,uid:'bob'}));await assertFails(setDoc(doc(actor('unverified',{email_verified:false}),'access_requests/unverified'),{...request,uid:'unverified',email:'unverified@example.com'}));
});
test('new Feedback excludes Base64 while legacy originals remain readable and text-editable by owner',async()=>{
 const db=actor('alice');await assertSucceeds(getDoc(doc(db,'feedbacks/f1')));await assertFails(getDoc(doc(actor('bob'),'feedbacks/f1')));
 await assertSucceeds(updateDoc(doc(db,'feedbacks/f1'),{description:'Edited',updatedAt:serverTimestamp()}));await assertFails(updateDoc(doc(db,'feedbacks/f1'),{imageUrls:['data:image/png;base64,evil']}));
 await assertFails(setDoc(doc(db,'feedbacks/new'),{userId:'alice',description:'new',imageUrls:['data:image/png;base64,evil']}));
});
test('only IAM Worker writes image metadata; cleanup lock blocks new references',async()=>{
 const db=actor('alice');await assertFails(setDoc(doc(db,'users/alice/images/new'),{ownerUid:'alice',state:'ready'}));
 await assertSucceeds(setDoc(doc(db,'users/alice/notes/n1'),{id:'n1',ownerUid:'alice',title:'Note',content:'<p>Text</p>',tags:[],source:null,revision:1,createdAt:1,updatedAt:1,imageIds:[]}));
 await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'users/alice/maintenance/image_cleanup'),{active:true}));
 await assertFails(updateDoc(doc(db,'users/alice/notes/n1'),{imageIds:['asset']}));await assertFails(setDoc(doc(db,'users/alice/maintenance/image_cleanup'),{active:false}));
});
