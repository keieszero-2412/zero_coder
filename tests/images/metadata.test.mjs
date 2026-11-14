import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFirestoreMetadata } from '../../workers/images/src/metadata.js';
import { SOLE_ADMIN_UID } from '../../src/utils/accessPolicy.js';
test('missing IAM configuration fails closed rather than calling anonymous production services',()=>{
 assert.throws(()=>createFirestoreMetadata({FIREBASE_PROJECT_ID:'zerocoder-8cb6b'}),/configuration/i);
 assert.throws(()=>createFirestoreMetadata({FIREBASE_PROJECT_ID:'zerocoder-8cb6b',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8080'}),/emulator/i);
});
test('demo metadata transport is loopback-only and resolves typed Firestore records',async()=>{
 let calls=0;const repository=createFirestoreMetadata({FIREBASE_PROJECT_ID:'demo-zerocoder-r2',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8080'},async(url,options)=>{calls++;assert.match(url,/^http:\/\/127\.0\.0\.1:8080\/v1\/projects\/demo-zerocoder-r2\//);assert.equal(options.headers.Authorization,'Bearer owner');return Response.json({fields:{ownerUid:{stringValue:'alice'},size:{integerValue:'8'},state:{stringValue:'ready'}}});});
 assert.equal((await repository.get('alice','a'.repeat(64))).size,8);assert.equal(calls,1);
 assert.throws(()=>createFirestoreMetadata({FIREBASE_PROJECT_ID:'demo-zerocoder-r2',FIRESTORE_EMULATOR_HOST:'attacker:8080'}),/loopback/i);
});
test('server-side metadata operations strictly enforce UID ownership and reject path traversals',async()=>{
 const repository=createFirestoreMetadata({FIREBASE_PROJECT_ID:'demo-zerocoder-r2',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8080'},async()=>Response.json({fields:{}}));
 await assert.rejects(async()=>repository.get('../evil','a'.repeat(64)),/invalid owner/i);
 await assert.rejects(async()=>repository.get('alice','not-a-hash'),/invalid owner/i);
 await assert.rejects(async()=>repository.reserve({ownerUid:'../evil',id:'a'.repeat(64)}),/invalid image owner/i);
 await assert.rejects(async()=>repository.reserve({ownerUid:'alice',id:'a'.repeat(64),feature:'illegal',parentId:'p1'}),/invalid image owner or relationship/i);
 await assert.rejects(async()=>repository.ready({ownerUid:'../evil',id:'a'.repeat(64)}),/invalid image owner/i);
 await assert.rejects(async()=>repository.cleanup('../evil','a'.repeat(64),async()=>{}),/invalid owner/i);
});
test('authorize enforces pinned SOLE_ADMIN_UID alongside live Identity Toolkit customAttributes claim',async()=>{
 const makeRepo=(customAttributesByUid)=>{
  const fetcher=async(url,options)=>{
   if(url.includes('accounts:lookup')){
    const body=JSON.parse(options.body);
    const uid=body.localId[0];
    return Response.json({users:[{localId:uid,validSince:'0',emailVerified:false,customAttributes:customAttributesByUid[uid]||'{}'}]});
   }
   return new Response(null,{status:404});
  };
  return createFirestoreMetadata({FIREBASE_PROJECT_ID:'demo-zerocoder-r2',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8080'},fetcher);
 };
 const pinnedRepo=makeRepo({[SOLE_ADMIN_UID]:'{"admin":true}',support:'{"admin":true}'});
 const soleAdmin=await pinnedRepo.authorize({sub:SOLE_ADMIN_UID,admin:true,auth_time:100});
 assert.equal(soleAdmin.role,'Admin');assert.equal(soleAdmin.colorCode,'Green');assert.equal(soleAdmin.admin,true);

 const nonOwnerAdmin=await pinnedRepo.authorize({sub:'support',admin:true,auth_time:100});
 assert.equal(nonOwnerAdmin.role,'Unauthorized');assert.equal(nonOwnerAdmin.colorCode,'Red');assert.equal(nonOwnerAdmin.admin,false);

 const missingServerClaimRepo=makeRepo({[SOLE_ADMIN_UID]:'{}'});
 const unverifiedClaim=await missingServerClaimRepo.authorize({sub:SOLE_ADMIN_UID,admin:true,auth_time:100});
 assert.equal(unverifiedClaim.role,'Unauthorized');assert.equal(unverifiedClaim.colorCode,'Red');assert.equal(unverifiedClaim.admin,false);
});
