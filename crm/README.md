# WAV CRM

CRM داخلي لـ WAV. الفرونت HTML/CSS/JS عادي، والباك اند Express + MongoDB (Mongoose).

```
crm/
  frontend/   الواجهة (index.html بيتبني من الملفات الباقية)
  src/        Express API (app.js, handlers.js, models.js, auth.js)
  api/        نقطة دخول Vercel
  test/       smoke.mjs (اختبار شامل للـ API)
```

## تشغيل محلي
```bash
npm install
cp .env.example .env     # حط MONGO_URI و ADMIN_EMAIL
npm start                # http://localhost:4000
```
أول مرة السيرفر بيعمل الأدمن من `ADMIN_EMAIL` ويطبع باسورد مؤقت في التيرمنال (أو استخدم `ADMIN_PASSWORD`)، ويطبع **Website key**. غيّر الباسورد من الإعدادات.

الاختبار (والسيرفر شغال):
```bash
CRM_EMAIL=... CRM_PASSWORD=... CRM_WEBSITE_KEY=... npm test
```

## النشر على Vercel
1. ارفع فولدر `crm` (أو الريبو كله) على GitHub. لو الـ CRM جوه ريبو الموقع، ابقى اختار **Root Directory = `crm`** وانت بتعمل المشروع في Vercel.
2. **Add New → Project** واستورد الريبو. مفيش Build Command ولا Framework، سيبهم زي ما هم.
3. في **Settings → Environment Variables** ضيف:

| الاسم | القيمة |
|---|---|
| `MONGO_URI` | رابط Atlas |
| `MONGO_DB` | `wav-crm` (اختياري) |
| `ADMIN_EMAIL` / `ADMIN_NAME` | الأدمن الأول |
| `ADMIN_PASSWORD` | باسورد الأدمن الأول (8 حروف على الأقل). **مطلوب على Vercel** عشان مفيش لوج تشوف فيه الباسورد المؤقت |
| `JWT_SECRET` | نص عشوائي طويل (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `WEBSITE_KEY` | نص عشوائي طويل، هو نفسه `CRM_WEBSITE_KEY` في مشروع الموقع |

4. في **Atlas → Network Access** اسمح بـ `0.0.0.0/0` (عناوين Vercel بتتغير). الحماية هتبقى باسورد الـ URI، فخليه طويل وعشوائي.
5. **Deploy**، وبعدها افتح اللينك وادخل بـ `ADMIN_EMAIL` و`ADMIN_PASSWORD` وغيّر الباسورد.
6. في مشروع **الموقع** على Vercel ضيف `CRM_URL` (لينك الـ CRM من غير `/api`) و`CRM_WEBSITE_KEY`، وأعد النشر.

> الخطة المجانية (Hobby) في Vercel للاستخدام الشخصي وغير التجاري حسب شروطهم. الـ CRM لوكالة، فراجع الشروط الحالية.

## تعديل الفرونت
عدّل الملفات في `frontend/` وبعدين:
```bash
cd frontend && node build.mjs
```
وارفع `index.html` الجديد (Vercel مش بيشغّل build للفرونت).

## الـ API
نقطة واحدة: `POST /api` بجسم JSON `{ action, token, ... }`، والردود دايماً HTTP 200 بشكل `{ ok, error?, code? }`.

| action | بيعمل إيه |
|---|---|
| `login` | دخول بالإيميل والباسورد، بيرجع token والداتا |
| `bootstrap` / `changes` | تحميل الداتا / التغييرات من بعد `since` |
| `batch` | upsert أو remove لحد 50 سجل (leads, clients, projects, tasks, content, invoices, activity) |
| `saveUser` / `saveSettings` | الفريق والإعدادات (Admin بس) |
| `changePassword` | تغيير الباسورد |
| `websiteLead` | ليد من الموقع، بيحتاج `key` |

الصلاحيات (Admin / Manager / Member) بتتراجع على السيرفر. قفل محاولات الدخول وحد الـ leads متخزنين في MongoDB، فبيشتغلوا صح على Vercel.
