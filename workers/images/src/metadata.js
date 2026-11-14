import { resolveAccess, basicAccessEnabled, SOLE_ADMIN_UID } from '../../../src/utils/accessPolicy.js';
import { assertImageContext } from '../../../src/utils/imageOriginal.js';
const tokens = new WeakMap();
const fail = (status,message) => Object.assign(new Error(message),{status});
const validOwner = owner => typeof owner === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(owner);
const validId = id => typeof id === 'string' && /^[a-f0-9]{64}$/.test(id);
const base64url = bytes => btoa(typeof bytes === 'string' ? bytes : String.fromCharCode(...bytes)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const encode = value => value === null ? {nullValue:null} : Array.isArray(value) ? {arrayValue:{values:value.map(encode)}}
  : typeof value === 'string' ? {stringValue:value} : typeof value === 'boolean' ? {booleanValue:value}
    : typeof value === 'number' ? {integerValue:String(value)} : {mapValue:{fields:fields(value)}};
const fields = value => Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).map(([key,v])=>[key,encode(v)]));
function decode(value) {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return Date.parse(value.timestampValue);
  if ('arrayValue' in value) return (value.arrayValue.values||[]).map(decode);
  if ('mapValue' in value) return fromFields(value.mapValue.fields||{});
  return null;
}
const fromFields = value => Object.fromEntries(Object.entries(value).map(([key,v])=>[key,decode(v)]));
export function createFirestoreMetadata(env, fetcher = fetch) {
  const project=env.FIREBASE_PROJECT_ID,host=env.FIRESTORE_EMULATOR_HOST;
  if (host && project !== 'demo-zerocoder-r2') throw new Error('Production/emulator configuration is refused.');
  if (host && !/^127\.0\.0\.1:\d+$/.test(host)) throw new Error('Demo transport requires loopback.');
  if (!host && (!['zerocoder-8cb6b', 'zerocoder-staging'].includes(project) || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY)) throw new Error('Trusted Firestore IAM configuration is missing.');
  const resource=`projects/${project}/databases/(default)/documents`,base=`${host?`http://${host}`:'https://firestore.googleapis.com'}/v1/${resource}`;
  async function accessToken() {
    if (host) return 'owner';
    const cached=tokens.get(env);if(cached?.expires>Date.now()+60000)return cached.token;
    const seconds=Math.floor(Date.now()/1000),header=base64url(JSON.stringify({alg:'RS256',typ:'JWT'}));
    const body=base64url(JSON.stringify({iss:env.FIREBASE_CLIENT_EMAIL,scope:'https://www.googleapis.com/auth/cloud-platform',aud:'https://oauth2.googleapis.com/token',iat:seconds,exp:seconds+3600}));
    const pem=env.FIREBASE_PRIVATE_KEY.replace(/\\n/g,'\n').replace(/-----[^-]+-----|\s/g,'');
    const key=await crypto.subtle.importKey('pkcs8',Uint8Array.from(atob(pem),c=>c.charCodeAt(0)),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
    const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(`${header}.${body}`));
    const response=await fetcher('https://oauth2.googleapis.com/token',{method:'POST',signal:AbortSignal.timeout(10000),headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:`${header}.${body}.${base64url(new Uint8Array(signature))}`})});
    if(!response.ok)throw fail(503,'Metadata credentials unavailable.');const token=await response.json();
    if(!token.access_token)throw fail(503,'Metadata credentials unavailable.');tokens.set(env,{token:token.access_token,expires:Date.now()+Math.min(3600,Number(token.expires_in)||300)*1000});return token.access_token;
  }
  async function call(url,body) {
    const response=await fetcher(url,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${await accessToken()}`,...(body?{'Content-Type':'application/json'}:{})},signal:AbortSignal.timeout(15000),...(body?{body:JSON.stringify(body)}:{})});
    if(response.status===404)return null;
    const data=await response.json();if(!response.ok)throw Object.assign(fail(response.status===429?429:503,'Image metadata operation failed. Retry without discarding the original.'),{code:data.error?.status});return data;
  }
  const get=async(path,transaction)=>{
    // batchGet reports missing documents without the Emulator's transactional GET hang.
    const response=transaction?await call(`${base}:batchGet`,{documents:[`${resource}/${path}`],transaction}):null;
    const document=transaction?response?.find(item=>item.found)?.found:await call(`${base}/${path}`);
    return document?fromFields(document.fields||{}):null;
  };
  async function transaction(work) {
    for(let attempt=0;attempt<5;attempt++){
      const started=await call(`${base}:beginTransaction`,{options:{readWrite:{}}}),writes=[];
      try {
        const result=await work({get:path=>get(path,started.transaction),set:(path,data)=>writes.push({update:{name:`${resource}/${path}`,fields:fields(data)}})});
        await call(`${base}:commit`,{transaction:started.transaction,writes});return result;
      } catch(error) {
        await call(`${base}:rollback`,{transaction:started.transaction}).catch(()=>{});
        if(error.code!=='ABORTED'||attempt===4)throw error;
        await new Promise(resolve=>setTimeout(resolve,20*(attempt+1)));
      }
    }
  }
  const imagePath=(owner,id)=>`users/${owner}/images/${id}`;
  const lockPath=owner=>`users/${owner}/maintenance/image_cleanup`;
  async function* documents(path) {
    let pageToken='';
    for(let page=0;page<1000;page++){
      const result=await call(`${base}/${path}?pageSize=10${pageToken?`&pageToken=${encodeURIComponent(pageToken)}`:''}`);
      for(const doc of result?.documents||[])yield fromFields(doc.fields||{});
      pageToken=result?.nextPageToken;if(!pageToken)return;
    }
    throw fail(503,'Reference scan limit reached. No original deleted.');
  }
  async function referenced(owner,id) {
    for(const name of ['notes','note_revisions','migrations'])for await(const document of documents(`users/${owner}/${name}`))if(JSON.stringify(document).includes(id))return true;
    let cursor;
    for(let page=0;page<1000;page++){
      const results=await call(`${base}:runQuery`,{structuredQuery:{from:[{collectionId:'feedbacks'}],select:{fields:[{fieldPath:'imageIds'},{fieldPath:'imageMigration'}]},where:{fieldFilter:{field:{fieldPath:'userId'},op:'EQUAL',value:{stringValue:owner}}},orderBy:[{field:{fieldPath:'__name__'},direction:'ASCENDING'}],limit:10,...(cursor?{startAt:{values:[{referenceValue:cursor}],before:false}}:{})}});
      const docs=(results||[]).filter(item=>item.document).map(item=>item.document);
      for(const document of docs)if(JSON.stringify(document.fields||{}).includes(id))return true;
      if(docs.length<10)return false;cursor=docs.at(-1).name;
    }
    throw fail(503,'Feedback reference scan incomplete. No original deleted.');
  }
  return {
    get:(owner,id)=>{if(!validOwner(owner)||!validId(id))throw fail(400,'Invalid owner or image identity.');return get(imagePath(owner,id));},
    async authorize(claims) {
      const authHost=env.FIREBASE_AUTH_EMULATOR_HOST||'127.0.0.1:9099';
      if(host&&!/^127\.0\.0\.1:\d+$/.test(authHost))throw fail(503,'Auth test endpoint must be loopback.');
      const account=await call(`${host?`http://${authHost}/identitytoolkit.googleapis.com`:'https://identitytoolkit.googleapis.com'}/v1/projects/${project}/accounts:lookup`,{localId:[claims.sub]});
      const current=account?.users?.[0];if(!current||current.disabled||claims.auth_time<Number(current.validSince||0))throw fail(401,'Session was revoked or disabled.');
      let custom={};try{custom=JSON.parse(current.customAttributes||'{}');}catch{/* Invalid current claims never confer administrator rights. */}
      const effective={...claims,admin:claims.sub===SOLE_ADMIN_UID&&claims.admin===true&&custom.admin===true,email_verified:claims.email_verified===true&&current.emailVerified===true&&current.email?.toLowerCase()===claims.email?.toLowerCase()};
      const [uidGrant,emailGrant,canonical,legacy]=await Promise.all([get(`user_access/${claims.sub}`),effective.email_verified&&claims.email?get(`authorized_emails/${encodeURIComponent(claims.email.toLowerCase())}`):null,get('settings/auth'),get('authorized_emails/bypass@zerocoder.admin')]);
      return {...effective,...resolveAccess(effective,uidGrant,emailGrant,basicAccessEnabled(canonical,legacy))};
    },
    async reserve(record) {
      if(!record||!validOwner(record.ownerUid)||!validId(record.id))throw fail(400,'Invalid image owner or identity.');
      assertImageContext({ownerUid:record.ownerUid,feature:record.feature,parentId:record.parentId});
      await transaction(async tx=>{
        const path=imagePath(record.ownerUid,record.id);
        const [previous,quota,global,lock]=await Promise.all([tx.get(path),tx.get(`image_quotas/${record.ownerUid}`),tx.get('image_budgets/global'),tx.get(lockPath(record.ownerUid))]);
        if(lock?.active)throw fail(409,'Images are under cleanup. Retry after it finishes.');
        if(previous&&(previous.sha256!==record.sha256||previous.objectKey!==record.objectKey))throw fail(409,'Image metadata identity conflict.');
        const fresh=!previous||previous.state==='deleted',now=Date.now();
        const bytes=(quota?.bytes||0)+(fresh?record.size:0),count=(quota?.count||0)+(fresh?1:0),total=(global?.bytes||0)+(fresh?record.size:0);
        const start=quota?.windowStart||0,uploads=now-start<3600000?(quota?.uploads||0)+1:1;
        if(bytes>100*1024*1024||count>1000||total>1024*1024*1024||uploads>20)throw fail(429,'Image storage/upload quota reached. Ask the owner to review usage.');
        tx.set(`image_quotas/${record.ownerUid}`,{bytes,count,uploads,windowStart:now-start<3600000?start:now});
        if(fresh)tx.set('image_budgets/global',{bytes:total});
        tx.set(path,{...previous,...record,state:previous?.state==='ready'?'ready':'pending',createdAt:previous?.createdAt||now,reservedAt:now});
      });
    },
    async ready(record) {
      if(!record||!validOwner(record.ownerUid)||!validId(record.id))throw fail(400,'Invalid image owner or identity.');
      await transaction(async tx=>{
        const [current,lock]=await Promise.all([tx.get(imagePath(record.ownerUid,record.id)),tx.get(lockPath(record.ownerUid))]);
        if(lock?.active||!current||!['pending','ready'].includes(current.state))throw fail(409,'Upload verification interrupted by cleanup. Retry with the original.');
        tx.set(imagePath(record.ownerUid,record.id),{...current,state:'ready',verifiedAt:Date.now()});
      });
    },
    async cleanup(owner,id,remove) {
      if(!validOwner(owner)||!validId(id))throw fail(400,'Invalid owner or image identity.');
      const runId=crypto.randomUUID(),lock=lockPath(owner),path=imagePath(owner,id);
      await transaction(async tx=>{const old=await tx.get(lock);if(old?.active&&old.runId!==runId)throw fail(409,'Cleanup active or interrupted. Owner must verify the old job before releasing its lock.');tx.set(lock,{active:true,runId,startedAt:Date.now()});});
      let preserveLock=false;
      try {
        const current=await get(path);if(!current)throw fail(404,'Image not found.');if(current.state==='deleted')return {state:'deleted'};
        if(current.ownerUid&&current.ownerUid!==owner)throw fail(403,'Image belongs to another account.');
        if(await referenced(owner,id))throw fail(409,'Image is referenced by current data, history or migration recovery.');
        const now=Date.now();if(now-(current.reservedAt||current.createdAt||now)<86400000)throw fail(409,'Recent original/upload is retained for recovery.');
        if(current.state!=='detached'){
          await transaction(async tx=>{const old=await tx.get(path);tx.set(`users/${owner}/image_cleanup_history/${runId}`,{before:old,action:'detach',at:now});tx.set(path,{...old,state:'detached',detachedAt:now});});return {state:'detached'};
        }
        if(now-current.detachedAt<7*86400000)throw fail(409,'Detached original is still in its seven-day recovery period.');
        // Once physical deletion is attempted, an ambiguous failure requires reconciliation.
        preserveLock=true;
        await remove(current);
        await transaction(async tx=>{const [q,g]=await Promise.all([tx.get(`image_quotas/${owner}`),tx.get('image_budgets/global')]);tx.set(`users/${owner}/image_cleanup_history/${runId}`,{before:current,action:'delete',at:now});tx.set(path,{...current,state:'deleted',deletedAt:now});tx.set(`image_quotas/${owner}`,{...q,bytes:Math.max(0,(q?.bytes||0)-current.size),count:Math.max(0,(q?.count||0)-1)});tx.set('image_budgets/global',{bytes:Math.max(0,(g?.bytes||0)-current.size)});});
        preserveLock=false;return {state:'deleted'};
      } finally {
        if(!preserveLock)await transaction(async tx=>{const current=await tx.get(lock);if(current?.runId===runId)tx.set(lock,{...current,active:false,finishedAt:Date.now()});});
      }
    }
  };
}
