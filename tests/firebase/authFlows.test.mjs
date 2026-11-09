import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signOut } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, getDoc, doc, terminate } from 'firebase/firestore';
const { createAuthActions }=await import('../../src/utils/authActions.js');
test('real demo Auth registration, private profile, verification/request, login and reset preserve UID identity',async()=>{
 assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST,'127.0.0.1:9099');assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8080');
 const app=initializeApp({projectId:'demo-zerocoder-r2',apiKey:'demo-key'},`auth-flow-${Date.now()}`),auth=getAuth(app),db=getFirestore(app);
 connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});connectFirestoreEmulator(db,'127.0.0.1',8080);
 const service=createAuthActions({auth,db}),email=`auth-flow-${Date.now()}@example.com`;
 try{
  const user=await service.register('Gray learner',email,'emulator-password-only',false);assert.equal((await getDoc(doc(db,'users',user.uid))).data().role,'User');
  await assert.rejects(service.requestAccess('Gray'),/verify/i);
  const updated=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/demo-zerocoder-r2/accounts:update',{method:'POST',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:JSON.stringify({localId:user.uid,emailVerified:true})});assert.equal(updated.status,200);
  await user.reload();await user.getIdToken(true);await service.requestAccess('Gray');
  const request=(await getDoc(doc(db,'access_requests',user.uid))).data();assert.equal(request.uid,user.uid);assert.equal(request.requestedCode,'Gray');
  await signOut(auth);await service.login(email,'emulator-password-only',false);assert.equal(auth.currentUser.uid,user.uid);
  await service.resetPassword(email);await signOut(auth);await assert.rejects(service.requestAccess('Blue'),/Sign in/);
 }finally{await signOut(auth);await terminate(db);await deleteApp(app);}
});
