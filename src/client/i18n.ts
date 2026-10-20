import type { Lang } from '../shared/types';

/**
 * English copy for static sections lives in index.html and is captured on first switch.
 * Arabic copy (and every dynamic UI string, in both languages) lives here.
 */
const AR: Record<string, string> = {
  skip: 'انتقل للمحتوى',
  'nav.story': 'الحكاية',
  'nav.services': 'خدماتنا',
  'nav.pulse': 'افحص البراند',
  'nav.work': 'شغلنا',
  'nav.contact': 'تواصل',
  'nav.cta': 'يلا نعمل Wave',

  'hero.eyebrow': 'وكالة تسويق في مصر',
  'hero.l1': 'تسويق بيحرّك',
  'hero.l2': 'البراند بتاعك.',
  'hero.lead': 'إحنا WAV. سوشيال ميديا ومحتوى وإعلانات ممولة وبراندنج… بنخطط لهم مع بعض عشان الانتباه يتحول لـ<strong>عملاء حقيقيين</strong>.',
  'hero.cta1': 'احجز استشارة مجانية',
  'hero.cta2': 'شوف شغلنا',
  'hero.s1': 'سوشيال ميديا',
  'hero.s2': 'صناعة المحتوى',
  'hero.s3': 'إعلانات ممولة',
  'hero.s4': 'براندنج',
  'hero.s5': 'مواقع',
  'hero.trust': 'براندات وثقت فينا',

  'story.tag': 'الحكاية',
  'story.signal': 'إشارة البراند',
  'story.c1': 'الفصل الأول · الملاحظة',
  'story.c2': 'الفصل التاني · الأعراض',
  'story.c3': 'الفصل التالت · الحقيقة',
  'story.c4': 'الفصل الرابع · البداية',
  'story.next': 'انزل لتحت عشان تكمّل القراية',
  'story.nextSub': 'أو دوس على الكتاب عشان تقلب الصفحة',
  'story.s1': 'مش كل بيزنس واقف، يكون بيعمل حاجة غلط.',
  'story.s2': 'في بيزنس عنده منتج كويس. بيعمل Content. بيشغّل Ads. وبيصرف.',
  'story.s3': 'بس مش <em>بيتحرّك.</em> <span class="page__tag">ACTIVITY ≠ PROGRESS</span>',
  'story.s4': 'ومن هنا بدأت <em>WAV.</em>',

  'approach.tag': 'إطار FORWARD',
  'approach.title': 'من التحليل <br /><em>إلى التأثير.</em>',
  'approach.lead': 'إطار واضح يحرّك البراندات لقدام. مش بنبدأ بالبوستات، بنبدأ بفهم البيزنس واقف فين وبعدين نحرّكه. نفهم. نحدد. نبني. نتحرك.',
  'approach.s1t': 'نفهم',
  'approach.s1': 'نفهم الصورة الكاملة.',
  'approach.s2t': 'نحدد',
  'approach.s2': 'نحدد ما يعيق النمو.',
  'approach.s3t': 'نبني',
  'approach.s3': 'نبني الحل المناسب.',
  'approach.s4t': 'نتحرك',
  'approach.s4': 'ندفع البيزنس للأمام.',

  'pillars.v.tag': 'رؤيتنا · Vision',
  'pillars.v.title': 'نغيّر طريقة التفكير. عشان نغيّر شكل النمو.',
  'pillars.v.text': 'بنساعد البراندات تشوف النمو بشكل مختلف، ونحوّل الأفكار والفرص والتعقيد لاتجاه واضح وMomentum حقيقي.',
  'pillars.m.tag': 'رسالتنا · Mission',
  'pillars.m.title': 'نفهم. نحدد. نبني. نتحرك.',
  'pillars.m.text': 'نفهم أين يقف البيزنس، نحدد ما يعيقه، ثم نبني الحل الذي يدفعه FORWARD.',
  'pillars.w.tag': 'من نحن · Who we are',
  'pillars.w.title': 'WAV مش مجرد Marketing Agency. إحنا شريك نمو.',
  'pillars.w.text': 'بنشتغل مع البيزنس كمنظومة واحدة. مش مجرد خدمات منفصلة. تفكير مختلف. نمو حقيقي.',

  'pulse.tag': 'فحص نبض البراند',
  'pulse.title': 'إيه اللي <br /><em>معطّل البراند</em> بتاعك؟',
  'pulse.lead': 'ست أسئلة بصراحة. اختار الإجابة اللي شبهك، وشوف WAV هتحلها إزاي بالظبط. مش هياخد أكتر من دقيقة.',
  'pulse.signal': 'إشارة البراند بتاعك',
  'pulse.introTitle': 'البراند بتاعك بيتحرك… ولا نشيط وبس؟',
  'pulse.introText': 'من غير إيميل. ومن غير بيع غير لما تطلب.',
  'pulse.start': 'ابدأ الفحص',
  'pulse.how1': 'جاوب على 6 أسئلة سريعة',
  'pulse.how2': 'شوف الحل لكل إجابة',
  'pulse.how3': 'خد تقرير البراند بتاعك',

  'services.tag': 'خدماتنا',
  'services.title': '8 خدمات. <br /><em>نظام واحد.</em>',
  'services.lead': 'مهارات مختلفة. سيستم واحد متوصل معمول عشان يحرّك البراندات لقدام. مش خدمات منفصلة… تأثير واحد متناغم.',
  'services.s1': 'الاستراتيجية والبراند',
  'services.s1d': 'Brand strategy · هوية · Positioning · رسالة وStorytelling',
  'services.s2': 'المحتوى والإبداع',
  'services.s2d': 'Content strategy · إدارة سوشيال ميديا · Creative direction · كتابة · إنتاج',
  'services.s3': 'الإعلانات والأداء',
  'services.s3d': 'إعلانات Meta · Google · TikTok · Snapchat · Media planning · Funnel · Retargeting',
  'services.s4': 'التكنولوجيا والبرمجة',
  'services.s4d': 'مواقع · Web apps · تطبيقات موبايل · E-commerce · أنظمة مخصوصة · CRM · APIs · أتمتة',
  'services.s5': 'التصميم والتجربة الرقمية',
  'services.s5d': 'UI/UX · Landing pages · جرافيك · موشن · مونتاج',
  'services.s6': 'النمو والتحليل',
  'services.s6d': 'Growth systems · تحليل بيانات · تقارير KPI · Marketing automation · CRO',
  'services.s7': 'الطباعة والإنتاج',
  'services.s7d': 'تغليف · بروشورات · منيوهات وكتالوجات · POS · بوثات ومعارض · ميرش · Quality control',
  'services.ctaTitle': 'مهارات مختلفة. موجة واحدة قوية.',
  'services.cta': 'مش عارف تبدأ منين؟ اعمل فحص النبض ←',

  'work.tag': 'من شغلنا',
  'work.title': 'مجالات مختلفة. <br /><em>عقلية إبداعية واحدة.</em>',


  'clients.title': 'براندات اشتغلنا معاها',

  'contact.tag': 'تواصل معانا',
  'contact.title': 'يلا نعمل <em>Wave.</em>',
  'contact.lead': 'يلا نحدد ميتينج. سيب بياناتك وهنتواصل معاك نحدد معاد يناسبك.',
  'contact.based': 'مقرنا',
  'contact.egypt': 'مصر',

  'form.name': 'اسمك',
  'form.company': 'البراند / الشركة',
  'form.contact': 'إيميل أو موبايل / واتساب',
  'form.service': 'محتاج إيه أكتر حاجة؟',
  'form.serviceAny': 'مش متأكد لسه، ساعدني أقرر',
  'form.message': 'اليوم والوقت المناسبين ليك، أو أي حاجة تحب نعرفها (اختياري)',
  'form.submit': 'احجز ميتينج',

  'footer.tag': 'متمشيش ورا الموجة. كون انت الموجة.',
  'footer.top': 'لفوق ↑',
  'story.s4b': 'نفهم. نحدد المشكلة. نبني الحل. ونستخدم الأدوات المناسبة علشان نخلق Movement حقيقي.',
  'services.s8': 'استشارات تجربة البيزنس',
  'services.s8d': 'تجربة العملاء CX · تحسين العمليات · التحول في البيزنس',
  'work.lead': 'كل مجال محتاج طريقة مختلفة، وWAV بتبني الطريقة الصح لكل واحد.',
  'ind.food': 'الأغذية والمشروبات',
  'ind.foodTag': 'بنحوّل الطعم الحلو لقصص أكبر.',
  'ind.fmcg': 'المنتجات الاستهلاكية FMCG',
  'ind.fmcgTag': 'براندات كل يوم. علاقات مش عادية.',
  'ind.automotive': 'السيارات',
  'ind.automotiveTag': 'بنحرّك البراندات لأبعد.',
  'ind.corporate': 'الشركات والخدمات المهنية',
  'ind.corporateTag': 'بنبني سمعة. وبنخلق فرص.',
  'ind.organizations': 'المنظمات والمجتمعات',
  'ind.organizationsTag': 'ناس. هدف. تأثير بيفضل.',
  'ind.also': 'وكمان:',
  'ind.education': 'التعليم والتوعية',
  'ind.educationTag': 'معرفة أكتر. بكرة أحسن.',
  'kpi.title': 'أرقام حقيقية. <br /><em>حركة حقيقية.</em>',
  'kpi.lead': 'دي مش أرقام للعرض. دي نتايج حملة حقيقية لعميل من عملاء WAV من يناير لمارس 2026، مقارنة بالفترة اللي قبل ما نبدأ.',
  'kpi.dashTitle': 'نتايج حملة عميل',
  'kpi.period': 'يناير – مارس 2026',
  'kpi.badge': 'بيانات عميل حقيقية',
  'kpi.source': 'المصدر: التتبع والتقارير بتاعة الحملة نفسها. كل تغيير متقاس مقارنة بالفترة اللي قبل الحملة. اسم العميل مش ظاهر هنا، اطلب مننا دراسة الحالة كاملة.',
  'kpi.leads': 'إجمالي الـLeads',
  'kpi.conv': 'معدل التحويل',
  'kpi.cpl': 'تكلفة الـLead',
  'kpi.quality': 'جودة الـLeads',
  'kpi.vs': 'مقارنة بالفترة اللي قبلها',
  'kpi.overTime': 'الـLeads ومعدل التحويل على مدار الوقت',
  'kpi.campaign': 'أداء الحملة',
  'contact.email': 'الإيميل',
  'contact.phone': 'الموبايل',
  'ind.foodMeta': 'مطاعم · كافيهات',
  'ind.fmcgMeta': 'سناكس · عناية وجمال · منتجات استهلاكية',
  'ind.automotiveMeta': 'معارض · براندات سيارات',
  'ind.corporateMeta': 'مقاولات · خدمات مهنية',
  'ind.organizationsMeta': 'مجتمعات · جهات غير ربحية',
  'ind.educationMeta': 'أكاديميات · تدريب',
  'kpi.legendLeads': 'الـLeads',
  'kpi.sources': 'الـLeads حسب المصدر',
  'kpi.src.organic': 'بحث عضوي',
  'kpi.src.paid': 'بحث مدفوع',
  'kpi.src.referrals': 'إحالات',
  'kpi.src.social': 'سوشيال',
  'kpi.dev.desktop': 'كمبيوتر',
  'kpi.dev.mobile': 'موبايل',
  'kpi.dev.tablet': 'تابلت',
  'kpi.social': 'نمو السوشيال',
  'kpi.socialSub': 'وصول أكبر. مجتمع أقوى.',
  'kpi.s.reach': 'إجمالي الوصول',
  'kpi.s.visits': 'زيارات البروفايل',
  'kpi.s.engage': 'معدل التفاعل',
  'kpi.s.followers': 'نمو المتابعين',
};

/** Strings rendered from JS (pulse check, form states) — both languages. */
const UI: Record<Lang, Record<string, string>> = {
  en: {
    'ui.question': 'Question',
    'ui.seeFix': 'See the fix',
    'ui.pickHint': "Tap the answer that sounds most like you. We'll show you the fix.",
    'ui.youSaid': 'You said',
    'ui.problem': 'The real problem',
    'ui.strength': 'Strength',
    'ui.fix': 'WAV fix',
    'ui.next': 'Next question',
    'ui.seeReport': 'See my brand report',
    'ui.back': 'Pick a different answer',
    'ui.restart': 'Start over',
    'ui.loading': 'Reading your signal…',
    'ui.error': "Couldn't load the pulse check. Refresh and try again.",
    'ui.momentum': 'Momentum',
    'ui.findings': 'What we found',
    'ui.noFindings': 'No major blockers. Time to scale.',
    'ui.plan': 'Your WAV plan: where we would start',
    'ui.sendPlan': 'Send me this plan',
    'ui.planId': 'Plan',
    'ui.planAttached': 'Pulse plan {id} attached · score {score} · {services}',
    'ui.planMessage': 'From my pulse check: {findings}',
    'ui.level': 'Signal',
    'form.sending': 'Sending…',
    'form.ok': "Got it! We'll contact you shortly to set up the meeting.",
    'form.err': 'We could not send that. Please email wavagency.eg@gmail.com or call +20 10 5040 9317.',
    'ui.showMore': 'Show more',
    'ui.showLess': 'Show less',
    'ui.close': 'Close',
    'ui.prev': 'Previous',
    'ui.next2': 'Next',
    'form.invalid': 'Please check the highlighted fields.',
  },
  ar: {
    'ui.question': 'سؤال',
    'ui.seeFix': 'شوف الحل',
    'ui.pickHint': 'دوس على الإجابة اللي شبهك أكتر، وهنوريك الحل.',
    'ui.youSaid': 'انت قلت',
    'ui.problem': 'المشكلة الحقيقية',
    'ui.strength': 'نقطة قوة',
    'ui.fix': 'حل WAV',
    'ui.next': 'السؤال اللي بعده',
    'ui.seeReport': 'شوف تقرير البراند بتاعي',
    'ui.back': 'اختار إجابة تانية',
    'ui.restart': 'ابدأ من الأول',
    'ui.loading': 'بنقرا الإشارة بتاعتك…',
    'ui.error': 'معرفناش نحمّل الفحص. اعمل Refresh وجرب تاني.',
    'ui.momentum': 'Momentum',
    'ui.findings': 'اللي لقيناه',
    'ui.noFindings': 'مفيش معطّلات كبيرة. وقت التكبير.',
    'ui.plan': 'خطة WAV ليك: هنبدأ منين',
    'ui.sendPlan': 'ابعتولي الخطة دي',
    'ui.planId': 'الخطة',
    'ui.planAttached': 'خطة الفحص {id} مرفقة · السكور {score} · {services}',
    'ui.planMessage': 'من فحص النبض: {findings}',
    'ui.level': 'الإشارة',
    'form.sending': 'بنبعت…',
    'form.ok': 'وصلتنا! هنكلمك قريب نحدد الميتينج.',
    'form.err': 'معرفناش نبعت. ابعتلنا على ⁦wavagency.eg@gmail.com⁩ أو كلمنا على ⁦+20 10 5040 9317⁩.',
    'ui.showMore': 'عرض المزيد',
    'ui.showLess': 'عرض أقل',
    'ui.close': 'إغلاق',
    'ui.prev': 'السابق',
    'ui.next2': 'التالي',
    'form.invalid': 'راجع الخانات المعلّمة.',
  },
};

const STORAGE_KEY = 'wav-lang';
let current: Lang = 'en';
const listeners = new Set<(lang: Lang) => void>();

export const getLang = () => current;

export function t(key: string, vars: Record<string, string | number> = {}): string {
  const str = UI[current][key] ?? UI.en[key] ?? key;
  return str.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
}

export function onLangChange(fn: (lang: Lang) => void) {
  listeners.add(fn);
}

function applyStatic(lang: Lang) {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n!;
    el.dataset.en ??= el.textContent ?? '';
    el.textContent = lang === 'ar' ? AR[key] ?? el.dataset.en : el.dataset.en;
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((el) => {
    const key = el.dataset.i18nHtml!;
    el.dataset.enHtml ??= el.innerHTML;
    el.innerHTML = lang === 'ar' ? AR[key] ?? el.dataset.enHtml : el.dataset.enHtml;
  });
}

export function setLang(lang: Lang, { persist = true } = {}) {
  if (lang === current && document.documentElement.lang === lang) return;
  current = lang;
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === 'ar' ? 'rtl' : 'ltr';
  applyStatic(lang);
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* storage unavailable — ignore */
    }
  }
  listeners.forEach((fn) => fn(lang));
}

export function initLang() {
  let initial: Lang = 'en';
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (fromUrl === 'ar' || fromUrl === 'en') initial = fromUrl;
  else {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ar' || saved === 'en') initial = saved;
    } catch {
      /* ignore */
    }
  }
  if (initial === 'ar') setLang('ar', { persist: false });

  document.querySelector('[data-lang-toggle]')?.addEventListener('click', () => {
    setLang(current === 'en' ? 'ar' : 'en');
  });
}
