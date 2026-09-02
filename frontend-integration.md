# دمج الـ Inbox الجديد في صفحة Dr. Wells

الملف بتاعك فعلاً معمول فيه `firebase.initializeApp` و `rtdb` جاهزين (سطر 1375-1386)،
يبقى مش محتاج أي إعداد إضافي — بس هتضيف قسم عرض للرسائل بدل (أو جنب) الـ iframe.

## 1) استبدال / إضافة قسم الرسائل (بدل السطور 753–778 تقريبًا)

```html
<section id="messages" class="messages-wrap hidden">
  <div class="card messages-panel">
    <div class="messages-toolbar">
      <div class="messages-toolbar-title">
        <div class="messages-icon">💬</div>
        <div>
          <div>الرسائل</div>
          <p class="messages-note">واتساب — يصل مباشرة عبر Webhook</p>
        </div>
      </div>
      <div class="messages-toolbar-actions">
        <button type="button" class="btn btn-secondary" onclick="toggleMessagesFrame()">🔗 فتح Vendor Console</button>
      </div>
    </div>

    <div class="messages-body" style="display:flex; gap:14px; min-height:520px;">
      <!-- قائمة المحادثات -->
      <div id="inboxContactList" style="width:280px; overflow-y:auto; border-inline-end:1px solid #e2e8f0;"></div>
      <!-- الرسائل بتاعة العميل المختار -->
      <div id="inboxThread" style="flex:1; overflow-y:auto; padding:0 10px;">
        <div style="color:#94a3b8; text-align:center; margin-top:40px;">اختر محادثة من القائمة</div>
      </div>
    </div>

    <!-- الـ iframe القديم لسه موجود، مخفي افتراضيًا، تقدر تفتحه وقت الحاجة -->
    <iframe
      id="messagesFrame"
      class="messages-frame hidden"
      src="https://elmujib.com/vendor-console"
      title="Elmujib Vendor Console"
      loading="lazy"
      allow="clipboard-read; clipboard-write"
      referrerpolicy="strict-origin-when-cross-origin">
    </iframe>
  </div>
</section>
```

## 2) الجافاسكريبت (ضيفه بعد سطر تعريف `rtdb` في نفس الـ `<script>` الموجود)

```javascript
let inboxSelectedPhone = null;

function initWhatsAppInbox() {
  rtdb.ref('whatsapp_inbox_index').on('value', (snap) => {
    const data = snap.val() || {};
    renderInboxContactList(data);
  });
}

function renderInboxContactList(data) {
  const list = document.getElementById('inboxContactList');
  if (!list) return;

  const entries = Object.entries(data).sort(
    (a, b) => (b[1].lastMessageAt || 0) - (a[1].lastMessageAt || 0)
  );

  list.innerHTML = entries.map(([phone, info]) => `
    <div class="inbox-contact-row" style="padding:10px;cursor:pointer;border-bottom:1px solid #f1f5f9;${phone === inboxSelectedPhone ? 'background:#f0f9ff;' : ''}"
         onclick="openInboxThread('${phone}')">
      <div style="font-weight:600;color:#1e293b;">${info.contactName || phone}</div>
      <div style="font-size:12px;color:#64748b;">${phone}</div>
      <div style="font-size:13px;color:#475569;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${info.lastMessage || ''}</div>
    </div>
  `).join('') || '<div style="padding:16px;color:#94a3b8;">لا توجد رسائل بعد</div>';
}

function openInboxThread(phone) {
  inboxSelectedPhone = phone;

  // mark as read
  rtdb.ref('whatsapp_inbox_index/' + phone + '/unread').set(false);

  rtdb.ref('whatsapp_messages/' + phone)
    .orderByChild('receivedAt')
    .on('value', (snap) => {
      const msgs = snap.val() || {};
      const sorted = Object.values(msgs).sort((a, b) => (a.receivedAt || 0) - (b.receivedAt || 0));

      const thread = document.getElementById('inboxThread');
      thread.innerHTML = sorted.map((m) => `
        <div style="margin:8px 0;padding:10px 14px;border-radius:12px;max-width:70%;
                    ${m.direction === 'inbound' ? 'background:#f1f5f9;margin-inline-end:auto;' : 'background:#dcfce7;margin-inline-start:auto;'}">
          <div>${escapeHtml(m.body || '')}</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:4px;">${new Date(m.receivedAt).toLocaleString('ar-EG')}</div>
        </div>
      `).join('');
      thread.scrollTop = thread.scrollHeight;
    });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function toggleMessagesFrame() {
  const frame = document.getElementById('messagesFrame');
  frame.classList.toggle('hidden');
  if (!frame.getAttribute('src')) frame.src = 'https://elmujib.com/vendor-console';
}

// استدعِ initWhatsAppInbox() في نفس المكان اللي بتستدعي فيه باقي init functions
// عند تحميل الصفحة (بعد تسجيل الدخول)، مثلاً جنب استدعاء بيانات الفروع أو العملاء.
```

## 3) الرسائل الصادرة (لو حبيت ترد من نفس الشاشة لاحقًا)

الإرسال بيتم عن طريق El Mujib API مباشرة من الفرونت إند أو من Worker تاني بسيط،
باستخدام endpoint:

```
POST {{apiBaseUrl}}/{{vendorUid}}/contact/send-message
```

ده موجود بالفعل وشغال (الجزء اللي جربناه قبل كده). لو عايز أضيفه للواجهة دي كمان
(input + زرار إرسال يخزن نسخة `direction: outbound` في نفس `whatsapp_messages`)
قولي وأزوّدها.

## 4) قواعد الأمان (Firebase Rules)

الـ Worker بيكتب بصلاحية Admin فبيتجاوز الـ Rules تلقائيًا. لكن لازم تتأكد إن قواعد
القراءة (Read) لمسارات `whatsapp_messages` و `whatsapp_inbox_index` مسموحة
للمستخدمين المسجلين دخول في لوحة التحكم (نفس الطريقة اللي بيقرا بيها باقي أقسام
التطبيق زي `orders` أو `branch_phone_review`).
