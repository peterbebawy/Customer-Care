// Firebase / التطبيق - تهيئة الاتصال بقاعدة البيانات
// تم استخراج الإعدادات كما هي من الملف الأصلي بدون تغيير الاتصال.
const firebaseConfig = {
  apiKey: "AIzaSyCikAWrMtiLw0WAYCH7I4iG6Wv2tMsEt9w",
  authDomain: "customer-care-841fe.firebaseapp.com",
  databaseURL: "https://customer-care-841fe-default-rtdb.firebaseio.com",
  projectId: "customer-care-841fe",
  storageBucket: "customer-care-841fe.firebasestorage.app",
  messagingSenderId: "167461661789",
  appId: "1:167461661789:web:a1141fccdf4650b84eb1b4"
};

firebase.initializeApp(firebaseConfig);
const rtdb = firebase.database();
window.rtdb = rtdb;
const db = rtdb;
window.db = db;

