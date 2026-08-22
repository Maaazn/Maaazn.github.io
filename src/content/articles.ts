// KashifWeb design reminder: original concise guidance with sources; no mass-produced SEO filler.
export interface Article {
  slug: string;
  title: string;
  summary: string;
  body: string[];
  reviewedAt: string;
  sources: { label: string; href: string }[];
}

export const articles: Article[] = [
  {
    slug: "rtl-document-direction",
    title: "لماذا لا تكفي lang وحدها لصفحة عربية؟",
    summary: "تمييز اللغة والاتجاه في HTML هو نقطة البداية، لكنه لا يغني عن ترتيب منطقي للمحتوى المختلط.",
    reviewedAt: "2026-08-21",
    body: [
      "لغة الوثيقة تخبر المتصفح وتقنيات المساعدة باللغة المتوقعة، أما الاتجاه فيحدد تدفق التخطيط الافتراضي. للصفحة العربية الأساسية يجتمع الاثنان عادةً في html: lang=ar وdir=rtl.",
      "عند إدخال عنوان URL أو بريد أو رقم منتج داخل فقرة عربية، لا تفترض أن ترتيب العلامات سيبقى واضحاً. استخدم bdi أو اتجاهاً محلياً للمقطع الذي يحتاجه، ثم اختبر النتيجة بصرياً وبقارئ شاشة إن أمكن.",
    ],
    sources: [
      { label: "W3C: The dir attribute", href: "https://www.w3.org/International/questions/qa-html-dir.en.html" },
      { label: "W3C: Inline bidi markup", href: "https://www.w3.org/International/articles/inline-bidi-markup/" },
    ],
  },
  {
    slug: "logical-css",
    title: "من left/right إلى خصائص CSS المنطقية",
    summary: "خصائص inline وblock تجعل المكوّن نفسه أكثر مرونة في RTL وLTR من دون نسخ أوراق أنماط كاملة.",
    reviewedAt: "2026-08-21",
    body: [
      "بدلاً من margin-left استخدم margin-inline-start، وبدلاً من text-align: right استخدم text-align: start. المعنى يظل متعلقاً ببداية القراءة لا بجهة ثابتة من الشاشة.",
      "لا يعني ذلك استبدال كل قيمة left/right آلياً؛ بعض التموضع البصري قد يكون مقصوداً. راجع سياق كل قاعدة قبل التعديل، ثم اختبر الاتجاهين إذا كان منتجك ثنائي اللغة.",
    ],
    sources: [
      { label: "MDN: CSS logical properties", href: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values" },
    ],
  },
  {
    slug: "cors-honest-audits",
    title: "لماذا قد يرفض المتصفح فحص رابطك؟",
    summary: "فشل قراءة URL من المتصفح لا يثبت أن الموقع متوقف؛ غالباً يعني أن الاستجابة ليست متاحة للصفحة عبر CORS.",
    reviewedAt: "2026-08-21",
    body: [
      "سياسة الأصل نفسه تمنع صفحة الويب من قراءة محتوى نطاق آخر ما لم يعلن الخادم سماحه بذلك. لهذا يُعتمد تحليل الملف أو لصق المصدر كطريق محلي ثابت في كاشف.",
      "خيار no-cors لا يفتح المحتوى أمام JavaScript؛ يعيد استجابة معتمة لا يمكن تحليلها. الرسالة الصادقة هي شرح الحد، لا تحويله إلى نتيجة فحص ناقصة.",
    ],
    sources: [
      { label: "MDN: Using Fetch", href: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch" },
    ],
  },
  {
    slug: "people-first-web-pages",
    title: "صفحة مفيدة للناس قبل محركات البحث",
    summary: "المحتوى الأصلي والتنقل الواضح والشرح الصريح للمنهجية أهم من درجة أو وعود ترتيب.",
    reviewedAt: "2026-08-21",
    body: [
      "ابدأ من سؤال المستخدم الحقيقي: ماذا يريد أن يفهم أو ينجز؟ ثم وفّر عنواناً واضحاً وبنية عناوين ومصادر يمكن الرجوع إليها. لا تنشئ صفحة فقط لأن عبارة ما تبدو قابلة لجلب الزيارات.",
      "البيانات الوصفية تساعد محركات البحث على فهم الصفحة، لكنها لا تحوّل المحتوى الضعيف إلى محتوى مفيد. كاشف يعرض الأدلة التي يستطيع رؤيتها فقط.",
    ],
    sources: [
      { label: "Google Search: helpful content", href: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content" },
    ],
  },
];
