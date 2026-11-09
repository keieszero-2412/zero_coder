import { test } from 'node:test';
import assert from 'node:assert/strict';
const { createTokenVerifier } = await import('../../workers/images/src/firebaseToken.js');
const pair = await crypto.subtle.generateKey({ name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256' },true,['sign','verify']);
const key = { ...await crypto.subtle.exportKey('jwk',pair.publicKey),kid:'fixture',alg:'RS256',use:'sig' };
const b64 = value => Buffer.from(typeof value==='string'?value:JSON.stringify(value)).toString('base64url');
const now = Math.floor(Date.now()/1000);
const claims = { sub:'alice',aud:'demo-zerocoder',iss:'https://securetoken.google.com/demo-zerocoder',iat:now-10,auth_time:now-20,exp:now+600,admin:true };
async function token(changes={},header={}) { const input=`${b64({alg:'RS256',kid:'fixture',...header})}.${b64({...claims,...changes})}`;return `${input}.${Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(input))).toString('base64url')}`; }
test('verified Firebase claims require signature, project, expiry and subject; public keys are cached',async()=>{
 let fetches=0;const verify=createTokenVerifier({fetcher:async url=>{assert.equal(url,'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');fetches++;return Response.json({keys:[key]},{headers:{'Cache-Control':'max-age=3600'}});}});
 assert.equal((await verify(await token(),'demo-zerocoder')).sub,'alice');await verify(await token(),'demo-zerocoder');assert.equal(fetches,1);
 for(const invalid of [{aud:'other'},{iss:'other'},{sub:''},{exp:now-1},{iat:now+300},{auth_time:now+300}])await assert.rejects(verify(await token(invalid),'demo-zerocoder'));
 await assert.rejects(verify(await token({}, {alg:'none'}),'demo-zerocoder'));
 const forged=(await token()).split('.');forged[1]=b64({...claims,sub:'bob'});await assert.rejects(verify(forged.join('.'),'demo-zerocoder'));
 await assert.rejects(verify(await token({}, {kid:'unknown',jku:'https://attacker.invalid'}),'demo-zerocoder'));
});
test('expired key cache fails closed if Google is unavailable',async()=>{
 const verify=createTokenVerifier({fetcher:async()=>{throw new Error('offline');}});await assert.rejects(verify(await token(),'demo-zerocoder'));
});
