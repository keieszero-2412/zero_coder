import { prepareOriginal, verifyOriginal, MAX_ORIGINAL_BYTES } from './imageOriginal.js';

export function createImageStorage({ auth, baseUrl = '', enabled = false, fetcher = fetch, allowLoopback = false, cache = null }) {
  if (baseUrl) {
    const parsed=new URL(baseUrl);
    if(parsed.protocol!=='https:' && !(allowLoopback&&parsed.protocol==='http:'&&['127.0.0.1','localhost'].includes(parsed.hostname))) throw new Error('Image API requires HTTPS (or an explicit local demo endpoint).');
    if(parsed.username||parsed.password||parsed.search||parsed.hash)throw new Error('Invalid image API URL.');
  }
  const root=baseUrl.replace(/\/$/,'');
  const session=()=>{const uid=auth.currentUser?.uid;if(!uid)throw new Error('Sign in to synchronize original images.');return uid;};
  const check=uid=>{if(auth.currentUser?.uid!==uid)throw new Error('Account changed. Retry from the original account.');};
  async function request(uid,id,options={},parameters={}) {
    check(uid);
    if(!enabled||!root)throw new Error('Cloud image storage is not activated. Keep the original and retry after activation.');
    if(!/^[a-f0-9]{64}$/.test(id))throw new Error('Invalid image identity.');
    const token=await auth.currentUser.getIdToken();check(uid);
    for(let attempt=0;attempt<3;attempt++){
      check(uid);const response=await fetcher(`${root}/v1/images/${id}?${new URLSearchParams(parameters)}`,{
        ...options,headers:{Authorization:`Bearer ${token}`,...options.headers},signal:AbortSignal.timeout(45000),redirect:'error'
      });check(uid);
      if(response.ok)return response;
      if([429,502,503,504].includes(response.status)&&attempt<2){await new Promise(resolve=>setTimeout(resolve,250*(attempt+1)));continue;}
      let message='Image operation failed. Keep the original and retry.';try{message=(await response.json()).error||message;}catch{/* Bounded generic error for non-JSON gateways. */}
      throw new Error(message);
    }
  }
  function identity(record,reference) {
    if(record?.id!==reference.id||record.ownerUid!==reference.ownerUid||record.state!=='ready'||!Number.isInteger(record.size)||record.size<=0||record.size>MAX_ORIGINAL_BYTES||!/^[a-f0-9]{64}$/.test(record.sha256))throw new Error('Image metadata integrity mismatch.');
  }
  return {
    async save(file,relationship) {
      const uid=session();
      if(relationship.ownerUid&&relationship.ownerUid!==uid)throw new Error('Original belongs to another account.');
      const original=await prepareOriginal(file,{...relationship,ownerUid:uid});check(uid);
      try {
        if(cache)await cache.put(uid,'image',original.id,{...original,state:'pending'});
        check(uid);
        const response=await request(uid,original.id,{method:'PUT',body:file,headers:{'Content-Type':original.contentType,'X-Image-SHA256':original.sha256}},{feature:original.feature,parentId:original.parentId,filename:original.filename});
        const ready=await response.json();check(uid);identity(ready,original);
        if(ready.sha256!==original.sha256||ready.size!==original.size||ready.objectKey!==original.objectKey)throw new Error('Uploaded original integrity mismatch.');
        const record={...ready,blob:file};
        try{await cache?.put(uid,'image',record.id,record);}catch{/* Verified remote original remains available when an optional cache is full. */}
        check(uid);return record;
      }catch(error){error.pendingImage=original;throw error;}
    },
    async metadata(reference) {const uid=session();const result=await (await request(uid,reference.id,{}, {owner:reference.ownerUid,metadata:'1'})).json();check(uid);identity(result,reference);return result;},
    async download(reference) {
      const uid=session();let cached;
      try{cached=await cache?.get(uid,'image',reference.id);}catch{/* Online originals do not depend on IndexedDB availability. */}
      check(uid);
      if(cached?.blob&&reference.ownerUid===uid){identity(cached,reference);await verifyOriginal(cached.blob,cached);check(uid);return cached;}
      const metadata=await this.metadata(reference);check(uid);
      const response=await request(uid,reference.id,{}, {owner:reference.ownerUid});
      const blob=await verifyOriginal(new Blob([await response.arrayBuffer()],{type:metadata.contentType}),metadata);check(uid);
      const record={...metadata,blob};try{await cache?.put(uid,'image',record.id,record);}catch{/* Cache is optional. */}check(uid);return record;
    },
    async preview(reference){const uid=session(),record=await this.download(reference);check(uid);const url=URL.createObjectURL(record.blob);return {url,revoke:()=>URL.revokeObjectURL(url)};},
    async delete(reference){const uid=session();const result=await (await request(uid,reference.id,{method:'DELETE'},{owner:reference.ownerUid})).json();check(uid);return result;},
    async recover(file,relationship){return this.save(file,relationship);}
  };
}
