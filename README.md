# نظام تسجيل الأوردرات

موقع لتسجيل أوردرات العملاء، بتسجيل دخول لكل موظف، وتحديد الوجوه المسموح له بيها، والفرع، واسم اللي كتب الأوردر.

## الملفات
- `index.html` — الموقع بالكامل (تصميم + وظائف + اتصال بقاعدة البيانات)

## خطوات الإعداد

### 1) إعداد قاعدة البيانات (Firebase)
1. ادخل على https://console.firebase.google.com وأنشئ مشروع جديد.
2. من القائمة الجانبية: **Firestore Database** ← **Create database** ← اختر **Start in test mode**.
3. من **Project Settings** (⚙️) ← **General** ← تحت **Your apps** اضغط أيقونة **</>** (Web) وسجّل مشروع.
4. انسخ بيانات `firebaseConfig` (apiKey, projectId, appId... إلخ).
5. افتح ملف `index.html` وابحث عن:
   ```js
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     ...
   };
   ```
   واستبدلها ببياناتك.
6. من **Firestore Database** ← **Rules**، استبدل القواعد بـ:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
   ⚠️ دي قواعد للتجربة السريعة فقط، لازم تتشدد قبل الاستخدام الفعلي (راجع قسم "الأمان" تحت).

7. من Firestore ← **Start collection** باسم `users`، وأضف أول مستخدم يدوي بالحقول:
   - `name` (string): مثلاً "أحمد"
   - `pass` (string): مثلاً "1234"
   - `role` (string): مثلاً "مدير"
   - `faces` (array): مثلاً ["وجه 1", "وجه 2", "وجه 3"]

   ده ضروري عشان تقدر تدخل أول مرة، وبعدها تقدر تضيف باقي المستخدمين من داخل الموقع نفسه (تبويب "المستخدمين").

### 2) الرفع على GitHub Pages
1. أنشئ مستودع (repository) جديد على GitHub.
2. ارفع ملف `index.html` (بعد ما تعدل فيه بيانات Firebase) في المستودع.
3. من **Settings** ← **Pages**:
   - Source: **Deploy from a branch**
   - Branch: `main` (أو اللي عندك) و Folder: `/ (root)`
   - احفظ.
4. هياخد دقيقة أو اتنين، وهيديك لينك زي:
   `https://username.github.io/repo-name/`

## ملاحظات مهمة عن الأمان
- كلمات المرور حالياً بتتخزن كنص عادي (plain text) في قاعدة البيانات — ده مناسب للتجربة بس مش آمن للاستخدام الفعلي مع بيانات حقيقية.
- قواعد Firestore الحالية (`allow read, write: if true`) بتخلي أي حد عنده اللينك يقدر يقرأ ويعدل البيانات مباشرة عن طريق الـ API، مش بس من الموقع.
- لو هتستخدم النظام فعلياً مع عملاء حقيقيين، الأفضل نضيف:
  - تشفير لكلمات المرور، أو
  - نظام تسجيل دخول حقيقي (Firebase Authentication) بدل التحقق اليدوي من الاسم وكلمة المرور.

لو عايز أجهزلك نسخة أأمن (بـ Firebase Authentication بدل النظام الحالي)، قولي وأعملها.
