function addUser() {
  const editId = document.getElementById('editUserId').value;
  const name = document.getElementById('newUserName').value.trim();
  const pass = document.getElementById('newUserPass').value.trim();
  const role = document.getElementById('newUserRole').value;
  const sections = {};
  document.querySelectorAll('.userSectionChk').forEach(chk => { sections[chk.value] = chk.checked; });
  if (!name) { showToast('❌ أدخل اسم المستخدم', true); return; }
  if (!pass) { showToast('❌ أدخل كلمة المرور', true); return; }
  if (!role) { showToast('❌ اختر الدور', true); return; }
  const userData = { name, pass, role, sections };
  if (editId) {
    rtdb.ref('users/' + editId).update(userData)
      .then(() => { showToast('✅ تم تحديث بيانات المستخدم'); cancelEditUser(); })
      .catch(err => { showToast('❌ خطأ في الحفظ', true); console.error(err); });
  } else {
    const duplicate = usersData.some(u => (u.name || '').toLowerCase() === name.toLowerCase());
    if (duplicate) { showToast('❌ اسم المستخدم موجود بالفعل', true); return; }
    rtdb.ref('users').push(userData)
      .then(() => { showToast('✅ تم إضافة المستخدم'); cancelEditUser(); })
      .catch(err => { showToast('❌ خطأ في الإضافة', true); console.error(err); });
  }
}

function editUser(id) {
  const u = usersData.find(x => x.id === id); if (!u) return;
  document.getElementById('editUserId').value = u.id;
  document.getElementById('newUserName').value = u.name || '';
  document.getElementById('newUserPass').value = u.pass || '';
  document.getElementById('newUserRole').value = u.role || '';
  const sections = { ...getDefaultSectionsForRole(u.role), ...(u.sections || {}) };
  document.querySelectorAll('.userSectionChk').forEach(chk => { chk.checked = !!sections[chk.value]; });
  document.getElementById('cancelEditBtn').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEditUser() {
  document.getElementById('editUserId').value = '';
  document.getElementById('newUserName').value = '';
  document.getElementById('newUserPass').value = '';
  document.getElementById('newUserRole').value = '';
  document.querySelectorAll('.userSectionChk').forEach(chk => { chk.checked = false; });
  document.getElementById('cancelEditBtn').classList.add('hidden');
}

function deleteUser(id) {
  if (currentUser.role !== 'admin') { showToast('❌ هذه الميزة متاحة للأدمن فقط', true); return; }
  if (currentUser && currentUser.id === id) { showToast('❌ لا يمكنك حذف حسابك الحالي', true); return; }
  if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
  rtdb.ref('users/' + id).remove()
    .then(() => showToast('🗑️ تم حذف المستخدم'))
    .catch(err => { showToast('❌ خطأ في الحذف', true); console.error(err); });
}

function renderBranches() {
  const list = document.getElementById('branchesList');
  if (!list) return;
  if (branchesData.length === 0) { list.innerHTML = '<div class="empty-state">لا يوجد فروع بعد</div>'; return; }
  list.innerHTML = branchesData.map(b => `
    <div class="user-row">
      <div style="font-weight:700;color:#1e293b;">🏢 ${b.name || ''} ${b.isApp ? '<span class="badge badge-purple" style="margin-right:6px;">📱 أبلكيشن</span>' : '<span class="badge badge-gray" style="margin-right:6px;">عام</span>'}</div>
      <div>${currentUser.role==='admin'?`<span class="edit-link" onclick="toggleBranchApp('${b.id}', ${!b.isApp})">${b.isApp ? '❎ إلغاء الأبلكيشن' : '📱 تفعيل الأبلكيشن'}</span><span class="delete-link" onclick="deleteBranch('${b.id}')">🗑️ حذف</span>`:''}</div>
    </div>
  `).join('');
}
function addBranch() {
  const input = document.getElementById('newBranchName');
  const name = input.value.trim();
  const isAppChk = document.getElementById('newBranchIsAppChk');
  const isApp = !!(isAppChk && isAppChk.checked);
  if (!name) { showToast('❌ أدخل اسم الفرع', true); return; }
  const duplicate = branchesData.some(b => (b.name || '').toLowerCase() === name.toLowerCase());
  if (duplicate) { showToast('❌ الفرع موجود بالفعل', true); return; }
  rtdb.ref('branches').push({ name, isApp })
    .then(() => { showToast('✅ تم إضافة الفرع'); input.value = ''; if (isAppChk) isAppChk.checked = false; })
    .catch(err => { showToast('❌ خطأ في الإضافة', true); console.error(err); });
}
// تعديل: تفعيل/إلغاء تفعيل الأبلكيشن لفرع موجود بالفعل
function toggleBranchApp(id, newVal) {
  if (currentUser.role !== 'admin') { showToast('❌ هذه الميزة متاحة للأدمن فقط', true); return; }
  rtdb.ref('branches/' + id).update({ isApp: newVal })
    .then(() => showToast(newVal ? '📱 تم تفعيل الأبلكيشن لهذا الفرع' : '✅ تم إلغاء الأبلكيشن لهذا الفرع'))
    .catch(err => { showToast('❌ خطأ في التحديث', true); console.error(err); });
}
function deleteBranch(id) {
  if (currentUser.role !== 'admin') { showToast('❌ هذه الميزة متاحة للأدمن فقط', true); return; }
  if (!confirm('هل أنت متأكد من حذف هذا الفرع؟')) return;
  rtdb.ref('branches/' + id).remove()
    .then(() => showToast('🗑️ تم حذف الفرع'))
    .catch(err => { showToast('❌ خطأ في الحذف', true); console.error(err); });
}

function renderApps() {
  const list = document.getElementById('appsList');
  if (!list) return;
  if (appsData.length === 0) { list.innerHTML = '<div class="empty-state">لا يوجد أبلكيشنز بعد</div>'; return; }
  list.innerHTML = appsData.map(a => `
    <div class="user-row">
      <div style="font-weight:700;color:#1e293b;">📱 ${a.name || ''}</div>
      <div>${currentUser.role==='admin'?`<span class="delete-link" onclick="deleteApp('${a.id}')">🗑️ حذف</span>`:''}</div>
    </div>
  `).join('');
}
function addApp() {
  const input = document.getElementById('newAppName');
  const name = input.value.trim();
  if (!name) { showToast('❌ أدخل اسم الأبلكيشن', true); return; }
  const duplicate = appsData.some(a => (a.name || '').toLowerCase() === name.toLowerCase());
  if (duplicate) { showToast('❌ الأبلكيشن موجود بالفعل', true); return; }
  rtdb.ref('apps').push({ name })
    .then(() => { showToast('✅ تم إضافة الأبلكيشن'); input.value = ''; })
    .catch(err => { showToast('❌ خطأ في الإضافة', true); console.error(err); });
}
function deleteApp(id) {
  if (currentUser.role !== 'admin') { showToast('❌ هذه الميزة متاحة للأدمن فقط', true); return; }
  if (!confirm('هل أنت متأكد من حذف هذا الأبلكيشن؟')) return;
  rtdb.ref('apps/' + id).remove()
    .then(() => showToast('🗑️ تم حذف الأبلكيشن'))
    .catch(err => { showToast('❌ خطأ في الحذف', true); console.error(err); });
}

function renderProducts() {
  const tbody = document.getElementById('productsTable');
  if (!tbody) return;
  if (productsData.length === 0) { tbody.innerHTML = '<tr><td colspan="4" class="empty-state">لا يوجد أصناف بعد</td></tr>'; return; }
  tbody.innerHTML = productsData.map(p => `<tr>
    <td><strong>${p.code || ''}</strong></td>
    <td>${p.name || ''}</td>
    <td>${(parseFloat(p.price) || 0).toFixed(2)}</td>
    <td>${currentUser.role==='admin'?`<span class="delete-link" onclick="deleteProduct('${p.id}')">🗑️ حذف</span>`:''}</td>
  </tr>`).join('');
}
function addProduct() {
  const codeInput = document.getElementById('newProductCode');
  const nameInput = document.getElementById('newProductName');
  const priceInput = document.getElementById('newProductPrice');
  const code = codeInput.value.trim();
  const name = nameInput.value.trim();
  const price = parseFloat(priceInput.value) || 0;
  if (!code) { showToast('❌ أدخل كود الصنف', true); return; }
  if (!name) { showToast('❌ أدخل اسم الصنف', true); return; }
  const duplicate = productsData.some(p => (p.code || '').toLowerCase() === code.toLowerCase());
  if (duplicate) { showToast('❌ كود الصنف موجود بالفعل', true); return; }
  rtdb.ref('products').push({ code, name, price })
    .then(() => {
      showToast('✅ تم إضافة الصنف');
      codeInput.value = ''; nameInput.value = ''; priceInput.value = '';
    })
    .catch(err => { showToast('❌ خطأ في الإضافة', true); console.error(err); });
}
function deleteProduct(id) {
  if (currentUser.role !== 'admin') { showToast('❌ هذه الميزة متاحة للأدمن فقط', true); return; }
  if (!confirm('هل أنت متأكد من حذف هذا الصنف؟')) return;
  rtdb.ref('products/' + id).remove()
    .then(() => showToast('🗑️ تم حذف الصنف'))
    .catch(err => { showToast('❌ خطأ في الحذف', true); console.error(err); });
}
function handleProductFile(file) {
  if (!file) return;
  if (typeof XLSX === 'undefined') { showToast('❌ مكتبة قراءة ملفات Excel لم يتم تحميلها', true); return; }
  const progressBox = document.getElementById('productUploadProgress');
  const progressFill = document.getElementById('productProgressFill');
  const progressText = document.getElementById('productProgressText');
  progressBox.classList.remove('hidden');
  progressFill.style.width = '10%';
  progressText.textContent = 'جارٍ قراءة الملف...';
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      progressFill.style.width = '30%';
      const items = rows.slice(1).filter(r => r && r[0]).map(r => ({
        code: String(r[0] || '').trim(),
        name: String(r[1] || '').trim(),
        price: parseFloat(r[2]) || 0
      })).filter(it => it.code && it.name);
      if (items.length === 0) { showToast('❌ لم يتم العثور على بيانات صالحة في الملف', true); progressBox.classList.add('hidden'); return; }
      let done = 0;
      const total = items.length;
      const existingCodes = new Set(productsData.map(p => (p.code || '').toLowerCase()));
      const updates = {};
      items.forEach(it => {
        if (!existingCodes.has(it.code.toLowerCase())) {
          const newKey = rtdb.ref('products').push().key;
          updates[newKey] = it;
          existingCodes.add(it.code.toLowerCase());
        }
        done++;
        const pct = Math.round((done / total) * 70) + 30;
        progressFill.style.width = pct + '%';
        progressText.textContent = `جارٍ المعالجة... ${done}/${total}`;
      });
      rtdb.ref('products').update(updates)
        .then(() => {
          progressFill.style.width = '100%';
          progressText.textContent = '✅ تم الرفع بنجاح';
          showToast(`✅ تم إضافة ${Object.keys(updates).length} صنف`);
          setTimeout(() => progressBox.classList.add('hidden'), 1500);
          document.getElementById('productFileInput').value = '';
        })
        .catch(err => { showToast('❌ خطأ في رفع البيانات', true); console.error(err); progressBox.classList.add('hidden'); });
    } catch (err) {
      showToast('❌ خطأ في قراءة الملف', true); console.error(err); progressBox.classList.add('hidden');
    }
  };
  reader.readAsArrayBuffer(file);
}

function renderCustomers() {
  const tbody = document.getElementById('customersTable');
  if (!tbody) return;
  if (customersData.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="empty-state">لا يوجد عملاء بعد</td></tr>'; return; }
  tbody.innerHTML = customersData.map(c => `<tr>
    <td><strong>${c.code || ''}</strong></td>
    <td>${c.name || ''}</td>
    <td>${c.phone || '-'}</td>
    <td>${c.address || '-'}</td>
    <td>${currentUser.role==='admin'?`<span class="delete-link" onclick="deleteCustomer('${c.id}')">🗑️ حذف</span>`:''}</td>
  </tr>`).join('');
}
function addCustomer() {
  const codeInput = document.getElementById('newCustomerCode');
  const nameInput = document.getElementById('newCustomerName');
  const phoneInput = document.getElementById('newCustomerPhone');
  const addressInput = document.getElementById('newCustomerAddress');
  const code = codeInput.value.trim();
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const address = addressInput.value.trim();
  if (!code) { showToast('❌ أدخل كود العميل', true); return; }
  if (!name) { showToast('❌ أدخل اسم العميل', true); return; }
  const duplicate = customersData.some(c => (c.code || '').toLowerCase() === code.toLowerCase());
  if (duplicate) { showToast('❌ كود العميل موجود بالفعل', true); return; }
  rtdb.ref('customers').push({ code, name, phone, address })
    .then(() => {
      showToast('✅ تم إضافة العميل');
      codeInput.value = ''; nameInput.value = ''; phoneInput.value = ''; addressInput.value = '';
    })
    .catch(err => { showToast('❌ خطأ في الإضافة', true); console.error(err); });
}
function deleteCustomer(id) {
  if (currentUser.role !== 'admin') { showToast('❌ هذه الميزة متاحة للأدمن فقط', true); return; }
  if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) return;
  rtdb.ref('customers/' + id).remove()
    .then(() => showToast('🗑️ تم حذف العميل'))
    .catch(err => { showToast('❌ خطأ في الحذف', true); console.error(err); });
}
function handleCustomerFile(file) {
  if (!file) return;
  if (typeof XLSX === 'undefined') { showToast('❌ مكتبة قراءة ملفات Excel لم يتم تحميلها', true); return; }
  const progressBox = document.getElementById('customerUploadProgress');
  const progressFill = document.getElementById('customerProgressFill');
  const progressText = document.getElementById('customerProgressText');
  progressBox.classList.remove('hidden');
  progressFill.style.width = '10%';
  progressText.textContent = 'جارٍ قراءة الملف...';
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      progressFill.style.width = '30%';
      const items = rows.slice(1).filter(r => r && r[0]).map(r => ({
        code: String(r[0] || '').trim(),
        name: String(r[1] || '').trim(),
        phone: String(r[2] || '').trim(),
        address: String(r[3] || '').trim()
      })).filter(it => it.code && it.name);
      if (items.length === 0) { showToast('❌ لم يتم العثور على بيانات صالحة في الملف', true); progressBox.classList.add('hidden'); return; }
      let done = 0;
      const total = items.length;
      const existingCodes = new Set(customersData.map(c => (c.code || '').toLowerCase()));
      const updates = {};
      items.forEach(it => {
        if (!existingCodes.has(it.code.toLowerCase())) {
          const newKey = rtdb.ref('customers').push().key;
          updates[newKey] = it;
          existingCodes.add(it.code.toLowerCase());
        }
        done++;
        const pct = Math.round((done / total) * 70) + 30;
        progressFill.style.width = pct + '%';
        progressText.textContent = `جارٍ المعالجة... ${done}/${total}`;
      });
      rtdb.ref('customers').update(updates)
        .then(() => {
          progressFill.style.width = '100%';
          progressText.textContent = '✅ تم الرفع بنجاح';
          showToast(`✅ تم إضافة ${Object.keys(updates).length} عميل`);
          setTimeout(() => progressBox.classList.add('hidden'), 1500);
          document.getElementById('customerFileInput').value = '';
        })
        .catch(err => { showToast('❌ خطأ في رفع البيانات', true); console.error(err); progressBox.classList.add('hidden'); });
    } catch (err) {
      showToast('❌ خطأ في قراءة الملف', true); console.error(err); progressBox.classList.add('hidden');
    }
  };
  reader.readAsArrayBuffer(file);
}
function setupDropZone(zoneId, onFile) {
  const zone = document.getElementById(zoneId);
  if (!zone) return;
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
  });
}

// ============================================
// Navigation & Tabs - MODIFIED
// ============================================
// تعديل: كل قسم في القائمة الجانبية أصبح قائمة منسدلة (اضغط على العنوان لفتح/طي الأزرار جواه)
function buildNavGroup(key, label, bodyHtml) {
  if (!bodyHtml) return '';
  return `<div class="nav-group" data-group="${key}">
    <button type="button" class="nav-group-label" onclick="toggleNavGroup(this)">
      <span>${label}</span><span class="nav-group-caret">▾</span>
    </button>
    <div class="nav-group-body">${bodyHtml}</div>
  </div>`;
}

function toggleNavGroup(labelEl, forceOpen) {
  const group = labelEl.closest ? labelEl.closest('.nav-group') : labelEl;
  if (!group) return;
  const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !group.classList.contains('open');
  group.classList.toggle('open', shouldOpen);
}


function openExternalRequestForm(url) {
  if (!currentUser || !hasSectionPermission('requests')) {
    showToast('⛔ ليس لديك صلاحية للوصول إلى قسم طلبات', true);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

function openBranchesInfoModal() {
  if (!currentUser || !hasSectionPermission('requests')) {
    showToast('⛔ ليس لديك صلاحية للوصول إلى قسم طلبات', true);
    return;
  }
  const modal = document.getElementById('branchesInfoModal');
  if (modal) modal.classList.remove('hidden');
}

function closeBranchesInfoModal() {
  const modal = document.getElementById('branchesInfoModal');
  if (modal) modal.classList.add('hidden');
}

function setupNavByRole() {
  const nav = document.getElementById('mainNav');
  nav.innerHTML = '';
  nav.innerHTML += `<button class="nav-btn active" onclick="showTab('dashboardHome')" id="tab-dashboardHome">🏠 الرئيسية</button>`;
  const role = currentUser.role;
  const sections = currentUser.sections || getDefaultSectionsForRole(role);

  // العمليات: كل قسم يظهر فقط إذا كانت صلاحيته مفعلة للمستخدم
  let opsHtml = '';
  if (sections.newOrder) opsHtml += `<button class="nav-btn" onclick="showTab('newOrder')" id="tab-newOrder">➕ تسجيل أوردر جديد</button>`;
  if (sections.myOrders) opsHtml += `<button class="nav-btn" onclick="showTab('myOrders')" id="tab-myOrders">📋 أوردراتي <span class="nav-count hidden" id="navcount-myOrders"></span></button>`;
  if (sections.allOrders) opsHtml += `<button class="nav-btn" onclick="showTab('allOrders')" id="tab-allOrders">📊 كل أوردرات الكول سنتر <span class="nav-count hidden" id="navcount-allOrders"></span></button>`;
  if (sections.callcenterShortages) opsHtml += `<button class="nav-btn" onclick="showTab('callcenterShortages')" id="tab-callcenterShortages">📞 نواقص كول سنتر</button>`;
  if (opsHtml) nav.innerHTML += buildNavGroup('ops', '📋 العمليات', opsHtml);

  // الأبلكيشن: نواقص + تقارير الأبلكيشن
  let appHtml = '';
  if (sections.shortages) appHtml += `<button class="nav-btn" onclick="showTab('shortages')" id="tab-shortages">📱 نواقص الأبلكيشن</button>`;
  if (sections.shortagesReport) appHtml += `<button class="nav-btn" onclick="showTab('shortagesReport')" id="tab-shortagesReport">📊 ريبورت نواقص الأبلكيشن</button>`;
  if (sections.allAppOrders) appHtml += `<button class="nav-btn" onclick="showTab('allAppOrders')" id="tab-allAppOrders">📊 ريبورت كل أوردرات الأبلكيشن <span class="nav-count hidden" id="navcount-allAppOrders"></span></button>`;
  if (appHtml) nav.innerHTML += buildNavGroup('app', '📱 الأبلكيشن', appHtml);

  // طلبات: روابط النماذج + بيانات الفروع
  let requestsHtml = '';
  if (sections.requests) {
    requestsHtml += `<button class="nav-btn" type="button" onclick="openExternalRequestForm('https://docs.google.com/forms/d/1NsShaEjjYOS4baGwJeQdlcXK8zYNXG14qEp8wNiIIHI/viewform?edit_requested=true')">🔓 طلب إعادة فتح فرع</button>`;
    requestsHtml += `<button class="nav-btn" type="button" onclick="openExternalRequestForm('https://docs.google.com/forms/d/e/1FAIpQLSeU7J0zkKh3CW4OtKdWszQc4lynfPMAKQoNbRMjRcX33u3gbA/viewform')">⚠️ مشاكل أصناف</button>`;
    requestsHtml += `<button class="nav-btn" type="button" onclick="openBranchesInfoModal()">🏢 بيانات الفروع</button>`;
  }
  if (requestsHtml) nav.innerHTML += buildNavGroup('requests', '📋 طلبات', requestsHtml);

  // تم: Done + Cancel
  let doneHtml = '';
  if (sections.doneOrders) doneHtml += `<button class="nav-btn" onclick="showTab('doneOrders')" id="tab-doneOrders">✅ Done</button>`;
  if (sections.cancelOrders) doneHtml += `<button class="nav-btn" onclick="showTab('cancelOrders')" id="tab-cancelOrders">❌ Cancel</button>`;
  if (doneHtml) nav.innerHTML += buildNavGroup('done', '✅ تم', doneHtml);

  // التقارير: تبقى وظائف التقارير كما هي
  let reportHtml = '';
  if (sections.ccShortagesReport) reportHtml += `<button class="nav-btn" onclick="showTab('ccShortagesReport')" id="tab-ccShortagesReport">📊 ريبورت نواقص كول سنتر</button>`;
  if (sections.archive) reportHtml += `<button class="nav-btn" onclick="showTab('archive')" id="tab-archive">📦 أرشيف الأوردرات</button>`;
  if (reportHtml) nav.innerHTML += buildNavGroup('reports', '📊 التقارير', reportHtml);

  // الإدارة كما هي
  let adminHtml = '';
  if (sections.users) adminHtml += `<button class="nav-btn" onclick="showTab('users')" id="tab-users">👥 المستخدمين</button>`;
  if (sections.branches) adminHtml += `<button class="nav-btn" onclick="showTab('branches')" id="tab-branches">🏢 الفروع</button>`;
  if (sections.apps) adminHtml += `<button class="nav-btn" onclick="showTab('apps')" id="tab-apps">📱 الأبلكيشنز</button>`;
  if (sections.products) adminHtml += `<button class="nav-btn" onclick="showTab('products')" id="tab-products">📦 الأصناف</button>`;
  if (sections.customers) adminHtml += `<button class="nav-btn" onclick="showTab('customers')" id="tab-customers">👤 العملاء</button>`;
  if (adminHtml) nav.innerHTML += buildNavGroup('admin', '⚙️ الإدارة', adminHtml);

  const accountHtml = `<button type="button" class="nav-btn" onclick="openChangePassModal()"><span class="udi-icon">🔐</span><span>تغيير كلمة المرور</span></button>
    <button type="button" class="nav-btn nav-btn-danger" onclick="doLogout()"><span class="udi-icon">🚪</span><span>تسجيل الخروج</span></button>`;
  nav.innerHTML += `<div class="nav-account-group">` + buildNavGroup('account', '👤 الحساب', accountHtml) + `</div>`;
  updateNavBadges();
}

// تعديل: تبويبات أذكى - عرض عدد الأوردرات "في الانتظار" كبادچ على التبويب مباشرة حتى لا يحتاج المستخدم لفتحه ليعرف
function updateNavBadges() {
  if (!currentUser) return;
  const setBadge = (elId, count) => {
    const el = document.getElementById(elId);
    if (!el) return;
    if (count > 0) { el.textContent = count > 99 ? '99+' : count; el.classList.remove('hidden'); }
    else { el.classList.add('hidden'); }
  };
  setBadge('navcount-allOrders', ordersData.filter(o => o.status === 'pending').length);
  setBadge('navcount-allAppOrders', appOrdersData.filter(o => o.status === 'pending').length);
  if (currentUser) setBadge('navcount-myOrders', ordersData.filter(o => o.employeeId === currentUser.id && o.status === 'pending').length);
}

// تعديل: مسح البيانات عند الضغط على أوردر جديد
function clearNewOrderForm() {
  document.getElementById('customerSearch').value = '';
  document.getElementById('customerCode').value = '';
  document.getElementById('customerPhone').value = '';
  document.getElementById('customerAddress').value = '';
  selectedCustomer = null;
  document.getElementById('branch').value = '';
  document.getElementById('notes').value = '';
  document.getElementById('deliveryDate').value = new Date().toISOString().split('T')[0];
  document.querySelector('input[name="supplyType"][value="مقاصة"]').checked = true;
  // تعديل: إعادة ضبط خانة "هل هذا الأوردر أبلكيشن؟"
  document.getElementById('isAppOrderChk').checked = false;
  document.getElementById('newOrderApp').value = '';
  document.getElementById('newOrderAppNumber').value = '';
  document.getElementById('newOrderAppField').classList.add('hidden');
  populateBranchSelect(false);
  const notifyOption = document.getElementById('supplyTypeNotifyOption');
  if (notifyOption) notifyOption.classList.remove('hidden');
  orderItems = [];
  renderOrderItems();
  document.getElementById('customerSuggestions').classList.add('hidden');
  document.getElementById('productSuggestions').classList.add('hidden');
}

// تعديل: إظهار/إخفاء خانة اختيار الأبلكيشن عند تفعيل "هل هذا الأوردر أبلكيشن؟"
// تعديل: أوردرات الأبلكيشن ليس لها خيار "عند توفير الصنف يتم إبلاغ العميل" - يبقى فقط مقاصة/مشتريات
function toggleNewOrderAppField() {
  const isApp = document.getElementById('isAppOrderChk').checked;
  document.getElementById('newOrderAppField').classList.toggle('hidden', !isApp);
  // تعديل: عند اختيار أبلكيشن، الفروع المتاحة تبقى فقط الفروع المفعّل لها الأبلكيشن
  populateBranchSelect(isApp);
  const notifyOption = document.getElementById('supplyTypeNotifyOption');
  if (notifyOption) {
    notifyOption.classList.toggle('hidden', isApp);
    if (isApp) {
      const notifyRadio = notifyOption.querySelector('input');
      if (notifyRadio && notifyRadio.checked) {
        document.querySelector('input[name="supplyType"][value="مقاصة"]').checked = true;
      }
    }
  }
}

function clearAppOrderForm() {
  document.getElementById('appOrderCustomerSearch').value = '';
  document.getElementById('appOrderCustomerCode').value = '';
  document.getElementById('appOrderCustomerPhone').value = '';
  document.getElementById('appOrderCustomerAddress').value = '';
  selectedAppOrderCustomer = null;
  document.getElementById('appOrderBranch').value = '';
  document.getElementById('appOrderApp').value = '';
  document.getElementById('appOrderNotes').value = '';
  document.getElementById('appOrderDeliveryDate').value = new Date().toISOString().split('T')[0];
  document.querySelector('input[name="appOrderSupplyType"][value="مقاصة"]').checked = true;
  appOrderItems = [];
  renderAppOrderItems();
  document.getElementById('appOrderCustomerSuggestions').classList.add('hidden');
  document.getElementById('appOrderProductSuggestions').classList.add('hidden');
}

function toggleNavPanel(forceOpen) {
  const sidebar = document.getElementById('sidebarNav');
  const backdrop = document.getElementById('sidebarBackdrop');
  const shell = document.getElementById('appShell');
  const menuIcon = document.getElementById('topbarMenuIcon');
  if (!sidebar) return;
  const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !sidebar.classList.contains('open');
  sidebar.classList.toggle('open', shouldOpen);
  if (backdrop) backdrop.classList.toggle('open', shouldOpen);
  if (shell) shell.classList.toggle('nav-shifted', shouldOpen);
  if (menuIcon) menuIcon.textContent = shouldOpen ? '✕' : '☰';
}

function renderDashboardHome(){
  const today = new Date();
  const pad=n=>String(n).padStart(2,'0');
  const dateEl=document.getElementById('homeDate');
  if(dateEl) dateEl.textContent=`${pad(today.getDate())}/${pad(today.getMonth()+1)}/${today.getFullYear()}`;
  const all=[...(ordersData||[]),...(appOrdersData||[])];
  const pending=all.filter(o=>o.status==='pending').length;
  const out=all.filter(o=>o.status==='outdelivery').length;
  const done=all.filter(o=>o.status==='completed').length;
  const cancelled=all.filter(o=>o.status==='cancelled').length;
  const todayKey=today.toISOString().split('T')[0];
  const todayOrders=all.filter(o=>o.deliveryDate===todayKey || o.date===todayKey).length;
  const sales=all.reduce((sum,o)=>sum+(Number(o.total)||0),0);
  const kpis=[
    ['📦','إجمالي الأوردرات',all.length,'كل المصادر','#2563eb'],
    ['⏳','قيد الانتظار',pending,'تحتاج متابعة','#f59e0b'],
    ['🚚','قيد التوصيل',out,'Out for delivery','#2563eb'],
    ['✅','تم التنفيذ',done,'Completed','#16a34a'],
    ['💰','قيمة الأوردرات',sales.toLocaleString('en-US',{maximumFractionDigits:0})+' ج.م','إجمالي مسجل','#c9a227']
  ];
  const box=document.getElementById('homeKpis');
  if(box) box.innerHTML=kpis.map(k=>`<div class="kpi-card" style="--accent:${k[4]}"><div class="kpi-top"><span>${k[1]}</span><span class="kpi-icon">${k[0]}</span></div><div class="kpi-value">${k[2]}</div><div class="kpi-note">${k[3]}</div></div>`).join('');

  // الرئيسية متاحة للجميع، لكن الاختصارات لا تظهر إلا للأقسام المسموحة للمستخدم.
  const sections = currentUser ? (currentUser.sections || getDefaultSectionsForRole(currentUser.role)) : {};
  const quick = [];
  if (sections.newOrder) quick.push(`<button class="quick-action" onclick="showTab('newOrder')"><b>➕ تسجيل أوردر</b><span>إنشاء أوردر جديد</span></button>`);
  if (sections.myOrders) quick.push(`<button class="quick-action" onclick="showTab('myOrders')"><b>📋 أوردراتي</b><span>عرض أوردراتك الحالية</span></button>`);
  if (sections.allOrders) quick.push(`<button class="quick-action" onclick="showTab('allOrders')"><b>📦 كل الأوردرات</b><span>متابعة أوردرات الكول سنتر</span></button>`);
  if (sections.allAppOrders) quick.push(`<button class="quick-action" onclick="showTab('allAppOrders')"><b>📱 أوردرات الأبلكيشن</b><span>متابعة طلبات التطبيقات</span></button>`);
  if (sections.shortages) quick.push(`<button class="quick-action" onclick="showTab('shortages')"><b>⚠️ النواقص</b><span>متابعة نواقص الأبلكيشن</span></button>`);
  if (sections.callcenterShortages) quick.push(`<button class="quick-action" onclick="showTab('callcenterShortages')"><b>📞 نواقص كول سنتر</b><span>متابعة النواقص</span></button>`);
  const quickBox=document.getElementById('homeQuickActions');
  if(quickBox) quickBox.innerHTML=quick.length ? quick.join('') : `<div style="color:#64748b;padding:12px;">لا توجد أقسام تشغيلية إضافية متاحة لهذا المستخدم.</div>`;

  const st=document.getElementById('homeStatusList');
  if(st) st.innerHTML=`<div class="status-row"><span class="status-label"><i class="status-dot" style="--dot:#f59e0b"></i>في الانتظار</span><b class="status-num">${pending}</b></div><div class="status-row"><span class="status-label"><i class="status-dot" style="--dot:#2563eb"></i>قيد التوصيل</span><b class="status-num">${out}</b></div><div class="status-row"><span class="status-label"><i class="status-dot" style="--dot:#16a34a"></i>تم التنفيذ</span><b class="status-num">${done}</b></div><div class="status-row"><span class="status-label"><i class="status-dot" style="--dot:#dc2626"></i>ملغي</span><b class="status-num">${cancelled}</b></div><div class="status-row"><span class="status-label"><i class="status-dot" style="--dot:#7c3aed"></i>أوردرات اليوم</span><b class="status-num">${todayOrders}</b></div>`;
}

function hasSectionPermission(section) {
  if (!currentUser) return false;
  if (currentUser.role === 'admin') return true;
  const sections = currentUser.sections || getDefaultSectionsForRole(currentUser.role);
  return !!sections[section];
}

function showTab(tab) {
  // الرئيسية متاحة دائماً بعد تسجيل الدخول. أي قسم آخر يحتاج صلاحية صريحة.
  if (tab !== 'dashboardHome' && !hasSectionPermission(tab)) {
    showToast('⛔ ليس لديك صلاحية للوصول إلى هذا القسم', true);
    tab = 'dashboardHome';
  }
  ['dashboardHome','newOrder','myOrders','allOrders','allAppOrders','doneOrders','cancelOrders','shortages','shortagesReport','callcenterShortages','ccShortagesReport','archive','users','branches','apps','products','customers'].forEach(t => {
    const el = document.getElementById(t); 
    const btn = document.getElementById('tab-'+t);
    if(el) el.classList.add('hidden'); 
    if(btn) btn.classList.remove('active');
  });
  const target = document.getElementById(tab); 
  const targetBtn = document.getElementById('tab-'+tab);
  if(target) target.classList.remove('hidden'); 
  if(targetBtn) {
    targetBtn.classList.add('active');
    const lbl = document.getElementById('curTabLabel'); if (lbl) lbl.textContent = targetBtn.textContent.trim();
    // تعديل: فتح القائمة المنسدلة التي بها القسم النشط تلقائياً
    const parentGroup = targetBtn.closest('.nav-group');
    if (parentGroup) toggleNavGroup(parentGroup, true);
  }

  // تعديل: طي القائمة تلقائياً بعد اختيار القسم لترك كامل مساحة الشاشة للاستعراض
  toggleNavPanel(false);

  // تعديل: مسح النموذج عند الذهاب لأوردر جديد
  if(tab==='dashboardHome') renderDashboardHome();
  if(tab==='newOrder') clearNewOrderForm();
  if(tab==='myOrders') renderMyOrders();
  if(tab==='allOrders') renderAllOrders();
  if(tab==='allAppOrders') renderAllAppOrders();
  if(tab==='doneOrders') renderDoneOrders();
  if(tab==='cancelOrders') renderCancelOrders();
  if(tab==='shortages') renderShortages();
  if(tab==='shortagesReport') renderShortagesReport();
  if(tab==='callcenterShortages') renderCCShortages();
  if(tab==='ccShortagesReport') renderCCShortagesReport();
  if(tab==='archive') renderArchive();
  if(tab==='users') renderUsers();
  if(tab==='branches') renderBranches();
  if(tab==='apps') renderApps();
  if(tab==='products') renderProducts();
  if(tab==='customers') renderCustomers();
}

// ============================================
// Customer Search
// ============================================
function searchCustomers() {
  const input = document.getElementById('customerSearch');
  const suggestions = document.getElementById('customerSuggestions');
  const query = input.value.trim().toLowerCase();
  customerSelIndex = -1;
  if (!query) { suggestions.classList.add('hidden'); return; }
  const matches = customersData.filter(c =>
    (c.code && c.code.toLowerCase().includes(query)) ||
    (c.name && c.name.toLowerCase().includes(query))
  ).slice(0, 7);
  if (matches.length === 0 && query.length >= 2) {
    suggestions.innerHTML = `<div class="suggestion-add" onclick="openQuickCustomerModal('${input.value}')">➕ إضافة عميل جديد: "${input.value}"</div>`;
    suggestions.classList.remove('hidden'); return;
  }
  if (matches.length === 0) { suggestions.classList.add('hidden'); return; }
  suggestions.innerHTML = matches.map((c, i) => `
    <div class="suggestion-item" data-index="${i}" data-id="${c.id}" onclick="selectCustomer('${c.id}')">
      <div><span class="sug-code">${c.code}</span> - <span class="sug-name">${c.name}</span></div>
      <span class="sug-extra">${c.phone || ''}</span>
    </div>
  `).join('');
  suggestions.classList.remove('hidden');
}

function handleCustomerKey(e) {
  const items = document.querySelectorAll('#customerSuggestions .suggestion-item');
  if (e.key === 'ArrowDown') { e.preventDefault(); customerSelIndex = Math.min(customerSelIndex + 1, items.length - 1); highlightCustomerItem(items); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); customerSelIndex = Math.max(customerSelIndex - 1, 0); highlightCustomerItem(items); }
  else if (e.key === 'Enter') {
    e.preventDefault();
    if (customerSelIndex >= 0 && items[customerSelIndex]) { selectCustomer(items[customerSelIndex].dataset.id); }
    else if (document.querySelector('#customerSuggestions .suggestion-add')) { openQuickCustomerModal(document.getElementById('customerSearch').value); }
    else { document.getElementById('productSearch').focus(); }
  }
  else if (e.key === 'Escape') { document.getElementById('customerSuggestions').classList.add('hidden'); }
}

function highlightCustomerItem(items) {
  items.forEach((item, i) => item.classList.toggle('active', i === customerSelIndex));
  if (items[customerSelIndex]) items[customerSelIndex].scrollIntoView({ block: 'nearest' });
}

function selectCustomer(id) {
  const c = customersData.find(x => x.id === id); if (!c) return;
  selectedCustomer = c;
  document.getElementById('customerSearch').value = c.name;
  document.getElementById('customerCode').value = c.code || '';
  document.getElementById('customerPhone').value = c.phone || '';
  document.getElementById('customerAddress').value = c.address || '';
  document.getElementById('customerSuggestions').classList.add('hidden');
}

// ============================================
// Product Search
// ============================================
function searchProducts() {
  const input = document.getElementById('productSearch');
  const suggestions = document.getElementById('productSuggestions');
  const query = input.value.trim().toLowerCase();
  productSelIndex = -1;
  if (!query) { suggestions.classList.add('hidden'); return; }
  const matches = productsData.filter(p =>
    (p.code && p.code.toLowerCase().includes(query)) ||
    (p.name && p.name.toLowerCase().includes(query))
  ).slice(0, 7);
  if (matches.length === 0 && query.length >= 2) {
    suggestions.innerHTML = `<div class="suggestion-add" onclick="openQuickProductModal('${input.value}')">➕ إضافة صنف جديد: "${input.value}"</div>`;
    suggestions.classList.remove('hidden'); return;
  }
  if (matches.length === 0) { suggestions.classList.add('hidden'); return; }
  suggestions.innerHTML = matches.map((p, i) => `
    <div class="suggestion-item" data-index="${i}" data-id="${p.id}" onclick="addItemToOrder('${p.id}')">
      <div><span class="sug-code">${p.code}</span> - <span class="sug-name">${p.name}</span></div>
      <span class="sug-extra" style="color:#16a34a;font-weight:700;">${parseFloat(p.price||0).toFixed(2)} ج.م</span>
    </div>
  `).join('');
  suggestions.classList.remove('hidden');
}

function handleProductKey(e) {
  const items = document.querySelectorAll('#productSuggestions .suggestion-item');
  if (e.key === 'ArrowDown') { e.preventDefault(); productSelIndex = Math.min(productSelIndex + 1, items.length - 1); highlightProductItem(items); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); productSelIndex = Math.max(productSelIndex - 1, 0); highlightProductItem(items); }
  else if (e.key === 'Enter') {
    e.preventDefault();
    if (productSelIndex >= 0 && items[productSelIndex]) { addItemToOrder(items[productSelIndex].dataset.id); }
    else if (document.querySelector('#productSuggestions .suggestion-add')) { openQuickProductModal(document.getElementById('productSearch').value); }
  }
  else if (e.key === 'Escape') { document.getElementById('productSuggestions').classList.add('hidden'); }
}

function highlightProductItem(items) {
  items.forEach((item, i) => item.classList.toggle('active', i === productSelIndex));
  if (items[productSelIndex]) items[productSelIndex].scrollIntoView({ block: 'nearest' });
}

function addItemToOrder(productId) {
  const product = productsData.find(p => p.id === productId); if (!product) return;
  const existing = orderItems.find(i => i.productId === productId);
  if (existing) { existing.qty += 1; }
  else { orderItems.push({ productId: product.id, code: product.code, name: product.name, price: parseFloat(product.price) || 0, qty: 1 }); }
  document.getElementById('productSearch').value = '';
  document.getElementById('productSuggestions').classList.add('hidden');
  renderOrderItems();
}

function updateItemQty(index, qty) {
  qty = parseInt(qty) || 1; if (qty < 1) qty = 1;
  orderItems[index].qty = qty; renderOrderItems();
}
function removeItem(index) { orderItems.splice(index, 1); renderOrderItems(); }

function renderOrderItems() {
  const tbody = document.getElementById('orderItemsBody');
  if (orderItems.length === 0) { tbody.innerHTML = '<tr><td colspan="6" style="color:#94a3b8;padding:16px;">لم تضف أصناف بعد</td></tr>'; document.getElementById('orderTotal').textContent = '0'; return; }
  let total = 0;
  tbody.innerHTML = orderItems.map((item, i) => {
    const lineTotal = item.price * item.qty; total += lineTotal;
    return `<tr><td>${item.code}</td><td>${item.name}</td><td>${item.price.toFixed(2)}</td><td><input type="number" min="1" value="${item.qty}" onchange="updateItemQty(${i},this.value)"></td><td>${lineTotal.toFixed(2)}</td><td><span class="delete-link" onclick="removeItem(${i})">🗑️</span></td></tr>`;
  }).join('');
  document.getElementById('orderTotal').textContent = total.toFixed(2);
}
function getOrderTotal() { return orderItems.reduce((sum, i) => sum + (i.price * i.qty), 0); }

// ============================================
// App Order - Customer Search
// ============================================
function searchAppOrderCustomers() {
  const input = document.getElementById('appOrderCustomerSearch');
  const suggestions = document.getElementById('appOrderCustomerSuggestions');
  const query = input.value.trim().toLowerCase();
  appOrderCustomerSelIndex = -1;
  if (!query) { suggestions.classList.add('hidden'); return; }
  const matches = customersData.filter(c =>
    (c.code && c.code.toLowerCase().includes(query)) ||
    (c.name && c.name.toLowerCase().includes(query))
  ).slice(0, 7);
  if (matches.length === 0 && query.length >= 2) {
    suggestions.innerHTML = `<div class="suggestion-add" onclick="openQuickCustomerModal('${input.value}','appOrder')">➕ إضافة عميل جديد: "${input.value}"</div>`;
    suggestions.classList.remove('hidden'); return;
  }
  if (matches.length === 0) { suggestions.classList.add('hidden'); return; }
  suggestions.innerHTML = matches.map((c, i) => `
    <div class="suggestion-item" data-index="${i}" data-id="${c.id}" onclick="selectAppOrderCustomer('${c.id}')">
      <div><span class="sug-code">${c.code}</span> - <span class="sug-name">${c.name}</span></div>
      <span class="sug-extra">${c.phone || ''}</span>
    </div>
  `).join('');
  suggestions.classList.remove('hidden');
}
function handleAppOrderCustomerKey(e) {
  const items = document.querySelectorAll('#appOrderCustomerSuggestions .suggestion-item');
  if (e.key === 'ArrowDown') { e.preventDefault(); appOrderCustomerSelIndex = Math.min(appOrderCustomerSelIndex + 1, items.length - 1); highlightAppOrderCustomerItem(items); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); appOrderCustomerSelIndex = Math.max(appOrderCustomerSelIndex - 1, 0); highlightAppOrderCustomerItem(items); }
  else if (e.key === 'Enter') {
    e.preventDefault();
    if (appOrderCustomerSelIndex >= 0 && items[appOrderCustomerSelIndex]) { selectAppOrderCustomer(items[appOrderCustomerSelIndex].dataset.id); }
    else if (document.querySelector('#appOrderCustomerSuggestions .suggestion-add')) { openQuickCustomerModal(document.getElementById('appOrderCustomerSearch').value, 'appOrder'); }
    else { document.getElementById('appOrderProductSearch').focus(); }
  }
  else if (e.key === 'Escape') { document.getElementById('appOrderCustomerSuggestions').classList.add('hidden'); }
}
function highlightAppOrderCustomerItem(items) {
  items.forEach((item, i) => item.classList.toggle('active', i === appOrderCustomerSelIndex));
  if (items[appOrderCustomerSelIndex]) items[appOrderCustomerSelIndex].scrollIntoView({ block: 'nearest' });
}
function selectAppOrderCustomer(id) {
  const c = customersData.find(x => x.id === id); if (!c) return;
  selectedAppOrderCustomer = c;
  document.getElementById('appOrderCustomerSearch').value = c.name;
  document.getElementById('appOrderCustomerCode').value = c.code || '';
  document.getElementById('appOrderCustomerPhone').value = c.phone || '';
  document.getElementById('appOrderCustomerAddress').value = c.address || '';
  document.getElementById('appOrderCustomerSuggestions').classList.add('hidden');
}

// ============================================
// App Order - Product Search
// ============================================
function searchAppOrderProducts() {
  const input = document.getElementById('appOrderProductSearch');
  const suggestions = document.getElementById('appOrderProductSuggestions');
  const query = input.value.trim().toLowerCase();
  appOrderProductSelIndex = -1;
  if (!query) { suggestions.classList.add('hidden'); return; }
  const matches = productsData.filter(p =>
    (p.code && p.code.toLowerCase().includes(query)) ||
    (p.name && p.name.toLowerCase().includes(query))
  ).slice(0, 7);
  if (matches.length === 0 && query.length >= 2) {
    suggestions.innerHTML = `<div class="suggestion-add" onclick="openQuickProductModal('${input.value}','appOrder')">➕ إضافة صنف جديد: "${input.value}"</div>`;
    suggestions.classList.remove('hidden'); return;
  }
  if (matches.length === 0) { suggestions.classList.add('hidden'); return; }
  suggestions.innerHTML = matches.map((p, i) => `
    <div class="suggestion-item" data-index="${i}" data-id="${p.id}" onclick="addItemToAppOrder('${p.id}')">
      <div><span class="sug-code">${p.code}</span> - <span class="sug-name">${p.name}</span></div>
      <span class="sug-extra" style="color:#16a34a;font-weight:700;">${parseFloat(p.price||0).toFixed(2)} ج.م</span>
    </div>
  `).join('');
  suggestions.classList.remove('hidden');
}
function handleAppOrderProductKey(e) {
  const items = document.querySelectorAll('#appOrderProductSuggestions .suggestion-item');
  if (e.key === 'ArrowDown') { e.preventDefault(); appOrderProductSelIndex = Math.min(appOrderProductSelIndex + 1, items.length - 1); highlightAppOrderProductItem(items); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); appOrderProductSelIndex = Math.max(appOrderProductSelIndex - 1, 0); highlightAppOrderProductItem(items); }
  else if (e.key === 'Enter') {
    e.preventDefault();
    if (appOrderProductSelIndex >= 0 && items[appOrderProductSelIndex]) { addItemToAppOrder(items[appOrderProductSelIndex].dataset.id); }
    else if (document.querySelector('#appOrderProductSuggestions .suggestion-add')) { openQuickProductModal(document.getElementById('appOrderProductSearch').value, 'appOrder'); }
  }
  else if (e.key === 'Escape') { document.getElementById('appOrderProductSuggestions').classList.add('hidden'); }
}
function highlightAppOrderProductItem(items) {
  items.forEach((item, i) => item.classList.toggle('active', i === appOrderProductSelIndex));
  if (items[appOrderProductSelIndex]) items[appOrderProductSelIndex].scrollIntoView({ block: 'nearest' });
}
function addItemToAppOrder(productId) {
  const product = productsData.find(p => p.id === productId); if (!product) return;
  const existing = appOrderItems.find(i => i.productId === productId);
  if (existing) { existing.qty += 1; }
  else { appOrderItems.push({ productId: product.id, code: product.code, name: product.name, price: parseFloat(product.price) || 0, qty: 1 }); }
  document.getElementById('appOrderProductSearch').value = '';
  document.getElementById('appOrderProductSuggestions').classList.add('hidden');
  renderAppOrderItems();
}
function updateAppOrderItemQty(index, qty) {
  qty = parseInt(qty) || 1; if (qty < 1) qty = 1;
  appOrderItems[index].qty = qty; renderAppOrderItems();
}
function removeAppOrderItem(index) { appOrderItems.splice(index, 1); renderAppOrderItems(); }

function renderAppOrderItems() {
  const tbody = document.getElementById('appOrderItemsBody');
  if (appOrderItems.length === 0) { tbody.innerHTML = '<tr><td colspan="6" style="color:#94a3b8;padding:16px;">لم تضف أصناف بعد</td></tr>'; document.getElementById('appOrderTotal').textContent = '0'; return; }
  let total = 0;
  tbody.innerHTML = appOrderItems.map((item, i) => {
    const lineTotal = item.price * item.qty; total += lineTotal;
    return `<tr><td>${item.code}</td><td>${item.name}</td><td>${item.price.toFixed(2)}</td><td><input type="number" min="1" value="${item.qty}" onchange="updateAppOrderItemQty(${i},this.value)"></td><td>${lineTotal.toFixed(2)}</td><td><span class="delete-link" onclick="removeAppOrderItem(${i})">🗑️</span></td></tr>`;
  }).join('');
  document.getElementById('appOrderTotal').textContent = total.toFixed(2);
}
function getAppOrderTotal() { return appOrderItems.reduce((sum, i) => sum + (i.price * i.qty), 0); }

// ============================================
// Submit App Order
// ============================================
function submitAppOrder() {
  const customer = selectedAppOrderCustomer ? selectedAppOrderCustomer.name : '';
  const customerCode = selectedAppOrderCustomer ? selectedAppOrderCustomer.code : '';
  const branch = document.getElementById('appOrderBranch').value;
  const appName = document.getElementById('appOrderApp').value;
  const notes = document.getElementById('appOrderNotes').value.trim();
  const supplyType = document.querySelector('input[name="appOrderSupplyType"]:checked')?.value || 'مقاصة';
  const deliveryDate = document.getElementById('appOrderDeliveryDate').value;
  if (!customer) { showToast('❌ اختر العميل', true); return; }
  if (!branch) { showToast('❌ اختر الفرع', true); return; }
  if (!appName) { showToast('❌ اختر الأبلكيشن', true); return; }
  if (appOrderItems.length === 0) { showToast('❌ أضف صنف واحد على الأقل', true); return; }
  const itemsText = appOrderItems.map(i => `${i.code} - ${i.name} (x${i.qty}) = ${(i.price * i.qty).toFixed(2)} ج.م`).join('\n');
  const total = getAppOrderTotal();
  rtdb.ref('app_orders').push({
    customer, customerCode, branch, appName, items: itemsText, itemsArray: appOrderItems, total,
    supplyType, status: 'pending', deliveryDate,
    employee: currentUser.name, employeeId: currentUser.id,
    date: new Date().toISOString().split('T')[0],
    notes, timestamp: firebase.database.ServerValue.TIMESTAMP
  }).then(() => {
    showToast('✅ تم حفظ أوردر الأبلكيشن');
    clearAppOrderForm();
  }).catch(err => { showToast('❌ حدث خطأ أثناء الحفظ', true); console.error(err); });
}

// ============================================
// Submit Order
// ============================================
function submitOrder() {
  const customer = selectedCustomer ? selectedCustomer.name : '';
  const customerCode = selectedCustomer ? selectedCustomer.code : '';
  const branch = document.getElementById('branch').value;
  const notes = document.getElementById('notes').value.trim();
  const supplyType = document.querySelector('input[name="supplyType"]:checked')?.value || 'مقاصة';
  const deliveryDate = document.getElementById('deliveryDate').value;
  // تعديل: تحديد ما إذا كان الأوردر أبلكيشن أم عادي من نفس نموذج "أوردر جديد"
  const isAppOrder = document.getElementById('isAppOrderChk').checked;
  const appName = isAppOrder ? document.getElementById('newOrderApp').value : '';
  const appOrderNumber = isAppOrder ? document.getElementById('newOrderAppNumber').value.trim() : '';
  if (!customer) { showToast('❌ اختر العميل', true); return; }
  if (!branch) { showToast('❌ اختر الفرع', true); return; }
  if (isAppOrder && !appName) { showToast('❌ اختر الأبلكيشن', true); return; }
  if (isAppOrder && !appOrderNumber) { showToast('❌ أدخل رقم الأوردر على الأبلكيشن', true); return; }
  if (orderItems.length === 0) { showToast('❌ أضف صنف واحد على الأقل', true); return; }
  const itemsText = orderItems.map(i => `${i.code} - ${i.name} (x${i.qty}) = ${(i.price * i.qty).toFixed(2)} ج.م`).join('\n');
  const total = getOrderTotal();
  const orderData = {
    customer, customerCode, branch, items: itemsText, itemsArray: orderItems, total,
    supplyType, status: 'pending', deliveryDate,
    employee: currentUser.name, employeeId: currentUser.id,
    date: new Date().toISOString().split('T')[0],
    notes, timestamp: firebase.database.ServerValue.TIMESTAMP
  };
  // تعديل: توجيه الأوردر - لو "أبلكيشن" يتحفظ في app_orders (يظهر في ريبورت الأبلكيشن)، ولو "عادي" يتحفظ في orders (يظهر في كل الأوردرات)
  if (isAppOrder) { orderData.appName = appName; orderData.appOrderNumber = appOrderNumber; }
  const targetRef = isAppOrder ? rtdb.ref('app_orders') : rtdb.ref('orders');
  targetRef.push(orderData).then(() => {
    showToast(isAppOrder ? '✅ تم حفظ أوردر الأبلكيشن' : '✅ تم حفظ الأوردر');
    clearNewOrderForm();
  }).catch(err => { showToast('❌ حدث خطأ أثناء الحفظ', true); console.error(err); });
}

// ============================================
// My Orders
// ============================================
function renderMyOrders() {
  const list = document.getElementById('myOrdersList');
  if (!list || !currentUser) return;
  const mine = ordersData.filter(o => o.employeeId === currentUser.id);
  if (mine.length === 0) { list.innerHTML = '<div class="empty-state">لا يوجد أوردرات مسجلة بعد</div>'; return; }
  list.innerHTML = mine.map(o => {
    const statusLabel = STATUS_LABELS[o.status] || o.status;
    const statusClass = STATUS_CLASSES[o.status] || 'status-pending';
    return `<div class="order-card">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;"><strong>${o.customer}</strong><span style="color:#64748b;font-size:13px;">${o.date||''}</span></div>
      <div style="margin:8px 0;">
        <span class="badge badge-blue">${o.branch}</span>
        <span class="badge badge-orange">${o.supplyType||'مقاصة'}</span>
        <span class="badge ${statusClass}">${statusLabel}</span>
      </div>
      <div style="color:#374151;font-size:14px;margin-bottom:6px;white-space:pre-line;"><strong>الأصناف:</strong><br>${o.items||'-'}</div>
      <div style="color:#16a34a;font-weight:700;font-size:15px;">الإجمالي: ${o.total?o.total.toFixed(2):'0'} ج.م</div>
      ${o.deliveryDate?`<div style="color:#7c3aed;font-size:13px;margin-top:4px;">📅 ميعاد الخروج: ${o.deliveryDate}</div>`:''}
      ${o.notes?`<div style="color:#64748b;font-size:14px;margin-top:4px;">📝 ${o.notes}</div>`:''}
    </div>`;
  }).join('');
}

// ============================================
// All Orders with Filter & Search
// ============================================
function setFilter(filter) {
  currentFilter = filter;
  ['all','today','pending','outdelivery'].forEach(f => {
    const btn = document.getElementById('filter-'+f); if(btn) btn.classList.remove('active');
  });
  const activeBtn = document.getElementById('filter-'+filter); if(activeBtn) activeBtn.classList.add('active');
  renderAllOrders();
}

function renderAllOrders() {
  const statsBox = document.getElementById('statsBox');
  const table = document.getElementById('allOrdersTable');
  if (!statsBox || !table) return;
  const today = new Date().toISOString().split('T')[0];
  const searchQ = (document.getElementById('orderSearch')?.value || '').trim().toLowerCase();

  // تعديل: الأوردرات "تم" و"ملغي" تنتقل لتبويبي Done/Cancel ولا تظهر هنا بعد الآن
  let filtered = ordersData.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  if (currentFilter === 'today') filtered = filtered.filter(o => o.deliveryDate === today);
  else if (currentFilter === 'pending') filtered = filtered.filter(o => o.status === 'pending');
  else if (currentFilter === 'outdelivery') filtered = filtered.filter(o => o.status === 'outdelivery');

  if (searchQ) {
    filtered = filtered.filter(o =>
      (o.employee && o.employee.toLowerCase().includes(searchQ)) ||
      (o.branch && o.branch.toLowerCase().includes(searchQ)) ||
      (o.customer && o.customer.toLowerCase().includes(searchQ)) ||
      (o.customerCode && o.customerCode.toLowerCase().includes(searchQ))
    );
  }

  const totalOrders = ordersData.length;
  const completed = ordersData.filter(o => o.status === 'completed').length;
  const pending = ordersData.filter(o => o.status === 'pending').length;
  const outdelivery = ordersData.filter(o => o.status === 'outdelivery').length;
  const cancelled = ordersData.filter(o => o.status === 'cancelled').length;
  const todayOrders = ordersData.filter(o => o.deliveryDate === today).length;

  statsBox.innerHTML = `
    <div class="stat-card"><div class="stat-number">${totalOrders}</div><div class="stat-label">إجمالي</div></div>
    <div class="stat-card"><div class="stat-number" style="color:#16a34a;">${completed}</div><div class="stat-label">تم</div></div>
    <div class="stat-card"><div class="stat-number" style="color:#f59e0b;">${pending}</div><div class="stat-label">في الانتظار</div></div>
    <div class="stat-card"><div class="stat-number" style="color:#2563eb;">${outdelivery}</div><div class="stat-label">Out</div></div>
    <div class="stat-card"><div class="stat-number" style="color:#dc2626;">${cancelled}</div><div class="stat-label">ملغي</div></div>
    <div class="stat-card"><div class="stat-number" style="color:#7c3aed;">${todayOrders}</div><div class="stat-label">اليوم</div></div>
  `;

  if (filtered.length === 0) { table.innerHTML = `<tr><td colspan="11" class="empty-state">لا يوجد أوردرات</td></tr>`; return; }

  table.innerHTML = filtered.map((o, i) => {
    const statusClass = STATUS_CLASSES[o.status] || 'status-pending';
    const statusLabel = STATUS_LABELS[o.status] || o.status;
    const isUrgent = o.deliveryDate === today && o.status !== 'completed' && o.status !== 'cancelled';
    const canEdit = hasPermission('editOrders');
    // تعديل: السماح لموظف الأبلكيشن بتعديل الحالة أيضاً
    const canChangeStatus = hasPermission('editStatus');

    let statusCell = `<span class="badge ${statusClass}">${statusLabel}</span>`;
    if (canChangeStatus) {
      statusCell = `<select class="status-select ${statusClass}" onchange="updateOrderStatus('${o.id}', this.value)">
        <option value="pending" ${o.status==='pending'?'selected':''}>في الانتظار</option>
        <option value="completed" ${o.status==='completed'?'selected':''}>تم</option>
        <option value="outdelivery" ${o.status==='outdelivery'?'selected':''}>Out</option>
        <option value="cancelled" ${o.status==='cancelled'?'selected':''}>ملغي</option>
      </select>`;
    }
    let actions = `<span class="view-link" onclick="openReviewOrder('${o.id}')">👁️ مراجعة</span>`;
    if (canEdit) {
      actions += `<span class="edit-link" onclick="openEditOrder('${o.id}')">✏️ تعديل</span>
                 <span class="delete-link" onclick="deleteOrder('${o.id}')">🗑️ حذف</span>`;
    }
    return `<tr class="${isUrgent?'urgent-row':''}">
      <td>${i+1}</td>
      <td><strong>${o.customer}</strong>${o.customerCode?`<br><span style="font-size:11px;color:#64748b;">${o.customerCode}</span>`:''}</td>
      <td><span class="badge badge-blue">${o.branch}</span></td>
      <td style="max-width:200px;font-size:12px;white-space:pre-line;">${o.items||'-'}</td>
      <td><strong style="color:#16a34a;">${o.total?o.total.toFixed(2):'0'}</strong></td>
      <td><span class="badge badge-orange">${o.supplyType||'مقاصة'}</span></td>
      <td>${statusCell}</td>
      <td><span class="badge ${isUrgent?'badge-red':'badge-cyan'}">${o.deliveryDate||'-'}</span></td>
      <td><span class="badge badge-purple">${o.employee}</span></td>
      <td>${o.date||''}</td>
      <td>${actions}</td>
    </tr>`;
  }).join('');
}

function updateOrderStatus(id, newStatus) {
  if (!hasPermission('editStatus')) { showToast('❌ ليس لديك صلاحية تعديل حالة الأوردر', true); return; }
  // تعديل: عند اختيار "ملغي" يفتح مربع نصي لكتابة سبب الإلغاء قبل الحفظ
  if (newStatus === 'cancelled') {
    openQuickCancelReasonModal(id, 'orders');
    return;
  }
  const updateData = { status: newStatus, cancelReason: '' };
  db.ref('orders/' + id).update(updateData)
    .then(() => showToast('✅ تم تحديث الحالة'))
    .catch(err => { showToast('❌ خطأ في التحديث', true); console.error(err); });
}

function deleteOrder(id) {
  if (currentUser.role !== 'admin') { showToast('❌ هذه الميزة متاحة للأدمن فقط', true); return; }
  if (!confirm('هل أنت متأكد من حذف هذا الأوردر؟')) return;
  db.ref('orders/' + id).remove().then(() => showToast('🗑️ تم حذف الأوردر')).catch(err => { showToast('❌ خطأ في الحذف', true); console.error(err); });
}

// ============================================
// All App Orders with Filter & Search
// ============================================
function setAppFilter(filter) {
  currentAppFilter = filter;
  ['all','today','pending','outdelivery'].forEach(f => {
    const btn = document.getElementById('filter-app-'+f); if(btn) btn.classList.remove('active');
  });
  const activeBtn = document.getElementById('filter-app-'+filter); if(activeBtn) activeBtn.classList.add('active');
  renderAllAppOrders();
}

function renderAllAppOrders() {
  const statsBox = document.getElementById('appStatsBox');
  const table = document.getElementById('allAppOrdersTable');
  if (!statsBox || !table) return;
  const today = new Date().toISOString().split('T')[0];
  const searchQ = (document.getElementById('appOrderSearch')?.value || '').trim().toLowerCase();

  // تعديل: الأوردرات "تم" و"ملغي" تنتقل لتبويبي Done/Cancel ولا تظهر هنا بعد الآن
  let filtered = appOrdersData.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  if (currentAppFilter === 'today') filtered = filtered.filter(o => o.deliveryDate === today);
  else if (currentAppFilter === 'pending') filtered = filtered.filter(o => o.status === 'pending');
  else if (currentAppFilter === 'outdelivery') filtered = filtered.filter(o => o.status === 'outdelivery');

  if (searchQ) {
    filtered = filtered.filter(o =>
      (o.employee && o.employee.toLowerCase().includes(searchQ)) ||
      (o.branch && o.branch.toLowerCase().includes(searchQ)) ||
      (o.customer && o.customer.toLowerCase().includes(searchQ)) ||
      (o.customerCode && o.customerCode.toLowerCase().includes(searchQ)) ||
      (o.appName && o.appName.toLowerCase().includes(searchQ)) ||
      (o.appOrderNumber && o.appOrderNumber.toLowerCase().includes(searchQ))
    );
  }

  const totalOrders = appOrdersData.length;
  const completed = appOrdersData.filter(o => o.status === 'completed').length;
  const pending = appOrdersData.filter(o => o.status === 'pending').length;
  const outdelivery = appOrdersData.filter(o => o.status === 'outdelivery').length;
  const cancelled = appOrdersData.filter(o => o.status === 'cancelled').length;
  const todayOrders = appOrdersData.filter(o => o.deliveryDate === today).length;

  statsBox.innerHTML = `
    <div class="stat-card"><div class="stat-number">${totalOrders}</div><div class="stat-label">إجمالي</div></div>
    <div class="stat-card"><div class="stat-number" style="color:#16a34a;">${completed}</div><div class="stat-label">تم</div></div>
    <div class="stat-card"><div class="stat-number" style="color:#f59e0b;">${pending}</div><div class="stat-label">في الانتظار</div></div>
    <div class="stat-card"><div class="stat-number" style="color:#2563eb;">${outdelivery}</div><div class="stat-label">Out</div></div>
    <div class="stat-card"><div class="stat-number" style="color:#dc2626;">${cancelled}</div><div class="stat-label">ملغي</div></div>
    <div class="stat-card"><div class="stat-number" style="color:#7c3aed;">${todayOrders}</div><div class="stat-label">اليوم</div></div>
  `;

  if (filtered.length === 0) { table.innerHTML = `<tr><td colspan="13" class="empty-state">لا يوجد أوردرات أبلكيشن</td></tr>`; return; }

  table.innerHTML = filtered.map((o, i) => {
    const statusClass = STATUS_CLASSES[o.status] || 'status-pending';
    const statusLabel = STATUS_LABELS[o.status] || o.status;
    const isUrgent = o.deliveryDate === today && o.status !== 'completed' && o.status !== 'cancelled';
    const canEdit = hasPermission('editOrders');
    const canChangeStatus = hasPermission('editStatus');

    let statusCell = `<span class="badge ${statusClass}">${statusLabel}</span>`;
    if (canChangeStatus) {
      statusCell = `<select class="status-select ${statusClass}" onchange="updateAppOrderStatus('${o.id}', this.value)">
        <option value="pending" ${o.status==='pending'?'selected':''}>في الانتظار</option>
        <option value="completed" ${o.status==='completed'?'selected':''}>تم</option>
        <option value="outdelivery" ${o.status==='outdelivery'?'selected':''}>Out</option>
        <option value="cancelled" ${o.status==='cancelled'?'selected':''}>ملغي</option>
      </select>`;
    }
    let actions = `<span class="view-link" onclick="openReviewAppOrder('${o.id}')">👁️ مراجعة</span>`;
    if (canEdit) {
      actions += `<span class="edit-link" onclick="openEditAppOrder('${o.id}')">✏️ تعديل</span>
                 <span class="delete-link" onclick="deleteAppOrder('${o.id}')">🗑️ حذف</span>`;
    }
    return `<tr class="${isUrgent?'urgent-row':''}">
      <td>${i+1}</td>
      <td><strong>${o.customer}</strong>${o.customerCode?`<br><span style="font-size:11px;color:#64748b;">${o.customerCode}</span>`:''}</td>
      <td><span class="badge badge-blue">${o.branch}</span></td>
      <td><span class="badge badge-purple">${o.appName||'-'}</span></td>
      <td><span class="badge badge-pink">#${o.appOrderNumber||'-'}</span></td>
      <td style="max-width:200px;font-size:12px;white-space:pre-line;">${o.items||'-'}</td>
      <td><strong style="color:#16a34a;">${o.total?o.total.toFixed(2):'0'}</strong></td>
      <td><span class="badge badge-orange">${o.supplyType||'مقاصة'}</span></td>
      <td>${statusCell}</td>
      <td><span class="badge ${isUrgent?'badge-red':'badge-cyan'}">${o.deliveryDate||'-'}</span></td>
      <td><span class="badge badge-gray">${o.employee}</span></td>
      <td>${o.date||''}</td>
      <td>${actions}</td>
    </tr>`;
  }).join('');
}

function updateAppOrderStatus(id, newStatus) {
  if (!hasPermission('editStatus')) { showToast('❌ ليس لديك صلاحية تعديل حالة الأوردر', true); return; }
  // تعديل: عند اختيار "ملغي" يفتح مربع نصي لكتابة سبب الإلغاء قبل الحفظ
  if (newStatus === 'cancelled') {
    openQuickCancelReasonModal(id, 'app_orders');
    return;
  }
  const updateData = { status: newStatus, cancelReason: '' };
  db.ref('app_orders/' + id).update(updateData)
    .then(() => showToast('✅ تم تحديث الحالة'))
    .catch(err => { showToast('❌ خطأ في التحديث', true); console.error(err); });
}

// ============================================
// تعديل: تبويب Done - يجمع الأوردرات (العادية + الأبلكيشن) التي حالتها "تم"
// ============================================
let currentDoneSourceFilter = 'all';
function setDoneSourceFilter(filter) {
  currentDoneSourceFilter = filter;
  ['all','normal','app'].forEach(f => {
    const btn = document.getElementById('filter-done-'+f); if(btn) btn.classList.remove('active');
  });
  const activeBtn = document.getElementById('filter-done-'+filter); if(activeBtn) activeBtn.classList.add('active');
  renderDoneOrders();
}

function getCombinedOrdersByStatus(status) {
  const normal = ordersData.filter(o => o.status === status).map(o => ({ ...o, _type: 'normal' }));
  const app = appOrdersData.filter(o => o.status === status).map(o => ({ ...o, _type: 'app' }));
  return [...normal, ...app].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

function renderOrderTypeCell(o) {
  return o._type === 'app' ? `<span class="badge badge-purple">📱 أبلكيشن</span>` : `<span class="badge badge-blue">📊 كول سنتر</span>`;
}

function renderDoneOrders() {
  const statsBox = document.getElementById('doneStatsBox');
  const table = document.getElementById('doneOrdersTable');
  if (!statsBox || !table) return;
  const searchQ = (document.getElementById('doneOrderSearch')?.value || '').trim().toLowerCase();

  let list = getCombinedOrdersByStatus('completed');
  if (currentDoneSourceFilter === 'normal') list = list.filter(o => o._type === 'normal');
  else if (currentDoneSourceFilter === 'app') list = list.filter(o => o._type === 'app');

  if (searchQ) {
    list = list.filter(o =>
      (o.employee && o.employee.toLowerCase().includes(searchQ)) ||
      (o.branch && o.branch.toLowerCase().includes(searchQ)) ||
      (o.customer && o.customer.toLowerCase().includes(searchQ)) ||
      (o.customerCode && o.customerCode.toLowerCase().includes(searchQ)) ||
      (o.appName && o.appName.toLowerCase().includes(searchQ)) ||
      (o.appOrderNumber && o.appOrderNumber.toLowerCase().includes(searchQ))
    );
  }

  const totalNormal = ordersData.filter(o => o.status === 'completed').length;
  const totalApp = appOrdersData.filter(o => o.status === 'completed').length;
  statsBox.innerHTML = `
    <div class="stat-card"><div class="stat-number" style="color:#16a34a;">${totalNormal + totalApp}</div><div class="stat-label">إجمالي تم</div></div>
    <div class="stat-card"><div class="stat-number" style="color:#2563eb;">${totalNormal}</div><div class="stat-label">كول سنتر</div></div>
    <div class="stat-card"><div class="stat-number" style="color:#7c3aed;">${totalApp}</div><div class="stat-label">أبلكيشن</div></div>
  `;

  const doneBulkBar = document.getElementById('doneOrdersBulkBar');
  if (doneBulkBar) doneBulkBar.classList.toggle('hidden', currentUser.role !== 'admin');

  if (list.length === 0) { table.innerHTML = `<tr><td colspan="13" class="empty-state">لا يوجد أوردرات تم تنفيذها</td></tr>`; return; }

  const canEdit = hasPermission('editOrders');
  const canChangeStatus = hasPermission('editStatus');

  table.innerHTML = list.map((o, i) => {
    const fn = o._type === 'app' ? 'updateAppOrderStatus' : 'updateOrderStatus';
    let statusCell = `<span class="badge status-completed">تم</span>`;
    if (canChangeStatus) {
      statusCell = `<select class="status-select status-completed" onchange="${fn}('${o.id}', this.value)">
        <option value="pending">في الانتظار</option>
        <option value="completed" selected>تم</option>
        <option value="outdelivery">Out</option>
        <option value="cancelled">ملغي</option>
      </select>`;
    }
    const reviewFn = o._type === 'app' ? 'openReviewAppOrder' : 'openReviewOrder';
    let actions = `<span class="view-link" onclick="${reviewFn}('${o.id}')">👁️ مراجعة</span>`;
    if (canEdit) {
      const delFn = o._type === 'app' ? 'deleteAppOrder' : 'deleteOrder';
      const archiveFn = o._type === 'app' ? 'archiveAppOrder' : 'archiveOrder';
      actions += `<span class="archive-link" onclick="${archiveFn}('${o.id}')">📦 أرشفة</span>
                 <span class="delete-link" onclick="${delFn}('${o.id}')">🗑️ حذف</span>`;
    }
    return `<tr>
      <td>${i+1}</td>
      <td>${renderOrderTypeCell(o)}</td>
      <td><strong>${o.customer}</strong>${o.customerCode?`<br><span style="font-size:11px;color:#64748b;">${o.customerCode}</span>`:''}</td>
      <td><span class="badge badge-blue">${o.branch}</span></td>
      <td>${o.appName?`<span class="badge badge-purple">${o.appName}</span>`:'-'}</td>
      <td>${o.appOrderNumber?`<span class="badge badge-pink">#${o.appOrderNumber}</span>`:'-'}</td>
      <td style="max-width:200px;font-size:12px;white-space:pre-line;">${o.items||'-'}</td>
      <td><strong style="color:#16a34a;">${o.total?o.total.toFixed(2):'0'}</strong></td>
      <td>${statusCell}</td>
      <td><span class="badge badge-cyan">${o.deliveryDate||'-'}</span></td>
      <td><span class="badge badge-gray">${o.employee}</span></td>
      <td>${o.date||''}</td>
      <td>${actions}</td>
    </tr>`;
  }).join('');
}

// ============================================
// تعديل: تبويب Cancel - يجمع الأوردرات (العادية + الأبلكيشن) التي حالتها "ملغي"
// ============================================
let currentCancelSourceFilter = 'all';
function setCancelSourceFilter(filter) {
  currentCancelSourceFilter = filter;
  ['all','normal','app'].forEach(f => {
    const btn = document.getElementById('filter-cancel-'+f); if(btn) btn.classList.remove('active');
  });
  const activeBtn = document.getElementById('filter-cancel-'+filter); if(activeBtn) activeBtn.classList.add('active');
  renderCancelOrders();
}

function renderCancelOrders() {
  const statsBox = document.getElementById('cancelStatsBox');
  const table = document.getElementById('cancelOrdersTable');
  if (!statsBox || !table) return;
  const searchQ = (document.getElementById('cancelOrderSearch')?.value || '').trim().toLowerCase();

  let list = getCombinedOrdersByStatus('cancelled');
  if (currentCancelSourceFilter === 'normal') list = list.filter(o => o._type === 'normal');
  else if (currentCancelSourceFilter === 'app') list = list.filter(o => o._type === 'app');

  if (searchQ) {
    list = list.filter(o =>
      (o.employee && o.employee.toLowerCase().includes(searchQ)) ||
      (o.branch && o.branch.toLowerCase().includes(searchQ)) ||
      (o.customer && o.customer.toLowerCase().includes(searchQ)) ||
      (o.customerCode && o.customerCode.toLowerCase().includes(searchQ)) ||
      (o.appName && o.appName.toLowerCase().includes(searchQ)) ||
      (o.appOrderNumber && o.appOrderNumber.toLowerCase().includes(searchQ))
    );
  }

  const totalNormal = ordersData.filter(o => o.status === 'cancelled').length;
  const totalApp = appOrdersData.filter(o => o.status === 'cancelled').length;
  statsBox.innerHTML = `
    <div class="stat-card"><div class="stat-number" style="color:#dc2626;">${totalNormal + totalApp}</div><div class="stat-label">إجمالي ملغي</div></div>
    <div class="stat-card"><div class="stat-number" style="color:#2563eb;">${totalNormal}</div><div class="stat-label">كول سنتر</div></div>
    <div class="stat-card"><div class="stat-number" style="color:#7c3aed;">${totalApp}</div><div class="stat-label">أبلكيشن</div></div>
  `;

  const cancelBulkBar = document.getElementById('cancelOrdersBulkBar');
  if (cancelBulkBar) cancelBulkBar.classList.toggle('hidden', currentUser.role !== 'admin');

  if (list.length === 0) { table.innerHTML = `<tr><td colspan="14" class="empty-state">لا يوجد أوردرات ملغية</td></tr>`; return; }

  const canEdit = hasPermission('editOrders');
  const canChangeStatus = hasPermission('editStatus');

  table.innerHTML = list.map((o, i) => {
    const fn = o._type === 'app' ? 'updateAppOrderStatus' : 'updateOrderStatus';
    let statusCell = `<span class="badge status-cancelled">ملغي</span>`;
    if (canChangeStatus) {
      statusCell = `<select class="status-select status-cancelled" onchange="${fn}('${o.id}', this.value)">
        <option value="pending">في الانتظار</option>
        <option value="completed">تم</option>
        <option value="outdelivery">Out</option>
        <option value="cancelled" selected>ملغي</option>
      </select>`;
    }
    const reviewFn = o._type === 'app' ? 'openReviewAppOrder' : 'openReviewOrder';
    let actions = `<span class="view-link" onclick="${reviewFn}('${o.id}')">👁️ مراجعة</span>`;
    if (canEdit) {
      const delFn = o._type === 'app' ? 'deleteAppOrder' : 'deleteOrder';
      const archiveFn = o._type === 'app' ? 'archiveAppOrder' : 'archiveOrder';
      actions += `<span class="archive-link" onclick="${archiveFn}('${o.id}')">📦 أرشفة</span>
                 <span class="delete-link" onclick="${delFn}('${o.id}')">🗑️ حذف</span>`;
    }
    return `<tr>
      <td>${i+1}</td>
      <td>${renderOrderTypeCell(o)}</td>
      <td><strong>${o.customer}</strong>${o.customerCode?`<br><span style="font-size:11px;color:#64748b;">${o.customerCode}</span>`:''}</td>
      <td><span class="badge badge-blue">${o.branch}</span></td>
      <td>${o.appName?`<span class="badge badge-purple">${o.appName}</span>`:'-'}</td>
      <td>${o.appOrderNumber?`<span class="badge badge-pink">#${o.appOrderNumber}</span>`:'-'}</td>
      <td style="max-width:200px;font-size:12px;white-space:pre-line;">${o.items||'-'}</td>
      <td><strong style="color:#16a34a;">${o.total?o.total.toFixed(2):'0'}</strong></td>
      <td>${statusCell}</td>
      <td><span class="badge badge-cyan">${o.deliveryDate||'-'}</span></td>
      <td style="max-width:180px;font-size:12px;color:#991b1b;">${o.cancelReason||'-'}</td>
      <td><span class="badge badge-gray">${o.employee}</span></td>
      <td>${o.date||''}</td>
      <td>${actions}</td>
    </tr>`;
  }).join('');
}

// تعديل: التحكم في مودال سبب الإلغاء السريع (يظهر عند تغيير الحالة إلى "ملغي" من الجدول مباشرة)
let quickCancelContext = null;
function openQuickCancelReasonModal(id, table) {
  quickCancelContext = { id, table };
  document.getElementById('quickCancelReasonText').value = '';
  document.getElementById('quickCancelReasonModal').classList.remove('hidden');
  setTimeout(() => document.getElementById('quickCancelReasonText').focus(), 100);
}
function closeQuickCancelReasonModal(revert) {
  document.getElementById('quickCancelReasonModal').classList.add('hidden');
  if (revert && quickCancelContext) {
    // إعادة رسم الجدول لإرجاع اختيار الحالة كما هو محفوظ فعلياً (لم يتم الحفظ بعد)
    if (quickCancelContext.table === 'orders') renderAllOrders(); else renderAllAppOrders();
    renderDoneOrders(); renderCancelOrders();
  }
  quickCancelContext = null;
}
function confirmQuickCancelReason() {
  const reason = document.getElementById('quickCancelReasonText').value.trim();
  if (!reason) { showToast('❌ اكتب سبب الإلغاء', true); return; }
  if (!quickCancelContext) return;
  const { id, table } = quickCancelContext;
  db.ref(table + '/' + id).update({ status: 'cancelled', cancelReason: reason })
    .then(() => {
      showToast('✅ تم إلغاء الأوردر');
      document.getElementById('quickCancelReasonModal').classList.add('hidden');
      quickCancelContext = null;
    })
    .catch(err => { showToast('❌ خطأ في التحديث', true); console.error(err); });
}

function deleteAppOrder(id) {
  if (currentUser.role !== 'admin') { showToast('❌ هذه الميزة متاحة للأدمن فقط', true); return; }
  if (!confirm('هل أنت متأكد من حذف هذا الأوردر؟')) return;
  db.ref('app_orders/' + id).remove().then(() => showToast('🗑️ تم حذف الأوردر')).catch(err => { showToast('❌ خطأ في الحذف', true); console.error(err); });
}

// ============================================
// Archive Orders
// ============================================
function archiveOrder(id) {
  if (currentUser.role !== 'admin') { showToast('❌ هذه الميزة متاحة للأدمن فقط', true); return; }
  if (!confirm('هل أنت متأكد من أرشفة هذا الأوردر؟')) return;
  const order = ordersData.find(o => o.id === id);
  if (!order) return;
  const archived = { ...order, archivedAt: firebase.database.ServerValue.TIMESTAMP, _sourceTable: 'orders' };
  delete archived.id;
  db.ref('archived_orders').push(archived)
    .then(() => db.ref('orders/' + id).remove())
    .then(() => { showToast('📦 تم أرشفة الأوردر'); renderDoneOrders(); renderCancelOrders(); })
    .catch(err => { showToast('❌ خطأ في الأرشفة', true); console.error(err); });
}

// تعديل: أرشفة أوردرات الأبلكيشن أيضاً (متاحة من تبويبي Done و Cancel)
function archiveAppOrder(id) {
  if (currentUser.role !== 'admin') { showToast('❌ هذه الميزة متاحة للأدمن فقط', true); return; }
  if (!confirm('هل أنت متأكد من أرشفة هذا الأوردر؟')) return;
  const order = appOrdersData.find(o => o.id === id);
  if (!order) return;
  const archived = { ...order, archivedAt: firebase.database.ServerValue.TIMESTAMP, _sourceTable: 'app_orders' };
  delete archived.id;
  db.ref('archived_orders').push(archived)
    .then(() => db.ref('app_orders/' + id).remove())
    .then(() => { showToast('📦 تم أرشفة الأوردر'); renderDoneOrders(); renderCancelOrders(); })
    .catch(err => { showToast('❌ خطأ في الأرشفة', true); console.error(err); });
}

function restoreOrder(id) {
  if (!confirm('هل أنت متأكد من إعادة هذا الأوردر؟')) return;
  const order = archiveData.find(o => o.id === id);
  if (!order) return;
  const restored = { ...order };
  delete restored.id; delete restored.archivedAt;
  const targetTable = restored._sourceTable === 'app_orders' ? 'app_orders' : 'orders';
  delete restored._sourceTable;
  restored.timestamp = firebase.database.ServerValue.TIMESTAMP;
  db.ref(targetTable).push(restored)
    .then(() => db.ref('archived_orders/' + id).remove())
    .then(() => showToast('✅ تم إعادة الأوردر'))
    .catch(err => { showToast('❌ خطأ في الإرجاع', true); console.error(err); });
}

function renderArchive() {
  const statsBox = document.getElementById('archiveStatsBox');
  const table = document.getElementById('archiveTable');
  if (!statsBox || !table) return;
  const searchQ = (document.getElementById('archiveSearch')?.value || '').trim().toLowerCase();
  let filtered = [...archiveData];
  if (searchQ) {
    filtered = filtered.filter(o =>
      (o.employee && o.employee.toLowerCase().includes(searchQ)) ||
      (o.branch && o.branch.toLowerCase().includes(searchQ)) ||
      (o.customer && o.customer.toLowerCase().includes(searchQ)) ||
      (o.customerCode && o.customerCode.toLowerCase().includes(searchQ)) ||
      (o.appOrderNumber && o.appOrderNumber.toLowerCase().includes(searchQ))
    );
  }
  statsBox.innerHTML = `<div class="stat-card"><div class="stat-number" style="color:#7c3aed;">${archiveData.length}</div><div class="stat-label">الأوردرات المؤرشفة</div></div>`;
  if (filtered.length === 0) { table.innerHTML = `<tr><td colspan="10" class="empty-state">لا يوجد أوردرات مؤرشفة</td></tr>`; return; }
  table.innerHTML = filtered.map((o, i) => {
    const statusLabel = STATUS_LABELS[o.status] || o.status;
    const statusClass = STATUS_CLASSES[o.status] || 'status-pending';
    const typeBadge = o._sourceTable === 'app_orders'
      ? `<span class="badge badge-purple">📱 أبلكيشن</span>${o.appOrderNumber?`<br><span class="badge badge-pink" style="margin-top:4px;">#${o.appOrderNumber}</span>`:''}`
      : `<span class="badge badge-blue">📊 كول سنتر</span>`;
    return `<tr>
      <td>${i+1}</td>
      <td>${typeBadge}</td>
      <td><strong>${o.customer}</strong>${o.customerCode?`<br><span style="font-size:11px;color:#64748b;">${o.customerCode}</span>`:''}</td>
      <td><span class="badge badge-blue">${o.branch}</span></td>
      <td style="max-width:200px;font-size:12px;white-space:pre-line;">${o.items||'-'}</td>
      <td><strong style="color:#16a34a;">${o.total?o.total.toFixed(2):'0'}</strong></td>
      <td><span class="badge ${statusClass}">${statusLabel}</span></td>
      <td><span class="badge badge-purple">${o.employee}</span></td>
      <td>${o.date||''}</td>
      <td><span class="restore-link" onclick="restoreOrder('${o.id}')">🔄 إعادة</span>${currentUser.role==='admin'?`<span class="delete-link" onclick="deleteArchive('${o.id}')">🗑️ حذف</span>`:''}</td>
    </tr>`;
  }).join('');
}

function deleteArchive(id) {
  if (currentUser.role !== 'admin') { showToast('❌ هذه الميزة متاحة للأدمن فقط', true); return; }
  if (!confirm('هل أنت متأكد من الحذف النهائي؟')) return;
  db.ref('archived_orders/' + id).remove().then(() => showToast('🗑️ تم الحذف')).catch(err => { showToast('❌ خطأ', true); console.error(err); });
}

// ============================================
// تعديل: أرشفة/حذف أوردرات Done و Cancel بالإجمال (متاح للأدمن فقط)
// ============================================
function bulkArchiveOrdersByStatus(status, successMsg) {
  if (currentUser.role !== 'admin') { showToast('❌ هذه الميزة متاحة للأدمن فقط', true); return; }
  const list = getCombinedOrdersByStatus(status);
  if (list.length === 0) { showToast('❌ لا يوجد أوردرات', true); return; }
  if (!confirm(`هل أنت متأكد من أرشفة كل الأوردرات (${list.length})؟`)) return;
  const updates = {};
  list.forEach(o => {
    const sourceTable = o._type === 'app' ? 'app_orders' : 'orders';
    const archived = { ...o, archivedAt: firebase.database.ServerValue.TIMESTAMP, _sourceTable: sourceTable };
    delete archived.id; delete archived._type;
    const newKey = db.ref('archived_orders').push().key;
    updates['archived_orders/' + newKey] = archived;
    updates[sourceTable + '/' + o.id] = null;
  });
  db.ref().update(updates)
    .then(() => { showToast(successMsg); renderDoneOrders(); renderCancelOrders(); })
    .catch(err => { showToast('❌ خطأ في الأرشفة', true); console.error(err); });
}
function bulkDeleteOrdersByStatus(status, successMsg) {
  if (currentUser.role !== 'admin') { showToast('❌ هذه الميزة متاحة للأدمن فقط', true); return; }
  const list = getCombinedOrdersByStatus(status);
  if (list.length === 0) { showToast('❌ لا يوجد أوردرات', true); return; }
  if (!confirm(`هل أنت متأكد من حذف كل الأوردرات (${list.length}) نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
  const updates = {};
  list.forEach(o => {
    const sourceTable = o._type === 'app' ? 'app_orders' : 'orders';
    updates[sourceTable + '/' + o.id] = null;
  });
  db.ref().update(updates)
    .then(() => { showToast(successMsg); renderDoneOrders(); renderCancelOrders(); })
    .catch(err => { showToast('❌ خطأ في الحذف', true); console.error(err); });
}
function archiveAllDoneOrders() { bulkArchiveOrdersByStatus('completed', '📦 تم أرشفة كل أوردرات Done'); }
function deleteAllDoneOrders() { bulkDeleteOrdersByStatus('completed', '🗑️ تم حذف كل أوردرات Done'); }
function archiveAllCancelOrders() { bulkArchiveOrdersByStatus('cancelled', '📦 تم أرشفة كل أوردرات Cancel'); }
function deleteAllCancelOrders() { bulkDeleteOrdersByStatus('cancelled', '🗑️ تم حذف كل أوردرات Cancel'); }

// ============================================
// Review Order Modal
// ============================================
function openReviewOrder(id) {
  const o = ordersData.find(x => x.id === id); if (!o) return;
  const statusLabel = STATUS_LABELS[o.status] || o.status;
  const statusClass = STATUS_CLASSES[o.status] || 'status-pending';
  let itemsHtml = '';
  if (o.itemsArray && o.itemsArray.length > 0) {
    itemsHtml = `<table class="order-items-table" style="margin:12px 0;"><thead><tr><th>كود</th><th>اسم الصنف</th><th>سعر</th><th>كمية</th><th>إجمالي</th></tr></thead><tbody>${o.itemsArray.map(i => `<tr><td>${i.code}</td><td>${i.name}</td><td>${parseFloat(i.price).toFixed(2)}</td><td>${i.qty}</td><td>${(i.price*i.qty).toFixed(2)}</td></tr>`).join('')}</tbody></table>`;
  } else { itemsHtml = `<div style="white-space:pre-line;background:#f8fafc;padding:12px;border-radius:8px;margin:12px 0;">${o.items||'-'}</div>`; }

  let cancelReasonHtml = '';
  if (o.status === 'cancelled' && o.cancelReason) {
    cancelReasonHtml = `<div class="cancel-reason-display"><strong>❌ سبب الإلغاء:</strong> ${o.cancelReason}</div>`;
  }

  document.getElementById('reviewContent').innerHTML = `
    <div style="margin-bottom:16px;"><div class="grid-2"><div><strong>العميل:</strong> ${o.customer}</div><div><strong>الفرع:</strong> <span class="badge badge-blue">${o.branch}</span></div></div></div>
    <div style="margin-bottom:16px;"><div class="grid-2"><div><strong>الموظف:</strong> <span class="badge badge-purple">${o.employee}</span></div><div><strong>تاريخ التسجيل:</strong> ${o.date||'-'}</div></div></div>
    <div style="margin-bottom:16px;"><div class="grid-2"><div><strong>طريقة التوفير:</strong> <span class="badge badge-orange">${o.supplyType||'مقاصة'}</span></div><div><strong>الحالة:</strong> <span class="badge ${statusClass}">${statusLabel}</span></div></div></div>
    <div style="margin-bottom:16px;"><div class="grid-2"><div><strong>ميعاد الخروج:</strong> <span class="badge badge-cyan">${o.deliveryDate||'-'}</span></div><div><strong>الإجمالي:</strong> <span style="color:#16a34a;font-size:18px;font-weight:700;">${o.total?o.total.toFixed(2):'0'} ج.م</span></div></div></div>
    ${cancelReasonHtml}
    <hr style="border:0;border-top:1px solid #e2e8f0;margin:16px 0;">
    <h4 style="margin:0 0 8px;color:#374151;">📝 الأصناف المطلوبة</h4>${itemsHtml}
    ${o.notes?`<div style="margin-top:16px;"><strong>ملاحظات:</strong><div style="background:#f8fafc;padding:12px;border-radius:8px;margin-top:6px;">${o.notes}</div></div>`:''}
  `;
  document.getElementById('reviewModal').classList.remove('hidden');
}
function closeReviewModal() { document.getElementById('reviewModal').classList.add('hidden'); }

// ============================================
// Edit Order Modal
// ============================================
function openEditOrder(id) {
  if (!hasPermission('editOrders')) { showToast('❌ لا تملك صلاحية تعديل الأوردرات', true); return; }
  const order = ordersData.find(o => o.id === id); if (!order) return;
  document.getElementById('editOrderId').value = id;
  document.getElementById('editCustomerName').value = order.customer || '';
  populateBranchSelect();
  document.getElementById('editBranch').value = order.branch || '';
  document.getElementById('editItems').value = order.items || '';
  const supplyRadio = document.querySelector(`input[name="editSupplyType"][value="${order.supplyType}"]`);
  if (supplyRadio) supplyRadio.checked = true;
  document.getElementById('editDeliveryDate').value = order.deliveryDate || '';
  document.getElementById('editStatus').value = order.status || 'pending';
  document.getElementById('editCancelReason').value = order.cancelReason || '';
  toggleCancelReason();
  document.getElementById('editNotes').value = order.notes || '';
  document.getElementById('editOrderModal').classList.remove('hidden');
}
function closeEditModal() { document.getElementById('editOrderModal').classList.add('hidden'); }

// تعديل: تحسين ظهور سبب الإلغاء
function toggleCancelReason() {
  const status = document.getElementById('editStatus').value;
  const box = document.getElementById('cancelReasonBox');
  if (status === 'cancelled') {
    box.classList.remove('hidden');
    setTimeout(() => document.getElementById('editCancelReason').focus(), 100);
  } else {
    box.classList.add('hidden');
  }
}

function saveEditOrder() {
  if (!hasPermission('editOrders')) { showToast('❌ لا تملك صلاحية تعديل الأوردرات', true); return; }
  const id = document.getElementById('editOrderId').value;
  const customer = document.getElementById('editCustomerName').value.trim();
  const branch = document.getElementById('editBranch').value;
  const items = document.getElementById('editItems').value.trim();
  const supplyType = document.querySelector('input[name="editSupplyType"]:checked')?.value || 'مقاصة';
  const deliveryDate = document.getElementById('editDeliveryDate').value;
  const status = document.getElementById('editStatus').value;
  const cancelReason = document.getElementById('editCancelReason').value.trim();
  const notes = document.getElementById('editNotes').value.trim();

  if (!customer || !branch || !items) { showToast('❌ أكمل جميع الحقول المطلوبة', true); return; }

  // تعديل: التحقق من وجود سبب الإلغاء عند اختيار حالة ملغي
  if (status === 'cancelled' && !cancelReason) {
    showToast('❌ يجب كتابة سبب الإلغاء', true);
    document.getElementById('editCancelReason').focus();
    return;
  }

  const data = { customer, branch, items, supplyType, deliveryDate, status, notes };
  if (status === 'cancelled') data.cancelReason = cancelReason; else data.cancelReason = '';
  db.ref('orders/' + id).update(data)
    .then(() => { showToast('✅ تم حفظ التعديلات'); closeEditModal(); })
    .catch(err => { showToast('❌ خطأ في الحفظ', true); console.error(err); });
}

// ============================================
// Review App Order Modal (يعيد استخدام نافذة المراجعة نفسها)
// ============================================
function openReviewAppOrder(id) {
  const o = appOrdersData.find(x => x.id === id); if (!o) return;
  const statusLabel = STATUS_LABELS[o.status] || o.status;
  const statusClass = STATUS_CLASSES[o.status] || 'status-pending';
  let itemsHtml = '';
  if (o.itemsArray && o.itemsArray.length > 0) {
    itemsHtml = `<table class="order-items-table" style="margin:12px 0;"><thead><tr><th>كود</th><th>اسم الصنف</th><th>سعر</th><th>كمية</th><th>إجمالي</th></tr></thead><tbody>${o.itemsArray.map(i => `<tr><td>${i.code}</td><td>${i.name}</td><td>${parseFloat(i.price).toFixed(2)}</td><td>${i.qty}</td><td>${(i.price*i.qty).toFixed(2)}</td></tr>`).join('')}</tbody></table>`;
  } else { itemsHtml = `<div style="white-space:pre-line;background:#f8fafc;padding:12px;border-radius:8px;margin:12px 0;">${o.items||'-'}</div>`; }

  let cancelReasonHtml = '';
  if (o.status === 'cancelled' && o.cancelReason) {
    cancelReasonHtml = `<div class="cancel-reason-display"><strong>❌ سبب الإلغاء:</strong> ${o.cancelReason}</div>`;
  }

  document.getElementById('reviewContent').innerHTML = `
    <div style="margin-bottom:16px;"><div class="grid-2"><div><strong>العميل:</strong> ${o.customer}</div><div><strong>الفرع:</strong> <span class="badge badge-blue">${o.branch}</span></div></div></div>
    <div style="margin-bottom:16px;"><div class="grid-2"><div><strong>الأبلكيشن:</strong> <span class="badge badge-purple">${o.appName||'-'}</span></div><div><strong>رقم الأوردر:</strong> <span class="badge badge-pink">#${o.appOrderNumber||'-'}</span></div></div></div>
    <div style="margin-bottom:16px;"><div class="grid-2"><div><strong>الموظف:</strong> <span class="badge badge-gray">${o.employee}</span></div><div></div></div></div>
    <div style="margin-bottom:16px;"><div class="grid-2"><div><strong>تاريخ التسجيل:</strong> ${o.date||'-'}</div><div><strong>طريقة التوفير:</strong> <span class="badge badge-orange">${o.supplyType||'مقاصة'}</span></div></div></div>
    <div style="margin-bottom:16px;"><div class="grid-2"><div><strong>الحالة:</strong> <span class="badge ${statusClass}">${statusLabel}</span></div><div><strong>ميعاد الخروج:</strong> <span class="badge badge-cyan">${o.deliveryDate||'-'}</span></div></div></div>
    <div style="margin-bottom:16px;"><strong>الإجمالي:</strong> <span style="color:#16a34a;font-size:18px;font-weight:700;">${o.total?o.total.toFixed(2):'0'} ج.م</span></div>
    ${cancelReasonHtml}
    <hr style="border:0;border-top:1px solid #e2e8f0;margin:16px 0;">
    <h4 style="margin:0 0 8px;color:#374151;">📝 الأصناف المطلوبة</h4>${itemsHtml}
    ${o.notes?`<div style="margin-top:16px;"><strong>ملاحظات:</strong><div style="background:#f8fafc;padding:12px;border-radius:8px;margin-top:6px;">${o.notes}</div></div>`:''}
  `;
  document.getElementById('reviewModal').classList.remove('hidden');
}

// ============================================
// Edit App Order Modal
// ============================================
function openEditAppOrder(id) {
  if (!hasPermission('editOrders')) { showToast('❌ لا تملك صلاحية تعديل الأوردرات', true); return; }
  const order = appOrdersData.find(o => o.id === id); if (!order) return;
  document.getElementById('editAppOrderId').value = id;
  document.getElementById('editAppOrderCustomerName').value = order.customer || '';
  populateAppOrderBranch(); populateAppOrderAppSelect();
  document.getElementById('editAppOrderBranch').value = order.branch || '';
  document.getElementById('editAppOrderApp').value = order.appName || '';
  document.getElementById('editAppOrderNumber').value = order.appOrderNumber || '';
  document.getElementById('editAppOrderItems').value = order.items || '';
  const supplyRadio = document.querySelector(`input[name="editAppOrderSupplyType"][value="${order.supplyType}"]`);
  if (supplyRadio) supplyRadio.checked = true;
  document.getElementById('editAppOrderDeliveryDate').value = order.deliveryDate || '';
  document.getElementById('editAppOrderStatus').value = order.status || 'pending';
  document.getElementById('editAppOrderCancelReason').value = order.cancelReason || '';
  toggleAppCancelReason();
  document.getElementById('editAppOrderNotes').value = order.notes || '';
  document.getElementById('editAppOrderModal').classList.remove('hidden');
}
function closeEditAppOrderModal() { document.getElementById('editAppOrderModal').classList.add('hidden'); }

function toggleAppCancelReason() {
  const status = document.getElementById('editAppOrderStatus').value;
  const box = document.getElementById('appCancelReasonBox');
  if (status === 'cancelled') {
    box.classList.remove('hidden');
    setTimeout(() => document.getElementById('editAppOrderCancelReason').focus(), 100);
  } else {
    box.classList.add('hidden');
  }
}

function saveEditAppOrder() {
  if (!hasPermission('editOrders')) { showToast('❌ لا تملك صلاحية تعديل الأوردرات', true); return; }
  const id = document.getElementById('editAppOrderId').value;
  const customer = document.getElementById('editAppOrderCustomerName').value.trim();
  const branch = document.getElementById('editAppOrderBranch').value;
  const appName = document.getElementById('editAppOrderApp').value;
  const appOrderNumber = document.getElementById('editAppOrderNumber').value.trim();
  const items = document.getElementById('editAppOrderItems').value.trim();
  const supplyType = document.querySelector('input[name="editAppOrderSupplyType"]:checked')?.value || 'مقاصة';
  const deliveryDate = document.getElementById('editAppOrderDeliveryDate').value;
  const status = document.getElementById('editAppOrderStatus').value;
  const cancelReason = document.getElementById('editAppOrderCancelReason').value.trim();
  const notes = document.getElementById('editAppOrderNotes').value.trim();

  if (!customer || !branch || !appName || !appOrderNumber || !items) { showToast('❌ أكمل جميع الحقول المطلوبة', true); return; }

  if (status === 'cancelled' && !cancelReason) {
    showToast('❌ يجب كتابة سبب الإلغاء', true);
    document.getElementById('editAppOrderCancelReason').focus();
    return;
  }

  const data = { customer, branch, appName, appOrderNumber, items, supplyType, deliveryDate, status, notes };
  if (status === 'cancelled') data.cancelReason = cancelReason; else data.cancelReason = '';
  db.ref('app_orders/' + id).update(data)
    .then(() => { showToast('✅ تم حفظ التعديلات'); closeEditAppOrderModal(); })
    .catch(err => { showToast('❌ خطأ في الحفظ', true); console.error(err); });
}

// ============================================
// Quick Product Modal
// ============================================
function openQuickProductModal(prefillCode, context) {
  quickProductContext = context || 'order';
  document.getElementById('quickProductModal').classList.remove('hidden');
  document.getElementById('quickProductCode').value = prefillCode || '';
  document.getElementById('quickProductName').value = '';
  document.getElementById('quickProductPrice').value = '';
  setTimeout(() => document.getElementById('quickProductName').focus(), 100);
}
function closeQuickProductModal() { document.getElementById('quickProductModal').classList.add('hidden'); }
function saveQuickProduct() {
  const code = document.getElementById('quickProductCode').value.trim();
  const name = document.getElementById('quickProductName').value.trim();
  const price = parseFloat(document.getElementById('quickProductPrice').value) || 0;
  if (!code) { showToast('❌ أدخل كود الصنف', true); return; }
  if (!name) { showToast('❌ أدخل اسم الصنف', true); return; }
  db.ref('products').push({ code, name, price })
    .then(() => {
      showToast('✅ تم إضافة الصنف'); closeQuickProductModal();
      const ctx = quickProductContext;
      setTimeout(() => {
        const newProd = productsData.find(p => p.code === code);
        if (newProd) { if (ctx === 'appOrder') addItemToAppOrder(newProd.id); else addItemToOrder(newProd.id); }
      }, 800);
    })
    .catch(err => { showToast('❌ خطأ في الإضافة', true); console.error(err); });
}

// ============================================
// Quick Customer Modal
// ============================================
function openQuickCustomerModal(prefillCode, context) {
  quickCustomerContext = context || 'order';
  document.getElementById('quickCustomerModal').classList.remove('hidden');
  document.getElementById('quickCustomerCode').value = prefillCode || '';
  document.getElementById('quickCustomerName').value = '';
  document.getElementById('quickCustomerPhone').value = '';
  document.getElementById('quickCustomerAddress').value = '';
  setTimeout(() => document.getElementById('quickCustomerName').focus(), 100);
}
function closeQuickCustomerModal() { document.getElementById('quickCustomerModal').classList.add('hidden'); }
function saveQuickCustomer() {
  const code = document.getElementById('quickCustomerCode').value.trim();
  const name = document.getElementById('quickCustomerName').value.trim();
  const phone = document.getElementById('quickCustomerPhone').value.trim();
  const address = document.getElementById('quickCustomerAddress').value.trim();
  if (!code) { showToast('❌ أدخل كود العميل', true); return; }
  if (!name) { showToast('❌ أدخل اسم العميل', true); return; }
  db.ref('customers').push({ code, name, phone, address })
    .then(() => {
      showToast('✅ تم إضافة العميل'); closeQuickCustomerModal();
      const ctx = quickCustomerContext;
      setTimeout(() => {
        const newCust = customersData.find(c => c.code === code);
        if (newCust) { if (ctx === 'appOrder') selectAppOrderCustomer(newCust.id); else selectCustomer(newCust.id); }
      }, 800);
    })
    .catch(err => { showToast('❌ خطأ في الإضافة', true); console.error(err); });
}

// ============================================
// Change Password
// ============================================
function openChangePassModal() {
  document.getElementById('changePassModal').classList.remove('hidden');
  document.getElementById('oldPass').value = '';
  document.getElementById('newPass').value = '';
  document.getElementById('confirmPass').value = '';
}
function closeChangePassModal() { document.getElementById('changePassModal').classList.add('hidden'); }
function saveNewPassword() {
  const oldPass = document.getElementById('oldPass').value.trim();
  const newPass = document.getElementById('newPass').value.trim();
  const confirmPass = document.getElementById('confirmPass').value.trim();
  if (!oldPass || !newPass || !confirmPass) { showToast('❌ أكمل جميع الحقول', true); return; }
  if (oldPass !== currentUser.pass) { showToast('❌ كلمة المرور الحالية غير صحيحة', true); return; }
  if (newPass !== confirmPass) { showToast('❌ كلمة المرور الجديدة غير متطابقة', true); return; }
  if (newPass.length < 3) { showToast('❌ كلمة المرور قصيرة جداً', true); return; }
  db.ref('users/' + currentUser.id).update({ pass: newPass })
    .then(() => { currentUser.pass = newPass; showToast('✅ تم تغيير كلمة المرور'); closeChangePassModal(); })
    .catch(err => { showToast('❌ خطأ في الحفظ', true); console.error(err); });
}

// ============================================
// App Shortages
// ============================================
function searchShortageProducts() {
  const input = document.getElementById('shortageProductSearch');
  const suggestions = document.getElementById('shortageProductSuggestions');
  const query = input.value.trim().toLowerCase();
  shortageProductSelIndex = -1;
  if (!query) { suggestions.classList.add('hidden'); return; }
  const matches = productsData.filter(p => (p.code && p.code.toLowerCase().includes(query)) || (p.name && p.name.toLowerCase().includes(query))).slice(0, 7);
  if (matches.length === 0 && query.length >= 2) {
    suggestions.innerHTML = `<div class="suggestion-add" onclick="openQuickProductModal('${input.value}')">➕ إضافة صنف جديد: "${input.value}"</div>`;
    suggestions.classList.remove('hidden'); return;
  }
  if (matches.length === 0) { suggestions.classList.add('hidden'); return; }
  suggestions.innerHTML = matches.map((p, i) => `
    <div class="suggestion-item" data-index="${i}" data-id="${p.id}" onclick="selectShortageProduct('${p.id}')">
      <div><span class="sug-code">${p.code}</span> - <span class="sug-name">${p.name}</span></div>
    </div>
  `).join('');
  suggestions.classList.remove('hidden');
}
function handleShortageProductKey(e) {
  const items = document.querySelectorAll('#shortageProductSuggestions .suggestion-item');
  if (e.key === 'ArrowDown') { e.preventDefault(); shortageProductSelIndex = Math.min(shortageProductSelIndex + 1, items.length - 1); highlightShortageProductItem(items); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); shortageProductSelIndex = Math.max(shortageProductSelIndex - 1, 0); highlightShortageProductItem(items); }
  else if (e.key === 'Enter') {
    e.preventDefault();
    if (shortageProductSelIndex >= 0 && items[shortageProductSelIndex]) { selectShortageProduct(items[shortageProductSelIndex].dataset.id); }
    else if (document.querySelector('#shortageProductSuggestions .suggestion-add')) { openQuickProductModal(document.getElementById('shortageProductSearch').value); }
  }
  else if (e.key === 'Escape') { document.getElementById('shortageProductSuggestions').classList.add('hidden'); }
}
function highlightShortageProductItem(items) {
  items.forEach((item, i) => item.classList.toggle('active', i === shortageProductSelIndex));
  if (items[shortageProductSelIndex]) items[shortageProductSelIndex].scrollIntoView({ block: 'nearest' });
}
function selectShortageProduct(id) {
  const p = productsData.find(x => x.id === id); if (!p) return;
  if (selectedShortageProducts.some(x => x.id === p.id)) {
    showToast('⚠️ الصنف مضاف بالفعل', true);
    document.getElementById('shortageProductSuggestions').classList.add('hidden');
    return;
  }
  selectedShortageProducts.push(p);
  document.getElementById('shortageProductSearch').value = '';
  document.getElementById('shortageProductSuggestions').classList.add('hidden');
  shortageProductSelIndex = -1;
  renderSelectedShortageProducts();
}
function removeSelectedShortageProduct(id) {
  selectedShortageProducts = selectedShortageProducts.filter(x => x.id !== id);
  renderSelectedShortageProducts();
}
function renderSelectedShortageProducts() {
  const box = document.getElementById('selectedShortageProducts');
  if (!box) return;
  if (!selectedShortageProducts.length) {
    box.innerHTML = '<div class="selected-items-empty">أضف صنفًا واحدًا أو أكثر للنقص</div>';
    return;
  }
  box.innerHTML = selectedShortageProducts.map((p,i) => `
    <div class="selected-shortage-item">
      <div><span class="selected-item-index">${i+1}</span><strong>${p.name}</strong><span class="selected-item-code">${p.code}</span></div>
      <button type="button" class="selected-item-remove" onclick="removeSelectedShortageProduct('${p.id}')" aria-label="حذف الصنف">×</button>
    </div>`).join('');
}
function submitShortage() {
  const products = selectedShortageProducts;
  const appName = document.getElementById('shortageApp').value;
  const branch = document.getElementById('shortageBranch').value;
  const orderNumber = document.getElementById('shortageOrderNumber').value.trim();
  const currentQty = document.getElementById('shortageCurrentQty').value.trim();
  const notes = document.getElementById('shortageNotes').value.trim();
  if (!products.length) { showToast('❌ اختر صنفًا واحدًا على الأقل', true); return; }
  if (!appName) { showToast('❌ اختر الأبلكيشن', true); return; }
  if (!branch) { showToast('❌ اختر الفرع', true); return; }
  const payloads = products.map(product => ({
    productCode: product.code, productName: product.name, appName, branch,
    orderNumber, currentQty, notes,
    employee: currentUser.name, employeeId: currentUser.id,
    date: new Date().toISOString().split('T')[0],
    timestamp: firebase.database.ServerValue.TIMESTAMP
  }));
  Promise.all(payloads.map(data => db.ref('shortages').push(data))).then(() => {
    showToast(`✅ تم تسجيل ${products.length} ${products.length === 1 ? 'نقص' : 'أصناف'}`);
    document.getElementById('shortageProductSearch').value = '';
    document.getElementById('shortageApp').value = '';
    document.getElementById('shortageBranch').value = '';
    document.getElementById('shortageOrderNumber').value = '';
    document.getElementById('shortageCurrentQty').value = '';
    document.getElementById('shortageNotes').value = '';
    selectedShortageProducts = [];
    renderSelectedShortageProducts();
  }).catch(err => { showToast('❌ خطأ في الحفظ', true); console.error(err); });
}

function renderShortages() {
  const tbody = document.getElementById('shortagesTable');
  if (!tbody) return;
  if (shortagesData.length === 0) { tbody.innerHTML = '<tr><td colspan="10" class="empty-state">لا يوجد نواقص مسجلة</td></tr>'; return; }
  tbody.innerHTML = shortagesData.map((s, i) => `<tr>
    <td>${i+1}</td>
    <td><strong>${s.productCode}</strong><br><span style="font-size:12px;color:#64748b;">${s.productName}</span></td>
    <td><span class="badge badge-purple">${s.appName}</span></td>
    <td>${s.orderNumber?`<span class="badge badge-pink">#${s.orderNumber}</span>`:'-'}</td>
    <td><span class="badge badge-blue">${s.branch}</span></td>
    <td>${(s.currentQty!==undefined && s.currentQty!=='')?`<span class="badge badge-orange">${s.currentQty}</span>`:'-'}</td>
    <td><span class="badge badge-gray">${s.employee}</span></td>
    <td>${s.date||''}</td>
    <td>${s.notes||'-'}</td>
    <td>${hasPermission('editShortages')?`<span class="edit-link" onclick="openEditShortage('${s.id}','app')">✏️ تعديل</span>`:''}${currentUser.role==='admin'?`<span class="delete-link" onclick="deleteShortage('${s.id}')">🗑️ حذف</span>`:''}</td>
  </tr>`).join('');
}
function deleteShortage(id) {
  if (currentUser.role !== 'admin') { showToast('❌ هذه الميزة متاحة للأدمن فقط', true); return; }
  if (!confirm('هل أنت متأكد؟')) return;
  db.ref('shortages/' + id).remove().then(() => showToast('🗑️ تم الحذف')).catch(err => { showToast('❌ خطأ', true); console.error(err); });
}
function renderShortagesReport() {
  const tbody = document.getElementById('shortagesReportTable');
  if (!tbody) return;
  const isAdminS = currentUser.role === 'admin';
  document.getElementById('shortagesArchiveAllBtn')?.classList.toggle('hidden', !isAdminS);
  document.getElementById('shortagesDeleteAllBtn')?.classList.toggle('hidden', !isAdminS);
  if (shortagesData.length === 0) { tbody.innerHTML = '<tr><td colspan="11" class="empty-state">لا يوجد نواقص</td></tr>'; return; }
  tbody.innerHTML = shortagesData.map((s, i) => `<tr>
    <td>${i+1}</td><td><strong>${s.productCode}</strong></td><td>${s.productName}</td>
    <td><span class="badge badge-purple">${s.appName}</span></td>
    <td>${s.orderNumber?`<span class="badge badge-pink">#${s.orderNumber}</span>`:'-'}</td>
    <td><span class="badge badge-blue">${s.branch}</span></td>
    <td>${(s.currentQty!==undefined && s.currentQty!=='')?`<span class="badge badge-orange">${s.currentQty}</span>`:'-'}</td>
    <td><span class="badge badge-gray">${s.employee}</span></td>
    <td>${s.date||''}</td><td>${s.notes||'-'}</td>
    <td>${hasPermission('editShortages')?`<span class="edit-link" onclick="openEditShortage('${s.id}','app')">✏️ تعديل</span>`:''}${currentUser.role==='admin'?`<span class="archive-link" onclick="archiveShortage('${s.id}')">📦 أرشفة</span><span class="delete-link" onclick="deleteShortage('${s.id}')">🗑️ حذف</span>`:''}</td>
  </tr>`).join('');
}
function openEditShortage(id, type) {
  if (!hasPermission('editShortages')) { showToast('❌ لا تملك صلاحية تعديل النواقص', true); return; }
  const data = type === 'cc' ? ccShortagesData : shortagesData;
  const item = data.find(x => x.id === id); if (!item) return;
  document.getElementById('editShortageId').value = id;
  document.getElementById('editShortageType').value = type;
  document.getElementById('editShortageTitle').textContent = type === 'cc' ? '✏️ تعديل نقص كول سنتر' : '✏️ تعديل نقص الأبلكيشن';

  const productSel = document.getElementById('editShortageProduct');
  productSel.innerHTML = '<option value="">اختر الصنف</option>' + productsData.map(p => `<option value="${p.id}">${p.code} - ${p.name}</option>`).join('');
  const currentProduct = productsData.find(p => p.code === item.productCode);
  if (currentProduct) productSel.value = currentProduct.id;

  const branchSel = document.getElementById('editShortageBranch');
  const branchList = type === 'cc' ? branchesData : branchesData.filter(b => b.isApp);
  branchSel.innerHTML = '<option value="">اختر الفرع</option>' + branchList.map(b => `<option value="${b.name}">${b.name}</option>`).join('');
  branchSel.value = item.branch || '';

  const appSel = document.getElementById('editShortageApp');
  appSel.innerHTML = '<option value="">اختر الأبلكيشن</option>' + appsData.map(a => `<option value="${a.name}">${a.name}</option>`).join('');
  appSel.value = item.appName || '';

  document.getElementById('editShortageOrderNumber').value = item.orderNumber || '';
  document.getElementById('editShortageCurrentQty').value = item.currentQty ?? '';
  document.getElementById('editShortageCustomerName').value = item.customerName || '';
  document.getElementById('editShortageNotes').value = item.notes || '';

  const isCC = type === 'cc';
  document.getElementById('editShortageAppWrap').classList.toggle('hidden', isCC);
  document.getElementById('editShortageOrderWrap').classList.toggle('hidden', isCC);
  document.getElementById('editShortageQtyWrap').classList.toggle('hidden', isCC);
  document.getElementById('editShortageCustomerWrap').classList.toggle('hidden', !isCC);
  document.getElementById('editShortageModal').classList.remove('hidden');
}

function closeEditShortageModal() {
  document.getElementById('editShortageModal').classList.add('hidden');
}

function saveEditShortage() {
  if (!hasPermission('editShortages')) { showToast('❌ لا تملك صلاحية تعديل النواقص', true); return; }
  const id = document.getElementById('editShortageId').value;
  const type = document.getElementById('editShortageType').value;
  const productId = document.getElementById('editShortageProduct').value;
  const product = productsData.find(p => p.id === productId);
  const branch = document.getElementById('editShortageBranch').value;
  const notes = document.getElementById('editShortageNotes').value.trim();
  if (!product || !branch) { showToast('❌ اختر الصنف والفرع', true); return; }

  let data;
  if (type === 'cc') {
    const customerName = document.getElementById('editShortageCustomerName').value.trim();
    data = { productCode: product.code, productName: product.name, customerName, branch, notes };
  } else {
    const appName = document.getElementById('editShortageApp').value;
    const orderNumber = document.getElementById('editShortageOrderNumber').value.trim();
    const currentQty = document.getElementById('editShortageCurrentQty').value.trim();
    if (!appName) { showToast('❌ اختر الأبلكيشن', true); return; }
    data = { productCode: product.code, productName: product.name, appName, branch, orderNumber, currentQty, notes };
  }

  const path = type === 'cc' ? 'callcenter_shortages/' + id : 'shortages/' + id;
  db.ref(path).update(data)
    .then(() => { showToast('✅ تم حفظ تعديل النقص'); closeEditShortageModal(); })
    .catch(err => { showToast('❌ خطأ في حفظ التعديل', true); console.error(err); });
}

function exportShortagesToExcel() {
  if (shortagesData.length === 0) { showToast('❌ لا يوجد بيانات للتصدير', true); return; }
  const rows = shortagesData.map(s => ({
    'كود الصنف': s.productCode, 'اسم الصنف': s.productName, 'الأبلكيشن': s.appName,
    'رقم الأوردر': s.orderNumber || '', 'الفرع': s.branch, 'الكمية الحالية بالفرع': s.currentQty || '',
    'الموظف': s.employee, 'التاريخ': s.date || '', 'ملاحظات': s.notes || ''
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'نواقص الأبلكيشن');
  XLSX.writeFile(wb, 'نواقص_الأبلكيشن.xlsx');
  showToast('✅ تم تصدير الملف');
}

// تعديل: أرشفة أو حذف نواقص الأبلكيشن (فردي أو الكل دفعة واحدة) - عادة بعد تصدير الإكسل لتفريغ الريبورت
function archiveShortage(id) {
  if (currentUser.role !== 'admin') { showToast('❌ هذه الميزة متاحة للأدمن فقط', true); return; }
  const s = shortagesData.find(x => x.id === id); if (!s) return;
  const archived = { ...s, archivedAt: firebase.database.ServerValue.TIMESTAMP };
  delete archived.id;
  db.ref('archived_shortages').push(archived)
    .then(() => db.ref('shortages/' + id).remove())
    .then(() => showToast('📦 تم أرشفة النقص'))
    .catch(err => { showToast('❌ خطأ في الأرشفة', true); console.error(err); });
}
function archiveAllShortages() {
  if (currentUser.role !== 'admin') { showToast('❌ هذه الميزة متاحة للأدمن فقط', true); return; }
  if (shortagesData.length === 0) { showToast('❌ لا يوجد بيانات', true); return; }
  if (!confirm(`هل أنت متأكد من أرشفة كل النواقص (${shortagesData.length})؟ يُفضّل تصدير الإكسل أولاً.`)) return;
  const updates = {};
  shortagesData.forEach(s => {
    const archived = { ...s, archivedAt: firebase.database.ServerValue.TIMESTAMP };
    delete archived.id;
    const newKey = db.ref('archived_shortages').push().key;
    updates['archived_shortages/' + newKey] = archived;
    updates['shortages/' + s.id] = null;
  });
  db.ref().update(updates)
    .then(() => showToast('📦 تم أرشفة كل النواقص'))
    .catch(err => { showToast('❌ خطأ في الأرشفة', true); console.error(err); });
}
function deleteAllShortages() {
  if (currentUser.role !== 'admin') { showToast('❌ هذه الميزة متاحة للأدمن فقط', true); return; }
  if (shortagesData.length === 0) { showToast('❌ لا يوجد بيانات', true); return; }
  if (!confirm(`هل أنت متأكد من حذف كل النواقص (${shortagesData.length}) نهائياً؟ يُفضّل تصدير الإكسل أولاً. لا يمكن التراجع عن هذا الإجراء.`)) return;
  db.ref('shortages').remove()
    .then(() => showToast('🗑️ تم حذف كل النواقص'))
    .catch(err => { showToast('❌ خطأ في الحذف', true); console.error(err); });
}

// ============================================
// Call Center Shortages
// ============================================
function searchCCProducts() {
  const input = document.getElementById('ccProductSearch');
  const suggestions = document.getElementById('ccProductSuggestions');
  const query = input.value.trim().toLowerCase();
  ccProductSelIndex = -1;
  if (!query) { suggestions.classList.add('hidden'); return; }
  const matches = productsData.filter(p => (p.code && p.code.toLowerCase().includes(query)) || (p.name && p.name.toLowerCase().includes(query))).slice(0, 7);
  if (matches.length === 0 && query.length >= 2) {
    suggestions.innerHTML = `<div class="suggestion-add" onclick="openQuickProductModal('${input.value}')">➕ إضافة صنف جديد: "${input.value}"</div>`;
    suggestions.classList.remove('hidden'); return;
  }
  if (matches.length === 0) { suggestions.classList.add('hidden'); return; }
  suggestions.innerHTML = matches.map((p, i) => `
    <div class="suggestion-item" data-index="${i}" data-id="${p.id}" onclick="selectCCProduct('${p.id}')">
      <div><span class="sug-code">${p.code}</span> - <span class="sug-name">${p.name}</span></div>
    </div>
  `).join('');
  suggestions.classList.remove('hidden');
}
function handleCCProductKey(e) {
  const items = document.querySelectorAll('#ccProductSuggestions .suggestion-item');
  if (e.key === 'ArrowDown') { e.preventDefault(); ccProductSelIndex = Math.min(ccProductSelIndex + 1, items.length - 1); highlightCCProductItem(items); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); ccProductSelIndex = Math.max(ccProductSelIndex - 1, 0); highlightCCProductItem(items); }
  else if (e.key === 'Enter') {
    e.preventDefault();
    if (ccProductSelIndex >= 0 && items[ccProductSelIndex]) { selectCCProduct(items[ccProductSelIndex].dataset.id); }
    else if (document.querySelector('#ccProductSuggestions .suggestion-add')) { openQuickProductModal(document.getElementById('ccProductSearch').value); }
  }
  else if (e.key === 'Escape') { document.getElementById('ccProductSuggestions').classList.add('hidden'); }
}
function highlightCCProductItem(items) {
  items.forEach((item, i) => item.classList.toggle('active', i === ccProductSelIndex));
  if (items[ccProductSelIndex]) items[ccProductSelIndex].scrollIntoView({ block: 'nearest' });
}
function selectCCProduct(id) {
  const p = productsData.find(x => x.id === id); if (!p) return;
  selectedCCProduct = p;
  document.getElementById('ccProductSearch').value = p.name + ' (' + p.code + ')';
  document.getElementById('ccProductSuggestions').classList.add('hidden');
}
function submitCCShortage() {
  const product = selectedCCProduct;
  const customerName = document.getElementById('ccCustomerName').value.trim();
  const branch = document.getElementById('ccBranch').value;
  const notes = document.getElementById('ccNotes').value.trim();
  if (!product) { showToast('❌ اختر الصنف', true); return; }
  if (!branch) { showToast('❌ اختر الفرع', true); return; }
  db.ref('callcenter_shortages').push({
    productCode: product.code, productName: product.name, customerName, branch, notes,
    employee: currentUser.name, employeeId: currentUser.id,
    date: new Date().toISOString().split('T')[0],
    timestamp: firebase.database.ServerValue.TIMESTAMP
  }).then(() => {
    showToast('✅ تم تسجيل النقص');
    document.getElementById('ccProductSearch').value = '';
    document.getElementById('ccCustomerName').value = '';
    document.getElementById('ccBranch').value = '';
    document.getElementById('ccNotes').value = '';
    selectedCCProduct = null;
  }).catch(err => { showToast('❌ خطأ في الحفظ', true); console.error(err); });
}
function renderCCShortages() {
  const tbody = document.getElementById('ccShortagesTable');
  if (!tbody) return;
  if (ccShortagesData.length === 0) { tbody.innerHTML = '<tr><td colspan="8" class="empty-state">لا يوجد نواقص مسجلة</td></tr>'; return; }
  tbody.innerHTML = ccShortagesData.map((s, i) => `<tr>
    <td>${i+1}</td>
    <td><strong>${s.productCode}</strong><br><span style="font-size:12px;color:#64748b;">${s.productName}</span></td>
    <td>${s.customerName||'-'}</td>
    <td><span class="badge badge-blue">${s.branch}</span></td>
    <td><span class="badge badge-gray">${s.employee}</span></td>
    <td>${s.date||''}</td>
    <td>${s.notes||'-'}</td>
    <td>${hasPermission('editShortages')?`<span class="edit-link" onclick="openEditShortage('${s.id}','cc')">✏️ تعديل</span>`:''}</td>
  </tr>`).join('');
}
function renderCCShortagesReport() {
  const tbody = document.getElementById('ccShortagesReportTable');
  if (!tbody) return;
  const isAdminCC = currentUser.role === 'admin';
  document.getElementById('ccShortagesArchiveAllBtn')?.classList.toggle('hidden', !isAdminCC);
  document.getElementById('ccShortagesDeleteAllBtn')?.classList.toggle('hidden', !isAdminCC);
  if (ccShortagesData.length === 0) { tbody.innerHTML = '<tr><td colspan="9" class="empty-state">لا يوجد نواقص</td></tr>'; return; }
  tbody.innerHTML = ccShortagesData.map((s, i) => `<tr>
    <td>${i+1}</td><td><strong>${s.productCode}</strong></td><td>${s.productName}</td>
    <td>${s.customerName||'-'}</td>
    <td><span class="badge badge-blue">${s.branch}</span></td>
    <td><span class="badge badge-gray">${s.employee}</span></td>
    <td>${s.date||''}</td><td>${s.notes||'-'}</td>
    <td>${hasPermission('editShortages')?`<span class="edit-link" onclick="openEditShortage('${s.id}','cc')">✏️ تعديل</span>`:''}${currentUser.role==='admin'?`<span class="archive-link" onclick="archiveCCShortage('${s.id}')">📦 أرشفة</span><span class="delete-link" onclick="deleteCCShortage('${s.id}')">🗑️ حذف</span>`:''}</td>
  </tr>`).join('');
}
function exportCCShortagesToExcel() {
  if (ccShortagesData.length === 0) { showToast('❌ لا يوجد بيانات للتصدير', true); return; }
  const rows = ccShortagesData.map(s => ({
    'كود الصنف': s.productCode, 'اسم الصنف': s.productName, 'العميل': s.customerName || '',
    'الفرع': s.branch, 'الموظف': s.employee, 'التاريخ': s.date || '', 'ملاحظات': s.notes || ''
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'نواقص كول سنتر');
  XLSX.writeFile(wb, 'نواقص_كول_سنتر.xlsx');
  showToast('✅ تم تصدير الملف');
}

// تعديل: أرشفة أو حذف نواقص الكول سنتر (فردي أو الكل دفعة واحدة) - عادة بعد تصدير الإكسل لتفريغ الريبورت
function deleteCCShortage(id) {
  if (currentUser.role !== 'admin') { showToast('❌ هذه الميزة متاحة للأدمن فقط', true); return; }
  if (!confirm('هل أنت متأكد؟')) return;
  db.ref('callcenter_shortages/' + id).remove().then(() => showToast('🗑️ تم الحذف')).catch(err => { showToast('❌ خطأ', true); console.error(err); });
}
function archiveCCShortage(id) {
  if (currentUser.role !== 'admin') { showToast('❌ هذه الميزة متاحة للأدمن فقط', true); return; }
  const s = ccShortagesData.find(x => x.id === id); if (!s) return;
  const archived = { ...s, archivedAt: firebase.database.ServerValue.TIMESTAMP };
  delete archived.id;
  db.ref('archived_cc_shortages').push(archived)
    .then(() => db.ref('callcenter_shortages/' + id).remove())
    .then(() => showToast('📦 تم أرشفة النقص'))
    .catch(err => { showToast('❌ خطأ في الأرشفة', true); console.error(err); });
}
function archiveAllCCShortages() {
  if (currentUser.role !== 'admin') { showToast('❌ هذه الميزة متاحة للأدمن فقط', true); return; }
  if (ccShortagesData.length === 0) { showToast('❌ لا يوجد بيانات', true); return; }
  if (!confirm(`هل أنت متأكد من أرشفة كل النواقص (${ccShortagesData.length})؟ يُفضّل تصدير الإكسل أولاً.`)) return;
  const updates = {};
  ccShortagesData.forEach(s => {
    const archived = { ...s, archivedAt: firebase.database.ServerValue.TIMESTAMP };
    delete archived.id;
    const newKey = db.ref('archived_cc_shortages').push().key;
    updates['archived_cc_shortages/' + newKey] = archived;
    updates['callcenter_shortages/' + s.id] = null;
  });
  db.ref().update(updates)
    .then(() => showToast('📦 تم أرشفة كل النواقص'))
    .catch(err => { showToast('❌ خطأ في الأرشفة', true); console.error(err); });
}
function deleteAllCCShortages() {
  if (currentUser.role !== 'admin') { showToast('❌ هذه الميزة متاحة للأدمن فقط', true); return; }
  if (ccShortagesData.length === 0) { showToast('❌ لا يوجد بيانات', true); return; }
  if (!confirm(`هل أنت متأكد من حذف كل النواقص (${ccShortagesData.length}) نهائياً؟ يُفضّل تصدير الإكسل أولاً. لا يمكن التراجع عن هذا الإجراء.`)) return;
  db.ref('callcenter_shortages').remove()
    .then(() => showToast('🗑️ تم حذف كل النواقص'))
    .catch(err => { showToast('❌ خطأ في الحذف', true); console.error(err); });
}

window.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupDropZone('productDropZone', handleProductFile);
  setupDropZone('customerDropZone', handleCustomerFile);
  setupIdleWatcher();
});
