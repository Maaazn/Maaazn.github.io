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
  {
    slug: "evidence-led-repair-loop",
    title: "من التقرير إلى الإصلاح: دورة مراجعة لا تعتمد على التخمين",
    summary: "اجعل كل تعديل نتيجة دليل محدد، ثم اختبر أثره في الصفحة المنشورة قبل الانتقال إلى الإشارة التالية.",
    reviewedAt: "2026-08-25",
    body: [
      "ابدأ بتقرير واحد ومصدر واحد. اختر الإشارات التي تمنع الفهم أو الوصول أولاً، مثل اتجاه الصفحة واسم الحقول والعناوين الفارغة. لا تجمع عشرات التغييرات في دفعة واحدة؛ عندها لن تعرف أي تعديل حسّن النتيجة أو كسرها.",
      "بعد الإصلاح، أعد فحص المصدر نفسه ثم افتح الصفحة المنشورة على هاتف وسطح مكتب. التقرير المحلي يقيس ما يراه في HTML وCSS المقدمين، لكنه لا يغني عن التأكد من تدفق القراءة والنقر وسلوك المكونات التي تتغير بعد التحميل.",
      "احتفظ بخطة الإصلاح التي ينزلها كاشف مع تاريخ التقرير. هذه الخطة لا تحمل HTML أو CSS المفحوصين، لكنها تحفظ الدليل وخطوة الإصلاح والحدود، فتصلح كنقطة مراجعة للفريق بدلاً من الاعتماد على ذاكرة فردية.",
    ],
    sources: [
      { label: "W3C: Web Content Accessibility Guidelines overview", href: "https://www.w3.org/WAI/standards-guidelines/wcag/" },
      { label: "Google Search: Creating helpful, reliable, people-first content", href: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content" },
    ],
  },
  {
    slug: "mobile-page-review",
    title: "مراجعة الصفحة على الهاتف ليست تصغيراً لمراجعة سطح المكتب",
    summary: "اختبر مساحة النقر والقراءة والتكبير وترتيب التركيز؛ لأن صحة DOM وحدها لا تثبت قابلية الاستخدام على شاشة صغيرة.",
    reviewedAt: "2026-08-25",
    body: [
      "افتح الصفحة على هاتف فعلي أو محاكاة موثوقة، ثم راقب ما إذا كان العنوان يقرأ قبل الصورة، وما إذا كانت أزرار التنقل قابلة للمس من دون تكبير، وما إذا كان النص لا يختفي خلف عناصر ثابتة. هذه أسئلة تجربة استخدام لا يمكن لاختبار selector بسيط حسمها وحده.",
      "لا تمنع تكبير الصفحة لمجرد حماية تخطيط بصري. يحتاج بعض الزائرين إلى التكبير لقراءة النص أو التفاعل مع عناصر دقيقة. إن ظهرت مشكلة تخطيط بعد التكبير، أصلح المكوّن أو المسافة بدلاً من حجب تكبير المتصفح.",
      "افحص أيضاً تغير الاتجاه وظهور لوحة المفاتيح. الحقول التي تبدو سليمة على سطح المكتب قد تنزاح أو تفقد تسميتها أو تتغطى بأزرار ثابتة على الهاتف. سجل هذه الحالات في خطة إصلاح منفصلة عن قواعد المصدر الساكنة.",
    ],
    sources: [
      { label: "MDN: Responsive design", href: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design" },
      { label: "WCAG 2.2: Resize Text", href: "https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html" },
    ],
  },
  {
    slug: "static-audit-boundaries",
    title: "ما الذي لا يستطيع فحص المصدر المحلي إثباته؟",
    summary: "معرفة حدود الأداة تمنع استبدال الاختبار الحقيقي بدرجة أو قائمة قواعد، وتحافظ على معنى التقرير.",
    reviewedAt: "2026-08-25",
    body: [
      "كاشف لا ينفذ JavaScript الذي تكتبه الصفحة المفحوصة، ولا يلتقط الطلبات الشبكية أو سلوك تسجيل الدخول أو الأخطاء التي تظهر بعد تفاعل المستخدم. لذلك قد تكون بنية HTML جيدة بينما يظل التطبيق معطلاً في المتصفح.",
      "كما أن التقرير لا يصدر شهادة وصول أو أمان أو تحسين محركات بحث. القاعدة التي لا تجد مشكلة تعني فقط أن الإشارة المحددة لم تظهر في المصدر المقدم، لا أن كل الحالات المتوقعة سليمة.",
      "استخدم التقرير كبداية: راجع الدليل، أصلح المصدر، شغّل الاختبارات الخاصة بمشروعك، ثم تحقق يدوياً من الصفحة الحية. هذا التسلسل أكثر فائدة من إخفاء الحدود خلف رقم واحد أو وعد خارجي.",
    ],
    sources: [
      { label: "MDN: DOMParser", href: "https://developer.mozilla.org/en-US/docs/Web/API/DOMParser" },
      { label: "MDN: Fetch API and CORS", href: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch" },
    ],
  },
];
