import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFirestoreMetadata } from '../../workers/images/src/metadata.js';
import { prepareOriginal } from '../../src/utils/imageOriginal.js';
const env={FIREBASE_PROJECT_ID:'demo-zerocoder-r2',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8080'};
const base='http://127.0.0.1:8080/v1/projects/demo-zerocoder-r2/databases/(default)/documents';
const blob=new Blob([new Uint8Array([137,80,78,71,13,10,26,10])],{type:'image/png'});
function guard(){assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8080','explicit demo emulator only');}
async function patch(path,record){const fields=Object.fromEntries(Object.entries(record).map(([k,v])=>[k,typeof v==='number'?{integerValue:String(v)}:{stringValue:v}]));const r=await fetch(`${base}/${path}`,{method:'PATCH',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:JSON.stringify({fields})});assert.ok(r.ok);}
test('distributed attempt budget includes repeated uploads, without duplicating storage quota',async()=>{
 guard();const ownerUid=`quota-${Date.now()}`,record=await prepareOriginal(blob,{ownerUid,feature:'notes',parentId:'n1'}),store=createFirestoreMetadata(env);delete record.blob;
 for(let i=0;i<20;i++)await store.reserve(record);
 await assert.rejects(store.reserve(record),/quota/i);
 const r=await fetch(`${base}/image_quotas/${ownerUid}`,{headers:{Authorization:'Bearer owner'}}),data=await r.json();assert.equal(data.fields.count.integerValue,'1');assert.equal(data.fields.bytes.integerValue,String(record.size));
});
test('successful object deletion followed by failed finalization leaves maintenance lock active',async()=>{
 guard();const ownerUid=`delete-${Date.now()}`,record=await prepareOriginal(blob,{ownerUid,feature:'notes',parentId:'n1'});delete record.blob;
 const store=createFirestoreMetadata(env,async(url,options)=>{assert.match(url,/^http:\/\/127\.0\.0\.1:8080\//);if(url.endsWith(':commit')&&JSON.parse(options.body).writes.some(w=>w.update?.fields?.state?.stringValue==='deleted'))return Response.json({error:{status:'INTERNAL'}},{status:503});return fetch(url,options);});
 await store.reserve(record);await patch(`users/${ownerUid}/images/${record.id}`,{...record,state:'detached',createdAt:Date.now()-10*86400000,reservedAt:Date.now()-10*86400000,detachedAt:Date.now()-8*86400000});
 let removed=false;await assert.rejects(store.cleanup(ownerUid,record.id,async()=>{removed=true;}));assert.equal(removed,true);
 const r=await fetch(`${base}/users/${ownerUid}/maintenance/image_cleanup`,{headers:{Authorization:'Bearer owner'}}),data=await r.json();assert.equal(data.fields.active.booleanValue,true,'interrupted purge must fail closed');
});
