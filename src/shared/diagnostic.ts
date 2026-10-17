import type { Answer, Lang, Question, ServiceKey, ServiceSummary } from './types.js';

/** A string in both site languages. */
type T = { en: string; ar: string };

interface AnswerDef {
  id: string;
  label: T;
  diagnosis: { headline: T; text: T };
  solution: { title: T; steps: [T, T, T]; outcome: T };
  services: ServiceKey[];
  severity: Answer['severity'];
}

interface QuestionDef {
  id: string;
  area: T;
  text: T;
  answers: AnswerDef[];
}

export const SERVICES: Record<ServiceKey, { name: T; pitch: T }> = {
  strategy: {
    name: { en: 'Strategy & Brand', ar: 'الاستراتيجية والبراند' },
    pitch: {
      en: 'Positioning, identity, messaging and the story that makes you the obvious choice.',
      ar: 'Positioning وهوية ورسالة وقصة تخليك الاختيار الواضح.',
    },
  },
  content: {
    name: { en: 'Content & Creative', ar: 'المحتوى والإبداع' },
    pitch: {
      en: 'Content systems, creative direction, copywriting and production that people stop for.',
      ar: 'Content system وCreative direction وكتابة وإنتاج يخلي الناس توقف عنده.',
    },
  },
  media: {
    name: { en: 'Media & Performance', ar: 'الإعلانات والأداء' },
    pitch: {
      en: 'Meta, Google, TikTok & Snapchat ads planned, optimized and built to convert.',
      ar: 'إعلانات Meta وGoogle وTikTok وSnapchat متخططة ومتظبطة عشان تبيع.',
    },
  },
  tech: {
    name: { en: 'Technology & Development', ar: 'التكنولوجيا والبرمجة' },
    pitch: {
      en: 'Websites, e-commerce, apps, CRMs, API integrations and automation.',
      ar: 'مواقع ومتاجر وتطبيقات وCRM وربط APIs وأتمتة.',
    },
  },
  digital: {
    name: { en: 'Digital Experience', ar: 'التصميم والتجربة الرقمية' },
    pitch: {
      en: 'UI/UX, landing pages, graphic design, motion and video editing.',
      ar: 'UI/UX وLanding pages وجرافيك وموشن ومونتاج.',
    },
  },
  growth: {
    name: { en: 'Growth & Analytics', ar: 'النمو والتحليل' },
    pitch: {
      en: 'Growth systems, analytics, KPI reporting, marketing automation and CRO.',
      ar: 'Growth systems وتحليل بيانات وتقارير KPI وMarketing automation.',
    },
  },
  consulting: {
    name: { en: 'Business Experience Consulting', ar: 'استشارات تجربة البيزنس' },
    pitch: {
      en: 'Customer experience, process optimization and business transformation.',
      ar: 'تجربة العملاء وتحسين العمليات والتحول في البيزنس.',
    },
  },
  print: {
    name: { en: 'Print & Production', ar: 'الطباعة والإنتاج' },
    pitch: {
      en: 'Packaging, POS, booths, merch and print production with quality control.',
      ar: 'تغليف وPOS وبوثات وميرش وطباعة بجودة متراجعة.',
    },
  },
};

const QUESTIONS: QuestionDef[] = [
  {
    id: 'content',
    area: { en: 'Content', ar: 'المحتوى' },
    text: {
      en: 'Your content is out there. What happens next?',
      ar: 'المحتوى بتاعك نازل… وبعدين بيحصل إيه؟',
    },
    answers: [
      {
        id: 'flat-engagement',
        label: { en: 'We post every day. Engagement stays flat.', ar: 'بننزل كل يوم… والتفاعل واقف.' },
        diagnosis: {
          headline: { en: 'Content without a strategy.', ar: 'Content من غير Strategy.' },
          text: {
            en: "Volume isn't a message. Without content pillars and a point of view, the feed scrolls right past you.",
            ar: 'الكتير مش رسالة. من غير Pillars ووجهة نظر واضحة، الناس بتعمل Scroll وتعدّي.',
          },
        },
        solution: {
          title: { en: 'A content system, not a posting schedule.', ar: 'Content system مش جدول بوستات.' },
          steps: [
            { en: "Content pillars built on your audience's real needs and tensions", ar: 'Pillars مبنية على احتياجات جمهورك الحقيقية' },
            { en: 'Creative direction and formats native to each platform', ar: 'Creative direction وفورمات مناسبة لكل منصة' },
            { en: 'A monthly test-and-learn loop on what actually moves people', ar: 'دورة شهرية نجرّب ونتعلم فيها إيه اللي بيحرّك الناس فعلاً' },
          ],
          outcome: { en: 'Content people stop for, save and share.', ar: 'محتوى الناس بتوقف عنده وتحفظه وتشيّره.' },
        },
        services: ['content', 'strategy'],
        severity: 2,
      },
      {
        id: 'looks-generic',
        label: { en: "Our content looks like everyone else's.", ar: 'المحتوى بتاعنا شبه أي حد تاني.' },
        diagnosis: {
          headline: { en: 'Invisible by design.', ar: 'موجود… بس مش باين.' },
          text: {
            en: "If your post could carry a competitor's logo, it isn't building your brand — it's building the category.",
            ar: 'لو البوست بتاعك ينفع يتحط عليه لوجو منافس، يبقى انت مش بتبني البراند بتاعك.',
          },
        },
        solution: {
          title: { en: 'A creative signature only you own.', ar: 'بصمة إبداعية بتاعتك انت بس.' },
          steps: [
            { en: 'Visual and verbal identity system for social', ar: 'هوية بصرية ولغوية مخصوصة للسوشيال' },
            { en: 'Signature formats and recurring series', ar: 'فورمات مميزة وسلاسل متكررة' },
            { en: 'Bold characters and storytelling that make you impossible to ignore', ar: 'كاراكترز جريئة وStorytelling يخليك صعب تتجاهل' },
          ],
          outcome: { en: "Recognized before they even see the logo.", ar: 'يعرفوك قبل ما يشوفوا اللوجو.' },
        },
        services: ['content', 'digital'],
        severity: 2,
      },
      {
        id: 'inconsistent',
        label: { en: "We're inconsistent — some months, nothing.", ar: 'مش منتظمين… شهور بتعدي من غير ولا بوست.' },
        diagnosis: {
          headline: { en: 'No rhythm, no momentum.', ar: 'مفيش إيقاع… يبقى مفيش Momentum.' },
          text: {
            en: 'Every silent month resets the algorithm and your audience’s memory. Momentum needs a steady beat.',
            ar: 'كل شهر سكوت بيرجّع الخوارزمية وذاكرة جمهورك لنقطة الصفر.',
          },
        },
        solution: {
          title: { en: 'An always-on content engine.', ar: 'ماكينة محتوى شغالة على طول.' },
          steps: [
            { en: 'Quarterly content calendar tied to business goals', ar: 'كالندر ربع سنوي مربوط بأهداف البيزنس' },
            { en: 'Batch production: shoot, design and edit ahead', ar: 'إنتاج بالجملة: تصوير وتصميم ومونتاج بدري' },
            { en: 'Dedicated social media management and community care', ar: 'إدارة سوشيال ميديا ورد على الجمهور باستمرار' },
          ],
          outcome: { en: 'A steady presence that compounds month after month.', ar: 'حضور ثابت بيكبر شهر بعد شهر.' },
        },
        services: ['content'],
        severity: 3,
      },
    ],
  },
  {
    id: 'ads',
    area: { en: 'Ads', ar: 'الإعلانات' },
    text: {
      en: 'You put money into ads. What comes back?',
      ar: 'بتصرف على الإعلانات… بيرجعلك إيه؟',
    },
    answers: [
      {
        id: 'clicks-no-sales',
        label: { en: 'Clicks — but no sales.', ar: 'كليكات… بس مفيش مبيعات.' },
        diagnosis: {
          headline: { en: 'A leaking funnel.', ar: 'الـFunnel بيسرّب.' },
          text: {
            en: 'The ad did its job. Something between the click and the checkout is pushing people away.',
            ar: 'الإعلان عمل شغله. فيه حاجة بين الكليك والشراء بتطفّش الناس.',
          },
        },
        solution: {
          title: { en: 'Fix the funnel, then scale it.', ar: 'نصلّح الـFunnel وبعدين نكبّر.' },
          steps: [
            { en: 'Full-funnel audit from ad to checkout', ar: 'مراجعة كاملة من الإعلان لحد الدفع' },
            { en: 'Landing pages designed to convert', ar: 'Landing pages معمولة عشان تحوّل' },
            { en: 'Retargeting sequences for warm audiences', ar: 'Retargeting للناس اللي اهتمت قبل كده' },
          ],
          outcome: { en: 'Every pound you spend works harder.', ar: 'كل جنيه بتصرفه بيشتغل أكتر.' },
        },
        services: ['media', 'digital'],
        severity: 3,
      },
      {
        id: 'costs-rising',
        label: { en: 'Costs keep going up every month.', ar: 'التكلفة بتزيد كل شهر.' },
        diagnosis: {
          headline: { en: 'Creative fatigue and loose targeting.', ar: 'الكريتيف تعب والتارجت واسع.' },
          text: {
            en: 'Audiences have seen the same ads too often, and the budget is spread over people who will never buy.',
            ar: 'الناس شافت نفس الإعلانات كتير، والميزانية رايحة لناس عمرها ما هتشتري.',
          },
        },
        solution: {
          title: { en: 'Performance optimization, every week.', ar: 'Performance optimization كل أسبوع.' },
          steps: [
            { en: 'Fresh creative tests every two weeks', ar: 'كريتيف جديد نجرّبه كل أسبوعين' },
            { en: 'Audience restructuring on Meta, Google, TikTok and Snapchat', ar: 'إعادة بناء الجماهير على Meta وGoogle وTikTok وSnapchat' },
            { en: 'Budget shifted toward winners, continuously', ar: 'الميزانية بتتحرك ناحية اللي بيكسب أول بأول' },
          ],
          outcome: { en: 'Lower cost per result and room to scale.', ar: 'تكلفة أقل لكل نتيجة ومساحة تكبر.' },
        },
        services: ['media'],
        severity: 2,
      },
      {
        id: 'not-sure',
        label: { en: "Honestly? We're not sure what's working.", ar: 'بصراحة؟ مش عارفين إيه اللي شغال.' },
        diagnosis: {
          headline: { en: 'Spending blind.', ar: 'بتصرف وانت مغمّض.' },
          text: {
            en: 'Without tracking you can’t tell a winning campaign from a losing one, so you can’t scale either.',
            ar: 'من غير Tracking مش هتفرق بين الحملة الكسبانة والخسرانة، ومش هتعرف تكبّر أي واحدة.',
          },
        },
        solution: {
          title: { en: 'Measure before you spend more.', ar: 'نقيس قبل ما نصرف أكتر.' },
          steps: [
            { en: 'Pixel, Conversion API and analytics set up properly', ar: 'Pixel وConversion API وAnalytics متظبطين صح' },
            { en: 'Clear KPIs for every stage of the funnel', ar: 'KPIs واضحة لكل مرحلة في الـFunnel' },
            { en: 'A live dashboard you can read in 30 seconds', ar: 'داشبورد لايف تفهمه في 30 ثانية' },
          ],
          outcome: { en: 'Decisions based on data, not hope.', ar: 'قرارات مبنية على أرقام مش على أمل.' },
        },
        services: ['growth', 'media'],
        severity: 3,
      },
    ],
  },
  {
    id: 'brand',
    area: { en: 'Brand', ar: 'البراند' },
    text: {
      en: 'If customers described your brand in one word, what would it be?',
      ar: 'لو عميل وصف البراند بتاعك في كلمة واحدة… هيقول إيه؟',
    },
    answers: [
      {
        id: 'no-word',
        label: { en: "…they'd struggle to find one.", ar: '…غالباً مش هيلاقي كلمة.' },
        diagnosis: {
          headline: { en: 'No clear positioning.', ar: 'مفيش Positioning واضح.' },
          text: {
            en: "If people can't say what you stand for, they can't recommend you — or choose you over the next option.",
            ar: 'لو الناس مش عارفة انت بتمثل إيه، مش هتعرف ترشحك ولا تختارك عن غيرك.',
          },
        },
        solution: {
          title: { en: 'Positioning that owns a place in the mind.', ar: 'Positioning ياخد مكان في دماغ العميل.' },
          steps: [
            { en: 'Market and competitor mapping', ar: 'تحليل السوق والمنافسين' },
            { en: 'One sharp positioning statement', ar: 'جملة Positioning واحدة حادة وواضحة' },
            { en: 'A messaging framework for every touchpoint', ar: 'Messaging framework لكل نقطة تواصل' },
          ],
          outcome: { en: 'A brand people can describe — and recommend.', ar: 'براند الناس تعرف توصفه… وترشحه.' },
        },
        services: ['strategy'],
        severity: 3,
      },
      {
        id: 'cheap',
        label: { en: '“Cheap.”', ar: '“رخيص.”' },
        diagnosis: {
          headline: { en: 'Competing on price alone.', ar: 'بتنافس بالسعر وبس.' },
          text: {
            en: "When price is your only story, every discount from a competitor becomes your problem.",
            ar: 'لما السعر يبقى قصتك الوحيدة، أي خصم من منافس بيبقى مشكلتك انت.',
          },
        },
        solution: {
          title: { en: 'Build value, not discounts.', ar: 'نبني قيمة مش خصومات.' },
          steps: [
            { en: 'A brand story that justifies a better price', ar: 'قصة براند تبرر سعر أعلى' },
            { en: 'A value proposition backed by real proof points', ar: 'Value proposition مدعومة بدلائل حقيقية' },
            { en: 'An identity refresh that signals quality', ar: 'تجديد للهوية يوصّل إحساس الجودة' },
          ],
          outcome: { en: 'Customers who choose you for more than price.', ar: 'عملاء بيختاروك لأسباب أكبر من السعر.' },
        },
        services: ['strategy', 'digital'],
        severity: 2,
      },
      {
        id: 'old',
        label: { en: '“Old-fashioned.”', ar: '“قديم.”' },
        diagnosis: {
          headline: { en: 'A brand that aged out.', ar: 'البراند كبر في السن.' },
          text: {
            en: 'Your product moved on, but your look and voice stayed in the past — and new customers notice first.',
            ar: 'المنتج اتطور، بس الشكل والصوت فضلوا في الماضي… والعملاء الجداد أول ناس بتلاحظ.',
          },
        },
        solution: {
          title: { en: 'Brand evolution, not a restart.', ar: 'تطوير البراند مش البدء من الصفر.' },
          steps: [
            { en: 'An identity refresh that keeps your equity', ar: 'تجديد الهوية مع الحفاظ على رصيدك' },
            { en: 'A modern tone of voice', ar: 'Tone of voice عصري' },
            { en: 'A relaunch campaign that announces the new you', ar: 'حملة Relaunch تعلن عن الشكل الجديد' },
          ],
          outcome: { en: 'Relevant again, without losing who you are.', ar: 'ترجع Relevant من غير ما تخسر نفسك.' },
        },
        services: ['strategy', 'content'],
        severity: 2,
      },
    ],
  },
  {
    id: 'digital',
    area: { en: 'Digital', ar: 'الديجيتال' },
    text: {
      en: 'How is your website or online store doing?',
      ar: 'الموقع أو المتجر الأونلاين بتاعك عامل إيه؟',
    },
    answers: [
      {
        id: 'no-site',
        label: { en: "We don't really have one.", ar: 'معندناش واحد أصلاً.' },
        diagnosis: {
          headline: { en: 'Missing your digital storefront.', ar: 'ناقصك واجهة ديجيتال.' },
          text: {
            en: "Every campaign ends somewhere. Without a home of your own, you're renting attention from platforms.",
            ar: 'كل حملة لازم تودّي لمكان. من غير بيت خاص بيك، انت بتأجر الانتباه من المنصات.',
          },
        },
        solution: {
          title: { en: 'A website built to sell.', ar: 'موقع معمول عشان يبيع.' },
          steps: [
            { en: 'UX mapped to how your customers actually buy', ar: 'UX مبني على طريقة شراء عملائك الحقيقية' },
            { en: 'A fast, mobile-first build or e-commerce store', ar: 'موقع أو متجر سريع ومعمول للموبايل الأول' },
            { en: 'Payments, WhatsApp and CRM wired in', ar: 'ربط الدفع وواتساب والـCRM' },
          ],
          outcome: { en: 'A storefront that works while you sleep.', ar: 'واجهة بتشتغل وانت نايم.' },
        },
        services: ['tech', 'digital'],
        severity: 3,
      },
      {
        id: 'no-convert',
        label: { en: "It exists, but it doesn't convert.", ar: 'موجود… بس مش بيحوّل.' },
        diagnosis: {
          headline: { en: 'A brochure, not a salesperson.', ar: 'بروشور… مش بيّاع.' },
          text: {
            en: 'Visitors arrive, look around and leave. The site informs but never guides them to act.',
            ar: 'الزوار بيدخلوا ويتفرجوا ويمشوا. الموقع بيعرض بس مش بيوجّه لقرار.',
          },
        },
        solution: {
          title: { en: 'A conversion-focused redesign.', ar: 'Redesign مركّز على التحويل.' },
          steps: [
            { en: 'UX audit, heatmaps and drop-off analysis', ar: 'UX audit وHeatmaps وتحليل نقط الخروج' },
            { en: 'Landing pages for every campaign', ar: 'Landing page لكل حملة' },
            { en: 'A/B tests on offers, copy and calls to action', ar: 'A/B tests على العروض والكلام والـCTA' },
          ],
          outcome: { en: 'More of the same traffic turns into customers.', ar: 'نفس الزيارات تتحول لعملاء أكتر.' },
        },
        services: ['digital', 'growth'],
        severity: 2,
      },
      {
        id: 'manual',
        label: { en: 'Our team does everything manually.', ar: 'الفريق بيعمل كل حاجة يدوي.' },
        diagnosis: {
          headline: { en: 'Growth trapped in spreadsheets.', ar: 'النمو محبوس في شيتات Excel.' },
          text: {
            en: 'When every lead and order needs a human to move it, you can only grow as fast as you can type.',
            ar: 'لما كل Lead وأوردر محتاج حد يحرّكه بإيده، نموك بيبقى على قد سرعة الكتابة.',
          },
        },
        solution: {
          title: { en: 'Custom systems and automation.', ar: 'أنظمة مخصوصة وأتمتة.' },
          steps: [
            { en: 'A CRM built around your sales process', ar: 'CRM مبني على طريقة البيع بتاعتك' },
            { en: 'Automated follow-ups and lead routing', ar: 'متابعة وتوزيع Leads أوتوماتيك' },
            { en: 'API integrations between the tools you already use', ar: 'ربط APIs بين الأدوات اللي بتستخدمها' },
          ],
          outcome: { en: 'Your team sells; the system handles the rest.', ar: 'فريقك يبيع… والسيستم يعمل الباقي.' },
        },
        services: ['tech', 'growth', 'consulting'],
        severity: 2,
      },
    ],
  },
  {
    id: 'decisions',
    area: { en: 'Decisions', ar: 'القرارات' },
    text: {
      en: 'How are your marketing decisions made today?',
      ar: 'قرارات التسويق عندك بتتاخد إزاي النهارده؟',
    },
    answers: [
      {
        id: 'gut',
        label: { en: 'Gut feeling, mostly.', ar: 'بالإحساس غالباً.' },
        diagnosis: {
          headline: { en: 'Guessing at scale.', ar: 'تخمين على نطاق واسع.' },
          text: {
            en: 'Instinct starts brands; systems grow them. Without a framework, every month is a new bet.',
            ar: 'الإحساس بيبدأ البراند، بس السيستم هو اللي بيكبّره. من غير Framework كل شهر رهان جديد.',
          },
        },
        solution: {
          title: { en: 'A growth system you can steer.', ar: 'Growth system تقدر تتحكم فيه.' },
          steps: [
            { en: 'A KPI framework tied to revenue', ar: 'KPI framework مربوط بالإيرادات' },
            { en: 'Monthly reporting with clear insights', ar: 'تقارير شهرية فيها Insights واضحة' },
            { en: 'An experiment roadmap: what we test next and why', ar: 'Roadmap للتجارب: هنجرّب إيه بعد كده وليه' },
          ],
          outcome: { en: 'A smarter decision, every single month.', ar: 'قرار أذكى… كل شهر.' },
        },
        services: ['growth', 'strategy'],
        severity: 3,
      },
      {
        id: 'unread-data',
        label: { en: 'We have data. Nobody reads it.', ar: 'عندنا داتا… محدش بيقراها.' },
        diagnosis: {
          headline: { en: 'Data without direction.', ar: 'داتا من غير اتجاه.' },
          text: {
            en: "Numbers that don't lead to an action are just decoration. The insight is missing, not the data.",
            ar: 'الأرقام اللي مش بتوصّل لقرار مجرد ديكور. الناقص هو الـInsight مش الداتا.',
          },
        },
        solution: {
          title: { en: 'Insights you can act on.', ar: 'Insights تقدر تتحرك بيها.' },
          steps: [
            { en: 'A dashboard tailored to the decisions you make', ar: 'داشبورد مفصّل على القرارات اللي بتاخدها' },
            { en: 'A monthly insights session with your team', ar: 'جلسة Insights شهرية مع فريقك' },
            { en: 'Clear next actions — owner, deadline, expected impact', ar: 'خطوات واضحة: مين، إمتى، والأثر المتوقع' },
          ],
          outcome: { en: 'A clearer direction, backed by numbers.', ar: 'اتجاه أوضح… مدعوم بالأرقام.' },
        },
        services: ['growth'],
        severity: 2,
      },
      {
        id: 'lost-leads',
        label: { en: 'Leads come in, then get lost.', ar: 'الـLeads بتيجي… وبعدين بتضيع.' },
        diagnosis: {
          headline: { en: 'A leaky follow-up.', ar: 'المتابعة بتسرّب.' },
          text: {
            en: "You've already paid for those leads. Every one that goes cold is budget thrown away.",
            ar: 'انت دفعت تمن الـLeads دي خلاص. كل واحد بيبرد هو ميزانية بتترمي.',
          },
        },
        solution: {
          title: { en: 'Marketing automation that never forgets.', ar: 'Marketing automation مبتنساش حد.' },
          steps: [
            { en: 'Lead scoring so sales calls the hottest first', ar: 'Lead scoring عشان المبيعات تكلم الأسخن الأول' },
            { en: 'Automated nurturing on email and WhatsApp', ar: 'Nurturing أوتوماتيك على الإيميل والواتساب' },
            { en: 'Full pipeline visibility from first click to deal', ar: 'رؤية كاملة للـPipeline من أول كليك لحد الصفقة' },
          ],
          outcome: { en: 'More deals from the same leads.', ar: 'صفقات أكتر من نفس الـLeads.' },
        },
        services: ['growth', 'tech'],
        severity: 3,
      },
    ],
  },
  {
    id: 'offline',
    area: { en: 'Real world', ar: 'على أرض الواقع' },
    text: {
      en: 'How does your brand show up in the real world — shelf, store, events?',
      ar: 'البراند بتاعك شكله إيه في الواقع… على الرف، في المحل، في الإيفنتات؟',
    },
    answers: [
      {
        id: 'shelf',
        label: { en: "Our packaging doesn't stand out on the shelf.", ar: 'الباكدجنج مش باين على الرف.' },
        diagnosis: {
          headline: { en: 'Lost on the shelf.', ar: 'تايه على الرف.' },
          text: {
            en: 'Shoppers decide in seconds. If the pack doesn’t grab them, the competitor next to you will.',
            ar: 'المشتري بيقرر في ثواني. لو العلبة مشدتهوش، المنافس اللي جنبك هيشده.',
          },
        },
        solution: {
          title: { en: 'Packaging that sells in three seconds.', ar: 'باكدجنج يبيع في 3 ثواني.' },
          steps: [
            { en: 'Shelf audit against your competitors', ar: 'Shelf audit قدام المنافسين' },
            { en: 'Packaging design with bold character', ar: 'تصميم باكدجنج بشخصية جريئة' },
            { en: 'Print production and quality control', ar: 'طباعة وإنتاج مع Quality control' },
          ],
          outcome: { en: 'The pack people reach for first.', ar: 'العلبة اللي الإيد بتروحلها الأول.' },
        },
        services: ['print', 'strategy'],
        severity: 3,
      },
      {
        id: 'split',
        label: { en: 'Online and offline look like two different brands.', ar: 'الأونلاين والأوفلاين شكلهم براندين مختلفين.' },
        diagnosis: {
          headline: { en: 'A split personality.', ar: 'براند بشخصيتين.' },
          text: {
            en: "Every mismatch between your feed and your store chips away at trust and recall.",
            ar: 'كل اختلاف بين الصفحة والمحل بيقلل الثقة وبيضعّف التذكّر.',
          },
        },
        solution: {
          title: { en: 'One brand, every touchpoint.', ar: 'براند واحد في كل مكان.' },
          steps: [
            { en: 'Unified brand guidelines', ar: 'Brand guidelines موحدة' },
            { en: 'Menus, brochures, POS and signage aligned', ar: 'منيوهات وبروشورات وPOS ويافطات متناسقة' },
            { en: 'Booth and exhibition materials that match', ar: 'بوثات ومعارض بنفس الروح' },
          ],
          outcome: { en: 'Recognized the same way, everywhere.', ar: 'يعرفوك بنفس الشكل في كل حتة.' },
        },
        services: ['print', 'strategy', 'consulting'],
        severity: 2,
      },
      {
        id: 'events',
        label: { en: 'Our booths and events get no attention.', ar: 'البوثات والإيفنتات محدش بياخد باله منها.' },
        diagnosis: {
          headline: { en: 'Present, but not noticed.', ar: 'موجود… بس محدش شايفك.' },
          text: {
            en: 'You paid for the space. Without a reason to walk over, people walk past.',
            ar: 'انت دفعت تمن المساحة. من غير سبب يقرّب الناس، هيعدّوا من جنبك.',
          },
        },
        solution: {
          title: { en: 'Experiences people walk toward.', ar: 'تجارب الناس تمشي ناحيتها.' },
          steps: [
            { en: 'Booth and exhibition design built around one big idea', ar: 'تصميم بوث ومعرض حوالين فكرة واحدة قوية' },
            { en: 'Merch and giveaways worth keeping', ar: 'ميرش وهدايا تستاهل تتشال' },
            { en: 'Event content captured and turned into social', ar: 'محتوى الإيفنت يتصور ويتحول لسوشيال' },
          ],
          outcome: { en: 'A crowd at your booth, and content for weeks.', ar: 'زحمة عند البوث ومحتوى لأسابيع.' },
        },
        services: ['print', 'content'],
        severity: 1,
      },
    ],
  },
];

/** Added to every question so visitors whose area is already healthy can say so. */
const HEALTHY: AnswerDef = {
  id: 'healthy',
  label: { en: "Honestly, this part is working well.", ar: 'بصراحة… الجزء ده ماشي كويس.' },
  diagnosis: {
    headline: { en: 'A strength worth amplifying.', ar: 'نقطة قوة تستاهل تتكبّر.' },
    text: {
      en: "Good. Strengths are where the fastest growth hides — most brands under-invest in what already works.",
      ar: 'حلو جداً. أسرع نمو بيبقى مستخبي في نقط القوة… ومعظم البراندات مش بتستثمر فيها كفاية.',
    },
  },
  solution: {
    title: { en: 'Turn a strength into a wave.', ar: 'نحوّل نقطة القوة لـWave.' },
    steps: [
      { en: "Find exactly why it works and document it", ar: 'نعرف بالظبط ليه شغال ونوثّقه' },
      { en: 'Repurpose and scale it across channels', ar: 'نعيد استخدامه ونكبّره على كل القنوات' },
      { en: 'Connect it to the parts of the business that lag', ar: 'نربطه بالأجزاء اللي لسه متأخرة' },
    ],
    outcome: { en: 'More momentum from what you already do well.', ar: 'Momentum أكتر من حاجة انت أصلاً شاطر فيها.' },
  },
  services: [],
  severity: 0,
};

const pick = (t: T, lang: Lang) => t[lang];

function localizeAnswer(a: AnswerDef, lang: Lang, questionId: string): Answer {
  return {
    id: a.id,
    label: pick(a.label, lang),
    diagnosis: { headline: pick(a.diagnosis.headline, lang), text: pick(a.diagnosis.text, lang) },
    solution: {
      title: pick(a.solution.title, lang),
      steps: a.solution.steps.map((s) => pick(s, lang)),
      outcome: pick(a.solution.outcome, lang),
    },
    // A healthy answer still points at the area's lead service.
    services: a.services.length ? a.services : [AREA_SERVICE[questionId]],
    severity: a.severity,
  };
}

const AREA_SERVICE: Record<string, ServiceKey> = {
  content: 'content',
  ads: 'media',
  brand: 'strategy',
  digital: 'tech',
  decisions: 'growth',
  offline: 'print',
};

export function getQuestions(lang: Lang): Question[] {
  return QUESTIONS.map((q) => ({
    id: q.id,
    area: pick(q.area, lang),
    text: pick(q.text, lang),
    answers: [...q.answers, HEALTHY].map((a) => localizeAnswer(a, lang, q.id)),
  }));
}

export function findAnswer(lang: Lang, questionId: string, answerId: string) {
  const q = getQuestions(lang).find((x) => x.id === questionId);
  const a = q?.answers.find((x) => x.id === answerId);
  return q && a ? { question: q, answer: a } : null;
}

export function serviceSummary(key: ServiceKey, lang: Lang): ServiceSummary {
  return { key, name: pick(SERVICES[key].name, lang), pitch: pick(SERVICES[key].pitch, lang) };
}

export const QUESTION_COUNT = QUESTIONS.length;
