// ==========================================
// 1. Firebase Configuration & State Management
// ==========================================
// استبدل التكوين التالي بالبيانات الخاصة بمشروعك في Firebase
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

let currentUser = null;

// ==========================================
// 2. Auth Logic & Section Management
// ==========================================
function doLogin(event) {
  event.preventDefault();
  const usernameInput = document.getElementById("loginUsername").value.trim();
  const passwordInput = document.getElementById("loginPassword").value.trim();
  const errEl = document.getElementById("loginError");

  if (!usernameInput || !passwordInput) {
    errEl.textContent = "يرجى إدخال اسم المستخدم وكلمة المرور";
    errEl.classList.remove("hidden");
    return;
  }

  db.ref("users").orderByChild("username").equalTo(usernameInput).once("value")
    .then(snapshot => {
      if (snapshot.exists()) {
        let userData = null;
        let userId = null;
        snapshot.forEach(child => {
          userId = child.key;
          userData = child.val();
        });

        if (userData && userData.password === passwordInput) {
          currentUser = { id: userId, ...userData };
          errEl.classList.add("hidden");
          
          document.getElementById("loginScreen").classList.add("hidden");
          document.getElementById("dashboard").classList.remove("hidden");
          
          document.getElementById("topUserName").textContent = currentUser.name || currentUser.username;
          document.getElementById("topUserRole").textContent = currentUser.role || "مستخدم";
          
          showToast("تم تسجيل الدخول بنجاح", "success");
          loadBranchesDropdowns();
          showSection('shortagesEntry');
        } else {
          errEl.textContent = "كلمة المرور غير صحيحة";
          errEl.classList.remove("hidden");
        }
      } else {
        errEl.textContent = "اسم المستخدم غير موجود";
        errEl.classList.remove("hidden");
      }
    })
    .catch(error => {
      console.error(error);
      errEl.textContent = "حدث خطأ أثناء الاتصال بالخادم";
      errEl.classList.remove("hidden");
    });
}

function doLogout() {
  currentUser = null;
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("loginForm").reset();
  showToast("تم تسجيل الخروج", "info");
}

function showSection(sectionId) {
  const sections = [
    'shortagesEntry', 'shortagesReport', 'ccShortagesEntry', 
    'ccShortagesReport', 'usersManagement', 'branchesManagement'
  ];
  
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.remove('hidden');
    if (sectionId === 'shortagesReport') loadShortagesReport();
    if (sectionId === 'ccShortagesReport') loadCCShortagesReport();
  }
}

function toggleNavPanel(panelId) {
  const panel = document.getElementById(panelId);
  if (panel) {
    panel.classList.toggle('hidden');
  }
}

// ==========================================
// 3. Branches Dropdown Loaders
// ==========================================
function loadBranchesDropdowns() {
  db.ref("branches").once("value", snapshot => {
    const shSelect = document.getElementById("shBranch");
    const ccSelect = document.getElementById("ccBranch");
    
    if (!shSelect || !ccSelect) return;
    
    shSelect.innerHTML = '<option value="">اختر الفرع...</option>';
    ccSelect.innerHTML = '<option value="">اختر الفرع...</option>';

    if (snapshot.exists()) {
      snapshot.forEach(child => {
        const branch = child.val();
        const option = `<option value="${branch.name}">${branch.name}</option>`;
        shSelect.innerHTML += option;
        ccSelect.innerHTML += option;
      });
    } else {
      const defaultOption = '<option value="الفرع الرئيسي">الفرع الرئيسي</option>';
      shSelect.innerHTML += defaultOption;
      ccSelect.innerHTML += defaultOption;
    }
  });
}

// ==========================================
// 4. Data Operations (Add/Read/Delete)
// ==========================================
function saveShortage(event) {
  event.preventDefault();
  const itemCode = document.getElementById("shItemCode").value.trim();
  const itemName = document.getElementById("shItemName").value.trim();
  const quantity = document.getElementById("shQuantity").value;
  const branch = document.getElementById("shBranch").value;

  const data = {
    itemCode,
    itemName,
    quantity,
    branch,
    createdByName: currentUser ? (currentUser.name || currentUser.username) : "مجهول",
    date: new Date().toLocaleString("ar-EG")
  };

  db.ref("shortages").push(data)
    .then(() => {
      showToast("تم إضافة الناقص بنجاح", "success");
      document.getElementById("addShortageForm").reset();
    })
    .catch(err => showToast("حدث خطأ في الحفظ", "danger"));
}

function saveCCShortage(event) {
  event.preventDefault();
  const itemCode = document.getElementById("ccItemCode").value.trim();
  const itemName = document.getElementById("ccItemName").value.trim();
  const customerName = document.getElementById("ccCustomerName").value.trim();
  const branch = document.getElementById("ccBranch").value;
  const notes = document.getElementById("ccNotes").value.trim();

  const data = {
    itemCode,
    itemName,
    customerName,
    branch,
    notes,
    agentName: currentUser ? (currentUser.name || currentUser.username) : "مجهول",
    date: new Date().toLocaleString("ar-EG")
  };

  db.ref("cc_shortages").push(data)
    .then(() => {
      showToast("تم تسجيل بلاغ الكول سنتر بنجاح", "success");
      document.getElementById("addCCShortageForm").reset();
    })
    .catch(err => showToast("حدث خطأ في الحفظ", "danger"));
}

function loadShortagesReport() {
  const tbody = document.getElementById("shortagesReportTable");
  if (!tbody) return;
  
  tbody.innerHTML = '<tr><td colspan="8">جاري التحميل...</td></tr>';

  db.ref("shortages").on("value", snapshot => {
    tbody.innerHTML = "";
    if (!snapshot.exists()) {
      tbody.innerHTML = '<tr><td colspan="8">لا توجد بيانات مسجلة</td></tr>';
      return;
    }

    let index = 1;
    snapshot.forEach(child => {
      const item = child.val();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${index++}</td>
        <td>${item.itemCode || '-'}</td>
        <td>${item.itemName || '-'}</td>
        <td>${item.quantity || 0}</td>
        <td>${item.branch || '-'}</td>
        <td>${item.createdByName || '-'}</td>
        <td>${item.date || '-'}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="deleteRecord('shortages', '${child.key}')">حذف</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });
}

function loadCCShortagesReport() {
  const tbody = document.getElementById("ccShortagesReportTable");
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="9">جاري التحميل...</td></tr>';

  db.ref("cc_shortages").on("value", snapshot => {
    tbody.innerHTML = "";
    if (!snapshot.exists()) {
      tbody.innerHTML = '<tr><td colspan="9">لا توجد نواقص كول سنتر</td></tr>';
      return;
    }

    let index = 1;
    snapshot.forEach(child => {
      const item = child.val();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${index++}</td>
        <td>${item.itemCode || '-'}</td>
        <td>${item.itemName || '-'}</td>
        <td>${item.customerName || '-'}</td>
        <td>${item.branch || '-'}</td>
        <td>${item.agentName || '-'}</td>
        <td>${item.date || '-'}</td>
        <td>${item.notes || '-'}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="deleteRecord('cc_shortages', '${child.key}')">حذف</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });
}

function deleteRecord(path, id) {
  if (confirm("هل أنت تأكد من إتمام عملية الحذف؟")) {
    db.ref(`${path}/${id}`).remove()
      .then(() => showToast("تم الحذف بنجاح", "success"))
      .catch(() => showToast("تعذر الحذف", "danger"));
  }
}

// ==========================================
// 5. Utilities (Export / Toast / Modal)
// ==========================================
function exportShortagesToExcel() {
  exportTableToExcel('shortagesReportTable', 'تقرير_النواقص');
}

function exportCCShortagesToExcel() {
  exportTableToExcel('ccShortagesReportTable', 'تقرير_نواقص_الكول_سنتر');
}

function exportTableToExcel(tableId, filename) {
  const table = document.getElementById(tableId);
  if (!table) return;
  
  const wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function showToast(message, type = 'info') {
  const toast = document.getElementById("toast");
  if (!toast) return;
  
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove("hidden");
  
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}

function openModal(title, contentHtml) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = contentHtml;
  document.getElementById("modalOverlay").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modalOverlay").classList.add("hidden");
}
