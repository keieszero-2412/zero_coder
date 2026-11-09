import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepareOriginal } from '../../src/utils/imageOriginal.js';
const { createImageStorage }=await import('../../src/utils/imageStorage.js');
const blob=new Blob([new Uint8Array([137,80,78,71,13,10,26,10])],{type:'image/png'});
const relationship={feature:'notes',parentId:'n1'};
const user=uid=>({uid,getIdToken:async()=>`token-${uid}`});
test('shared client sends exact original bytes with its owning Firebase token and verifies downloads',async()=>{
 const auth={currentUser:user('alice')},original=await prepareOriginal(blob,{...relationship,ownerUid:'alice'});let puts=0;
 const client=createImageStorage({auth,baseUrl:'https://images.example',enabled:true,fetcher:async(url,options)=>{
  assert.match(url,/^https:\/\/images\.example\/v1\/images\/[a-f0-9]{64}/);assert.equal(options.headers.Authorization,'Bearer token-alice');
  if(options.method==='PUT'){puts++;assert.equal(options.body,blob);return Response.json({...original,blob:undefined,state:'ready'});}
  return url.includes('metadata=1')?Response.json({...original,blob:undefined,state:'ready'}):new Response(blob);
 }});
 const saved=await client.save(blob,relationship);assert.equal(saved.id,original.id);assert.equal(puts,1);
 assert.deepEqual(new Uint8Array(await (await client.download({id:original.id,ownerUid:'alice'})).blob.arrayBuffer()),new Uint8Array(await blob.arrayBuffer()));
});
test('account change during upload cannot return the old account result',async()=>{
 const auth={currentUser:user('alice')};const client=createImageStorage({auth,baseUrl:'https://images.example',enabled:true,fetcher:async()=>{const image=await prepareOriginal(blob,{...relationship,ownerUid:'alice'});auth.currentUser=user('bob');return Response.json({...image,blob:undefined,state:'ready'});}});
 await assert.rejects(client.save(blob,relationship),/Account changed/);
});
test('unconfigured/offline storage never reports cloud success; pending original remains in error for recovery',async()=>{
 const auth={currentUser:user('alice')},client=createImageStorage({auth,baseUrl:'',enabled:false});
 await assert.rejects(client.save(blob,relationship),error=>{assert.ok(error.pendingImage.blob===blob);assert.match(error.message,/not activated/);return true;});
 assert.throws(()=>createImageStorage({auth,baseUrl:'http://attacker.invalid',enabled:true}),/HTTPS/);
});
