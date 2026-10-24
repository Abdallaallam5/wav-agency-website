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
| `batch` | upsert أو remove لحد 50 سجل (leads, clients, projects, tasks, content, invoices, activity, results, adfunds, proposals) |
| `saveUser` / `saveSettings` | الفريق والإعدادات (Admin بس) |
| `changePassword` | تغيير الباسورد |
| `websiteLead` | ليد من الموقع، بيحتاج `key` |
| `portal` / `portalAct` | صفحة العميل: بيحتاجوا `key` بتاع العميل (من غير تسجيل دخول) |

وفيه كمان:
- `GET /api/cron/digest`: الملخص اليومي بالإيميل، Vercel Cron بيناديه كل يوم الساعة 8 الصبح بتوقيت القاهرة.
- `GET/POST /api/meta`: webhook بتاع Meta Lead Ads.

الصلاحيات (Admin / Manager / Member) بتتراجع على السيرفر. الفواتير وفلوس الإعلانات مش بتتبعت أصلًا للـ Member. قفل محاولات الدخول وحد الـ leads متخزنين في MongoDB، فبيشتغلوا صح على Vercel.

## بوابة العميل
من صفحة العميل ← تبويب "لينك العميل" ← "اعمل لينك العميل". اللينك شكله `https://<الـ CRM>/portal.html#k=...`. العميل بيشوف منه البوستات اللي في مرحلة "موافقة" والتسليمات اللي حالتها "اتبعت للعميل"، ويوافق أو يطلب تعديل. ردّه بيوصل إيميل لمدير حساب العميل، وبيظهر في الكالندر والنشاط. لو اللينك اتسرب، دوس "لينك جديد" والقديم هيبطل يشتغل.

## الإيميلات والملخص اليومي
ضيف على Vercel: `SMTP_USER` و`SMTP_PASS` (نفس Gmail App Password بتاع الموقع)، و`CRON_SECRET` (نص عشوائي طويل)، و`CRM_PUBLIC_URL` (لينك الـ CRM). كل واحد في الفريق يقدر يقفل الملخص من خانة "ملخص يومي بالإيميل" في صفحة الفريق.

## Meta Lead Ads
1. من [developers.facebook.com](https://developers.facebook.com) اعمل App (نوع Business) واربطه بصفحة WAV.
2. هات Page Access Token طويل المدى فيه صلاحية `leads_retrieval` و`pages_manage_metadata`.
3. على Vercel ضيف `META_VERIFY_TOKEN` (أي نص عشوائي)، و`META_APP_SECRET` (من App settings ← Basic)، و`META_PAGE_TOKEN`، واختياري `META_LEAD_OWNER` (إيميل اللي هيستلم الليدز). وبعدين أعد النشر.
4. في الـ App ← Webhooks ← Page: الـ Callback URL هو `https://<الـ CRM>/api/meta`، والـ Verify token هو نفس `META_VERIFY_TOKEN`. اشترك في `leadgen`.
5. اشترك الصفحة في الـ App (`POST /{page-id}/subscribed_apps?subscribed_fields=leadgen`)، وجرّب من [Lead Ads Testing Tool](https://developers.facebook.com/tools/lead-ads-testing).
