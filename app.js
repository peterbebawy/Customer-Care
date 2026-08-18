/* ===================== AUTH + APP SHELL ===================== */
/* يدعم طريقتين لتسجيل الدخول:
   1) Firebase Authentication (Email/Password) - الطريقة الأساسية.
   2) users داخل Realtime Database - للتوافق مع المشروع القديم.
*/

var LS = window.LS || (window.LS = {
  get(k, fallback){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }catch(e){ return fallback; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){ console.error(e); } },
  del(k){ try{ localStorage.removeItem(k); }catch(e){} }
});

let appInitialized = false;
let currentUser = LS.get('ibs_current_user', null);

function isInventoryPage(){ return !!document.getElementById('appRoot'); }
function isLoginPage(){ return !!document.getElementById('loginScreen'); }

function startInventoryApp(){
  if(!isInventoryPage() || appInitialized) return;
  appInitialized = true;
  const list = document.getElementById('branches-list');
  if(list) list.innerHTML = '<div class="empty"><b>جارٍ تحميل البيانات...</b>لو استمرت الشاشة فاضية لفترة طويلة، تأكد من اتصالك بالإنترنت</div>';
  if(typeof attachDataListener === 'function') attachDataListener();
  if(typeof watchConnectionState === 'function') watchConnectionState();
  if(typeof expireOldReports === 'function') setInterval(expireOldReports, 1000*60*30);
}

function showApp(user){
  if(isLoginPage()){
    location.replace('inventory.html');
    return;
  }
  const app = document.getElementById('appRoot');
  if(app) app.style.display = '';
  const label = document.getElementById('userEmailLabel');
  if(label) label.textContent = user.name || user.email || '';
  startInventoryApp();
}

function showLogin(){
  if(isInventoryPage()){
    location.replace('index.html');
    return;
  }
  const screen = document.getElementById('loginScreen');
  if(screen) screen.classList.remove('hidden');
}

function setLoginError(message){
  const errEl = document.getElementById('loginError');
  if(errEl) errEl.textContent = message || '';
}

function setLoginBusy(busy){
  const btn = document.querySelector('.login-box button[onclick="doLogin()"]');
  if(btn){ btn.disabled = !!busy; btn.textContent = busy ? 'جارٍ تسجيل الدخول...' : 'دخول'; }
}

function finishLogin(user){
  currentUser = user;
  LS.set('ibs_current_user', currentUser);
  location.replace('inventory.html');
}

function legacyDatabaseLogin(username, password){
  if(!window.firebase || typeof firebase.database !== 'function'){
    return Promise.reject(new Error('Firebase Database غير متاح'));
  }
  return firebase.database().ref('users').once('value').then(snapshot => {
    const users = snapshot.val() || {};
    const found = Object.entries(users).find(([id, user]) =>
      user && user.name && user.pass &&
      String(user.name).toLowerCase() === String(username).toLowerCase() &&
      String(user.pass) === String(password)
    );
    if(!found) throw new Error('INVALID_LEGACY_CREDENTIALS');
    const [userId, userData] = found;
    return { id:userId, ...userData, loginType:'database' };
  });
}

function firebaseErrorMessage(err){
  const code = err && err.code ? err.code : '';
  const map = {
    'auth/invalid-credential':'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    'auth/wrong-password':'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    'auth/user-not-found':'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    'auth/invalid-email':'البريد الإلكتروني غير صحيح',
    'auth/user-disabled':'تم تعطيل هذا المستخدم',
    'auth/too-many-requests':'تم إيقاف المحاولات مؤقتًا، حاول لاحقًا',
    'auth/network-request-failed':'تعذر الاتصال بالإنترنت',
    'auth/operation-not-allowed':'فعّل Email/Password من Firebase Authentication',
    'PERMISSION_DENIED':'لا توجد صلاحية لقراءة users من Realtime Database'
  };
  return map[code] || (err && err.message) || 'تعذر تسجيل الدخول';
}

async function doLogin(){
  const emailEl = document.getElementById('loginEmail');
  const passEl = document.getElementById('loginPassword');
  if(!emailEl || !passEl) return;

  const username = emailEl.value.trim();
  const password = passEl.value;
  setLoginError('');

  if(!username || !password){
    setLoginError('من فضلك أدخل البريد الإلكتروني وكلمة المرور');
    return;
  }

  if(!window.firebase){
    setLoginError('لم يتم تحميل Firebase. تأكد من firebase-config.js ومن اتصال الإنترنت');
    return;
  }

  setLoginBusy(true);

  /* أولاً: Firebase Authentication، وهو ما يطابق الحسابات التي أنشأتها من Authentication > Users */
  try{
    if(typeof firebase.auth === 'function' && username.includes('@')){
      const credential = await firebase.auth().signInWithEmailAndPassword(username, password);
      const u = credential.user;
      finishLogin({
        id: u.uid,
        uid: u.uid,
        email: u.email || username,
        name: u.displayName || u.email || username,
        loginType:'firebase-auth'
      });
      return;
    }
  }catch(authErr){
    console.warn('Firebase Auth login failed, trying legacy users database if available:', authErr.code || authErr.message);
    /* نكمل إلى الطريقة القديمة فقط، لأن المشروع الأصلي كان يستخدم users في Realtime Database */
  }

  try{
    const user = await legacyDatabaseLogin(username, password);
    finishLogin(user);
    return;
  }catch(dbErr){
    console.error('Login failed:', dbErr);
    if(username.includes('@') && typeof firebase.auth === 'function'){
      /* أعد محاولة واحدة للحصول على رسالة Firebase الواضحة */
      try{
        await firebase.auth().signInWithEmailAndPassword(username, password);
      }catch(authErr){
        setLoginError(firebaseErrorMessage(authErr));
        return;
      }
    }
    setLoginError(dbErr && dbErr.message === 'INVALID_LEGACY_CREDENTIALS'
      ? 'اسم المستخدم أو كلمة المرور غير صحيحة'
      : firebaseErrorMessage(dbErr));
  }finally{
    setLoginBusy(false);
  }
}

async function doLogout(){
  if(!confirm('هل تريد تسجيل الخروج؟')) return;
  try{ if(window.firebase && typeof firebase.auth === 'function') await firebase.auth().signOut(); }catch(e){ console.warn(e); }
  currentUser = null;
  appInitialized = false;
  if(typeof detachDataListener === 'function') detachDataListener();
  LS.del('ibs_current_user');
  location.replace('index.html');
}

/* ===================== TOAST ===================== */
var toastTimer;
function toast(msg){
  const t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 2600);
}

/* ===================== PAGE GUARD / INIT ===================== */
document.addEventListener('DOMContentLoaded', ()=>{
  if(isLoginPage()){
    if(currentUser) location.replace('inventory.html');
    else showLogin();
  } else if(isInventoryPage()){
    if(!currentUser){ location.replace('index.html'); return; }
    showApp(currentUser);
  }
});
