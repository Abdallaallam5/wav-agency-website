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

  'hero.eyebrow': 'وكالة تسويق · شريك نمو',
  'hero.l1': 'متمشيش',
  'hero.l2': 'ورا الموجة.',
  'hero.l3': 'كون انت الموجة.',
  'hero.lead': 'في عالم مليان حاجات عادية، إحنا بنعمل اللي بيحرّك البراندات. استراتيجية ومحتوى وإعلانات وتكنولوجيا وتحليل… كلهم متوصلين في سيستم واحد معمول للحركة.',
  'hero.cta1': 'افحص نبض البراند بتاعك',
  'hero.cta2': 'شوف شغلنا',
  'hero.hint': 'حرّك الماوس · دوس عشان تعمل موجة',

  'story.tag': 'الحكاية',
  'story.signal': 'إشارة البراند',
  'story.c1': 'الفصل الأول · الملاحظة',
  'story.c2': 'الفصل التاني · الأعراض',
  'story.c3': 'الفصل التالت · الحقيقة',
  'story.c4': 'الفصل الرابع · البداية',
  'story.next': 'اعمل Scroll أو دوس عشان تقلب الصفحة',
  'story.s1': 'الحكاية بدأت من ملاحظة بسيطة… مش كل بيزنس واقف، بيكون بيعمل حاجة غلط.',
  'story.s2': 'بيعمل Content. بيشغّل Ads. وبيصرف. بس مش بيتحرّك.',
  'story.s3': 'لأن النشاط مش معناه تقدّم، والـReach مش دايماً Growth، والـContent لوحده مش Strategy.',
  'story.s4': 'ومن هنا <em>بدأت WAV.</em>',

  'approach.tag': 'إزاي بنتحرك',
  'approach.title': 'كل موجة <br />بتبدأ <em>بتحويلة.</em>',
  'approach.lead': 'مش بنبدأ بالبوستات، بنبدأ بالرؤية. مش كـAgency مهمتها تعمل Posts وحملات، لكن كشريك بيسأل الأول: إيه اللي موقف البيزنس؟ وإيه اللي محتاج يتحرك؟',
  'approach.s1t': 'نفهم',
  'approach.s1': 'البيزنس واقف فين بالظبط: السوق والجمهور والأرقام.',
  'approach.s2t': 'نحدد المشكلة',
  'approach.s2': 'نلاقي اللي معطّله. المشكلة الحقيقية مش الأعلى صوتاً.',
  'approach.s3t': 'نبني الحل',
  'approach.s3': 'قرار أذكى، اتجاه أوضح، رسالة أقوى، أو System يربط كل حاجة ببعض.',
  'approach.s4t': 'نخلق Movement',
  'approach.s4': 'نستخدم الأدوات المناسبة مع بعض لحد ما المؤشر يتحرك فعلاً.',

  'pillars.v.tag': 'رؤيتنا · Vision',
  'pillars.v.title': 'مش بس بنشوف اللي جاي… بنساعد نشكّله.',
  'pillars.v.text': 'نغيّر طريقة تفكير البراندات في النمو، ونبني أنظمة تحوّل الأفكار والفرص إلى حركة حقيقية ومستدامة.',
  'pillars.m.tag': 'رسالتنا · Mission',
  'pillars.m.title': 'نلاقي اللي معطّلك. ونبني اللي يحرّكك لقدام.',
  'pillars.m.text': 'نفهم أين يقف البيزنس، نحدد ما يعيقه، ثم نبني الحل الذي يدفعه FORWARD. تخمين أقل. اتجاه أوضح.',
  'pillars.w.tag': 'من نحن · Who we are',
  'pillars.w.title': 'أكتر من Agency. شريك نموّك.',
  'pillars.w.text': 'WAV مش مجرد Marketing agency. إحنا Growth partner بنشتغل مع البيزنس كمنظومة واحدة. رؤية واحدة. اتجاه واحد. موجة واحدة.',

  'pulse.tag': 'فحص نبض البراند',
  'pulse.title': 'إيه اللي <br /><em>معطّل البراند</em> بتاعك؟',
  'pulse.lead': 'ست أسئلة بصراحة. اختار الإجابة اللي شبهك، وشوف WAV هتحلها إزاي بالظبط. مش هياخد أكتر من دقيقة.',
  'pulse.signal': 'إشارة البراند بتاعك',
  'pulse.introTitle': 'البراند بتاعك بيتحرك… ولا نشيط وبس؟',
  'pulse.introText': 'من غير إيميل. ومن غير بيع غير لما تطلب.',
  'pulse.start': 'ابدأ الفحص',

  'services.tag': 'خدماتنا',
  'services.title': 'اللي بيشغّل <br /><em>الموجة.</em>',
  'services.lead': 'سبع قدرات متوصلة ببعض. سيستم واحد معمول عشان يحرّك البراندات لقدام. مش خدمات منفصلة… تأثير واحد متناغم.',
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
  'work.title': 'أفكار إبداعية. <em>تأثير حقيقي.</em>',
  'work.c1meta': 'حملات إبداعية للسيارات',
  'work.c1title': 'مش بنعرض عربيات. <em>بنصنع رغبة.</em>',
  'work.c1text': 'كأس العالم، الشوروم، إطلاقات كيا، الأهرامات وسيناء: سلسلة حملات بتحط كل عربية جوه قصة تستاهل الناس توقف عندها.',
  'work.c2meta': 'منتجات استهلاكية',
  'work.c2title': 'مش بنبيع منتجات. <em>بنديها شخصية.</em>',
  'work.c2text': 'كاراكترز جريئة. Storytelling مرح. حملات بتخلي براندات السناكس صعب تتجاهل، من الرف لحد شوارع باريس.',

  'ind.tag': 'فين بنعمل تأثير',
  'ind.title': 'مجالات مختلفة. <em>نفس الشغف إننا نعمل Wave.</em>',
  'ind.i1': 'الأغذية والمشروبات',
  'ind.i2': 'السيارات',
  'ind.i3': 'المنتجات الاستهلاكية FMCG',
  'ind.i4': 'المنظمات والمجتمعات',
  'ind.i5': 'الشركات والخدمات المهنية',
  'ind.i6': 'التعليم والتوعية',

  'clients.title': 'العلامات التجارية التي وثقت بنا',

  'contact.tag': 'تواصل معانا',
  'contact.title': 'يلا نعمل <em>Wave.</em>',
  'contact.lead': 'قولنا البراند بتاعك واقف فين. وهنرجعلك باللي معطّله، واللي هيحرّكه لقدام.',
  'contact.web': 'الموقع',
  'contact.based': 'مقرنا',
  'contact.egypt': 'مصر',

  'form.name': 'اسمك',
  'form.company': 'البراند / الشركة',
  'form.contact': 'إيميل أو موبايل / واتساب',
  'form.service': 'محتاج إيه أكتر حاجة؟',
  'form.serviceAny': 'مش متأكد لسه، ساعدني أقرر',
  'form.message': 'البراند بتاعك حاسس إنه واقف فين؟',
  'form.submit': 'ابعت… يلا نعمل Wave',

  'footer.tag': 'متمشيش ورا الموجة. كون انت الموجة.',
  'footer.top': 'لفوق ↑',
};

/** Strings rendered from JS (pulse check, form states) — both languages. */
const UI: Record<Lang, Record<string, string>> = {
  en: {
    'ui.question': 'Question',
    'ui.seeFix': 'See the fix',
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
    'form.ok': "Got it. We'll be in touch within one working day. Let's make waves.",
    'form.err': 'Something went wrong. Please try again.',
    'form.invalid': 'Please check the highlighted fields.',
  },
  ar: {
    'ui.question': 'سؤال',
    'ui.seeFix': 'شوف الحل',
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
    'form.ok': 'وصلتنا. هنكلمك خلال يوم عمل. يلا نعمل Wave.',
    'form.err': 'حصلت مشكلة. جرّب تاني.',
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
