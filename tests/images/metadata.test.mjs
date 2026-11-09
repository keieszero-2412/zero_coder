import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFirestoreMetadata } from '../../workers/images/src/metadata.js';
test('missing IAM configuration fails closed rather than calling anonymous production services',()=>{
 assert.throws(()=>createFirestoreMetadata({FIREBASE_PROJECT_ID:'zerocoder-8cb6b'}),/configuration/i);
 assert.throws(()=>createFirestoreMetadata({FIREBASE_PROJECT_ID:'zerocoder-8cb6b',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8080'}),/emulator/i);
});
test('demo metadata transport is loopback-only and resolves typed Firestore records',async()=>{
 let calls=0;const repository=createFirestoreMetadata({FIREBASE_PROJECT_ID:'demo-zerocoder-r2',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8080'},async(url,options)=>{calls++;assert.match(url,/^http:\/\/127\.0\.0\.1:8080\/v1\/projects\/demo-zerocoder-r2\//);assert.equal(options.headers.Authorization,'Bearer owner');return Response.json({fields:{ownerUid:{stringValue:'alice'},size:{integerValue:'8'},state:{stringValue:'ready'}}});});
 assert.equal((await repository.get('alice','a'.repeat(64))).size,8);assert.equal(calls,1);
 assert.throws(()=>createFirestoreMetadata({FIREBASE_PROJECT_ID:'demo-zerocoder-r2',FIRESTORE_EMULATOR_HOST:'attacker:8080'}),/loopback/i);
});
