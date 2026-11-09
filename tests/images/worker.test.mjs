import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepareOriginal } from '../../src/utils/imageOriginal.js';
const { createImageWorker } = await import('../../workers/images/src/index.js');
const blob=new Blob([new Uint8Array([137,80,78,71,13,10,26,10])],{type:'image/png'});
function fixture() {
 const records=new Map(),objects=new Map();let writes=0,locked=false,metadataReads=0;
 const repository={authorize:async claims=>({...claims,role:claims.admin?'Admin':'User'}),get:async(owner,id)=>{metadataReads++;return records.get(`${owner}/${id}`);},reserve:async record=>{if(locked)throw new Error('locked');records.set(`${record.ownerUid}/${record.id}`,{...record,blob:undefined,state:'pending'});},ready:async record=>records.set(`${record.ownerUid}/${record.id}`,{...record,blob:undefined,state:'ready'}),
  cleanup:async(owner,id,remove)=>{locked=true;try{const r=records.get(`${owner}/${id}`);if(r.linked)throw Object.assign(new Error('Referenced'),{status:409});if(r.state==='ready'){r.state='detached';r.detachedAt=Date.now();return {state:'detached'};}if(Date.now()-r.detachedAt<7*86400000)throw Object.assign(new Error('Recovery grace period'),{status:409});await remove(r);r.state='deleted';return {state:'deleted'};}finally{locked=false;}}};
 const bucket={head:async key=>objects.get(key)||null,put:async(key,data,options)=>{if(objects.has(key))return null;writes++;objects.set(key,{size:data.byteLength,customMetadata:options.customMetadata,body:new Blob([data]).stream(),arrayBuffer:async()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)});return objects.get(key);},get:async key=>{const o=objects.get(key);return o?{...o,body:new Blob([await o.arrayBuffer()]).stream()}:null;},delete:async key=>objects.delete(key)};
 const worker=createImageWorker({verifyToken:async token=>{if(token==='invalid')throw new Error('bad token');return {sub:token==='bob'?'bob':token==='admin'?'support':'alice',admin:token==='admin'};},makeRepository:()=>repository});
 const env={IMAGES_ENABLED:'true',FIREBASE_PROJECT_ID:'demo-zerocoder',ALLOWED_ORIGINS:'https://app.example',PRIVATE_R2:bucket};
 const request=(path,options={})=>worker.fetch(new Request(`https://images.example/v1/images/${path}`,{...options,headers:{Origin:'https://app.example',Authorization:'Bearer alice',...options.headers}}),env);
 return {records,objects,request,env,worker,writes:()=>writes,metadataReads:()=>metadataReads};
}
async function upload(f,context={ownerUid:'alice',feature:'notes',parentId:'n1'}) {const image=await prepareOriginal(blob,context);const r=await f.request(`${image.id}?feature=${image.feature}&parentId=${image.parentId}`,{method:'PUT',headers:{'Content-Type':blob.type,'X-Image-SHA256':image.sha256},body:blob});return {image,response:r};}
test('private original upload/download is byte-identical, immutable and idempotent',async()=>{
 const f=fixture(),{image,response}=await upload(f);assert.equal(response.status,201);assert.equal((await response.json()).sha256,image.sha256);
 assert.equal((await upload(f)).response.status,201);assert.equal(f.writes(),1);
 const downloaded=await f.request(image.id);assert.equal(downloaded.status,200);assert.deepEqual(new Uint8Array(await downloaded.arrayBuffer()),new Uint8Array(await blob.arrayBuffer()));assert.equal(downloaded.headers.get('x-content-type-options'),'nosniff');assert.equal(downloaded.headers.get('cache-control'),'private, no-store');
});
test('missing/invalid auth, disallowed origins, malformed keys and hash mismatch never write objects',async()=>{
 const f=fixture(),image=await prepareOriginal(blob,{ownerUid:'alice',feature:'notes',parentId:'n1'});
 assert.equal((await f.request(image.id,{headers:{Authorization:''}})).status,401);
 assert.equal((await f.request(image.id,{headers:{Authorization:'Bearer invalid'}})).status,401);
 assert.equal((await f.request(image.id,{headers:{Origin:'https://evil.example'}})).status,403);
 assert.equal((await f.request('bad-key')).status,400);
 assert.equal((await f.request(`${image.id}?feature=notes&parentId=n1`,{method:'PUT',headers:{'Content-Type':'image/png','X-Image-SHA256':'0'.repeat(64)},body:blob})).status,400);assert.equal(f.writes(),0);
});
test('another user cannot read originals; trusted support admin reads Feedback only',async()=>{
 const f=fixture(),{image}=await upload(f);
 assert.equal((await f.request(`${image.id}?owner=alice`,{headers:{Authorization:'Bearer bob'}})).status,403);
 assert.equal(f.metadataReads(),0,'non-owner denial must precede privileged metadata lookup');
 assert.equal((await f.request(`${image.id}?owner=alice`,{headers:{Authorization:'Bearer admin'}})).status,403);
 const feedback=await upload(f,{ownerUid:'alice',feature:'feedback',parentId:'f1'});
 assert.equal((await f.request(`${feedback.image.id}?owner=alice`,{headers:{Authorization:'Bearer admin'}})).status,200);
});
test('delete detaches first, refuses linked/recent originals, then purges mature orphan under lock',async()=>{
 const f=fixture(),{image}=await upload(f),record=f.records.get(`alice/${image.id}`);
 record.linked=true;assert.equal((await f.request(image.id,{method:'DELETE'})).status,409);assert.equal(f.objects.size,1);
 record.linked=false;assert.equal((await f.request(image.id,{method:'DELETE'})).status,202);assert.equal(f.objects.size,1);
 assert.equal((await f.request(image.id,{method:'DELETE'})).status,409);
 record.detachedAt=Date.now()-8*86400000;assert.equal((await f.request(image.id,{method:'DELETE'})).status,200);assert.equal(f.objects.size,0);
});
