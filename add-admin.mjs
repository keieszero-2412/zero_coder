import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyByZiS5X6HxWd94WdzA_bnM5u_9F5XfCpM',
  authDomain: 'zerocoder-8cb6b.firebaseapp.com',
  projectId: 'zerocoder-8cb6b',
  storageBucket: 'zerocoder-8cb6b.firebasestorage.app',
  messagingSenderId: '907038293031',
  appId: '1:907038293031:web:76386f1ce69b2b936a6202',
  measurementId: 'G-ZHS3V82WX7'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// THÊM EMAIL CỦA BẠN VÀO ĐÂY
const YOUR_EMAIL = "keieszero2412@gmail.com"; 

async function grantAdminAccess() {
  console.log(`Đang cấp quyền Admin cho: ${YOUR_EMAIL}...`);
  try {
    const authRef = doc(db, 'authorized_emails', YOUR_EMAIL.toLowerCase());
    await setDoc(authRef, {
      role: 'Admin',
      colorCode: 'Blue',
      addedAt: new Date(),
      addedBy: 'Manual Script'
    });
    console.log("✅ Thành công! Bạn đã có quyền Admin.");
    console.log("Bây giờ bạn có thể quay lại trang web, F5 lại và đăng nhập!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi cấp quyền:", error.message);
    process.exit(1);
  }
}

grantAdminAccess();
