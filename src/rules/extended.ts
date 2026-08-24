import type { FindingCategory } from "../audit/types";
import { makeFinding, normalizedText, type AuditRule, type RuleContext } from "./types";

type Signal = {
  id: string;
  category: FindingCategory;
  severity: "error" | "warning" | "info";
  title: string;
  rationale: string;
  recommendation: string;
  reference: string;
  inspect: (context: RuleContext) => string | null;
};

function rule(signal: Signal): AuditRule {
  return {
    id: signal.id,
    category: signal.category,
    evaluate: (context) => {
      const evidence = signal.inspect(context);
      return evidence ? makeFinding(signal.id, signal.category, signal.severity, signal.title, signal.rationale, evidence, signal.recommendation, signal.reference) : null;
    },
  };
}

function sample(nodes: Element[], selector: string): string | null {
  if (!nodes.length) return null;
  return `وجدنا ${nodes.length} عنصر${nodes.length === 1 ? "اً" : "اً"} يطابق ${selector} (حتى أول خمسة عناصر).`;
}

function textLength(document: Document, selector: string): number {
  return normalizedText(document.querySelector(selector)).length;
}

const signals: Signal[] = [
  {
    id: "seo.title-short", category: "seo", severity: "info", title: "عنوان الصفحة قصير جداً", rationale: "العنوان القصير قد لا يشرح موضوع الصفحة للقارئ أو عند المشاركة.", recommendation: "اكتب عنواناً موجزاً لكنه يصف موضوع الصفحة الفعلي بوضوح.", reference: "Google Search Central: title links", inspect: ({ document }) => {
      const size = textLength(document, "title"); return size > 0 && size < 15 ? `طول title الحالي ${size} حرفاً.` : null;
    },
  },
  {
    id: "seo.charset-multiple", category: "seo", severity: "warning", title: "تعريفات charset متعددة", rationale: "تعدد تعريفات الترميز قد يترك تفسير النص غير واضح إذا اختلفت القيم أو ترتيبها.", recommendation: "اترك تعريف charset واحداً ومبكراً داخل head، وتأكد أنه يطابق ترميز الملف المنشور.", reference: "HTML: meta charset", inspect: ({ document }) => {
      const nodes = [...document.querySelectorAll("meta[charset]")]; return nodes.length > 1 ? `وجدنا ${nodes.length} من تعريفات meta[charset].` : null;
    },
  },
  {
    id: "seo.title-long", category: "seo", severity: "info", title: "عنوان الصفحة طويل جداً", rationale: "العناوين الطويلة قد تصبح صعبة القراءة أو تتغير طريقة عرضها في واجهات مختلفة.", recommendation: "راجع العنوان واجعله محدداً وخالياً من التكرار غير المفيد.", reference: "Google Search Central: title links", inspect: ({ document }) => {
      const size = textLength(document, "title"); return size > 70 ? `طول title الحالي ${size} حرفاً.` : null;
    },
  },
  {
    id: "seo.description-short", category: "seo", severity: "info", title: "الوصف التعريفي قصير جداً", rationale: "الوصف المختصر قد لا يساعد القارئ على تمييز موضوع الصفحة قبل فتحها.", recommendation: "اكتب وصفاً صادقاً ومباشراً للصفحة بدلاً من كلمات عامة أو مكررة.", reference: "Google Search Central: snippets", inspect: ({ document }) => {
      const size = textLength(document, 'meta[name="description" i]'); return size > 0 && size < 50 ? `طول meta description الحالي ${size} حرفاً.` : null;
    },
  },
  {
    id: "seo.description-long", category: "seo", severity: "info", title: "الوصف التعريفي طويل جداً", rationale: "الوصف الطويل قد يقلل وضوح الملخص ولا يضمن عرضه كاملاً في واجهات النتائج.", recommendation: "احتفظ بالوصف مركزاً على فائدة الصفحة وتمييزها.", reference: "Google Search Central: snippets", inspect: ({ document }) => {
      const size = textLength(document, 'meta[name="description" i]'); return size > 180 ? `طول meta description الحالي ${size} حرفاً.` : null;
    },
  },
  {
    id: "seo.canonical-fragment", category: "seo", severity: "warning", title: "Canonical يحتوي على fragment", rationale: "الـfragment عادة لا يعرّف مورداً مستقلاً لدى الخادم.", recommendation: "اجعل canonical يشير إلى عنوان المورد الأساسي من دون #fragment إلا عند وجود سبب معماري واضح.", reference: "Google Search Central: canonicalization", inspect: ({ document }) => {
      const value = document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? ""; return value.includes("#") ? `وجدنا canonical بالقيمة "${value}".` : null;
    },
  },
  {
    id: "seo.canonical-query", category: "seo", severity: "info", title: "Canonical يحتوي على معاملات query", rationale: "بعض معاملات العنوان مؤقتة أو تتبع القياس وقد لا تمثل النسخة الأساسية المقصودة.", recommendation: "راجع المعاملات واحتفظ فقط بما يعرّف المحتوى فعلاً.", reference: "Google Search Central: canonicalization", inspect: ({ document }) => {
      const value = document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? ""; return value.includes("?") ? `وجدنا canonical بالقيمة "${value}".` : null;
    },
  },
  {
    id: "seo.robots-conflict", category: "seo", severity: "warning", title: "تعليمات robots متعارضة", rationale: "الجمع بين index وnoindex أو follow وnofollow في الإشارة نفسها يترك القصد غير واضح.", recommendation: "استخدم توجيهاً واحداً متسقاً للصفحة المقصودة.", reference: "Google Search Central: robots meta tag", inspect: ({ document }) => {
      const value = document.querySelector('meta[name="robots" i]')?.getAttribute("content") ?? ""; return /\bindex\b/i.test(value) && /\bnoindex\b/i.test(value) ? `وجدنا robots="${value}".` : null;
    },
  },
  {
    id: "seo.meta-refresh", category: "seo", severity: "warning", title: "تحويل meta refresh مرصود", rationale: "التحويلات داخل المستند قد تربك المستخدمين والتاريخ والتنقل، خصوصاً عند تأخير قصير.", recommendation: "استخدم استجابة HTTP مناسبة أو رابطاً واضحاً يختاره المستخدم عندما يكون ذلك ممكناً.", reference: "MDN: meta http-equiv", inspect: ({ document }) => {
      const node = document.querySelector('meta[http-equiv="refresh" i]'); return node ? `وجدنا ${node.outerHTML.slice(0, 160)}.` : null;
    },
  },
  {
    id: "seo.og-url", category: "seo", severity: "info", title: "رابط Open Graph غير محدد", rationale: "og:url قد يوضح العنوان المقصود عند المشاركة عندما تستخدم الصفحة Open Graph.", recommendation: "أضف og:url إذا كانت بطاقة المشاركة جزءاً مقصوداً من تجربة الصفحة.", reference: "Open Graph protocol", inspect: ({ document }) => document.querySelector('meta[property="og:url"][content]') ? null : "لم نجد meta[property=og:url] في المصدر المقدم.",
  },
  {
    id: "seo.og-type", category: "seo", severity: "info", title: "نوع Open Graph غير محدد", rationale: "تعريف النوع يوضح للمنصات طبيعة الصفحة عند بناء معاينة المشاركة.", recommendation: "أضف og:type مناسباً مثل website أو article عندما تستعمل Open Graph.", reference: "Open Graph protocol", inspect: ({ document }) => document.querySelector('meta[property="og:type"][content]') ? null : "لم نجد meta[property=og:type] في المصدر المقدم.",
  },
  {
    id: "seo.apple-touch-icon", category: "seo", severity: "info", title: "أيقونة Apple touch غير محددة", rationale: "قد تحسن الأيقونة تمييز الموقع عند حفظه على شاشة iOS الرئيسية.", recommendation: "أضف apple-touch-icon فقط إذا كنت تدعم تجربة الحفظ على الشاشة الرئيسية.", reference: "Apple: Configuring Web Applications", inspect: ({ document }) => document.querySelector('link[rel="apple-touch-icon"]') ? null : "لم نجد link[rel=apple-touch-icon] في المصدر المقدم.",
  },
  {
    id: "seo.jsonld-empty", category: "seo", severity: "warning", title: "كتلة JSON-LD فارغة", rationale: "كتلة البيانات المنظمة الفارغة لا تضيف معنى وقد تخفي خطأ توليد في القالب.", recommendation: "أزل الكتلة الفارغة أو اكتب JSON-LD صحيحاً يعبر عن محتوى الصفحة.", reference: "Schema.org JSON-LD", inspect: ({ document }) => {
      const node = [...document.querySelectorAll('script[type="application/ld+json"]')].find((item) => !item.textContent?.trim()); return node ? "وجدنا script[type=application/ld+json] بلا محتوى." : null;
    },
  },
  {
    id: "seo.hreflang-self-missing", category: "seo", severity: "info", title: "بدائل اللغة بلا hreflang", rationale: "رابط alternate بلا لغة لا يشرح ما إذا كان يمثل نسخة لغوية أو تنسيقاً آخر.", recommendation: "أضف hreflang للبدائل اللغوية، أو استخدم rel المناسب لنوع البديل الفعلي.", reference: "Google Search Central: localized versions", inspect: ({ document }) => {
      const nodes = [...document.querySelectorAll('link[rel="alternate"]')].filter((item) => !item.getAttribute("hreflang") && item.getAttribute("href")); return sample(nodes, 'link[rel="alternate"] بلا hreflang');
    },
  },
  {
    id: "seo.inline-style-heavy", category: "seo", severity: "info", title: "أنماط inline كثيرة", rationale: "الأنماط المضمنة المتكررة قد تصعّب صيانة التصميم وتفادي التباين بين المكونات.", recommendation: "انقل الأنماط المشتركة إلى CSS عند وجود تكرار فعلي، واترك الحالات الخاصة فقط محلية.", reference: "MDN: style attribute", inspect: ({ document }) => {
      const nodes = [...document.querySelectorAll("[style]")]; return nodes.length > 20 ? `وجدنا ${nodes.length} عنصراً يملك style inline.` : null;
    },
  },
  {
    id: "structure.empty-paragraph", category: "structure", severity: "info", title: "فقرات فارغة داخل المستند", rationale: "الفقرات الفارغة تستخدم أحياناً كمسافات مرئية لكنها لا تعبر عن بنية محتوى مفيدة.", recommendation: "استخدم CSS للمسافات وأزل الفقرات الخالية من النص أو المعنى.", reference: "HTML: p element", inspect: ({ document }) => sample([...document.querySelectorAll("p")].filter((node) => !normalizedText(node)), "p فارغ"),
  },
  {
    id: "structure.orphan-list-item", category: "structure", severity: "warning", title: "عنصر قائمة خارج قائمة", rationale: "عنصر li خارج ul أو ol أو menu يضعف البنية الدلالية للمحتوى.", recommendation: "ضع كل li داخل عنصر قائمة مناسب.", reference: "HTML: li element", inspect: ({ document }) => sample([...document.querySelectorAll("li")].filter((node) => !node.parentElement?.matches("ul,ol,menu")), "li خارج قائمة"),
  },
  {
    id: "structure.anchor-empty-href", category: "structure", severity: "warning", title: "رابط href فارغ", rationale: "الرابط الفارغ قد يعيد المستخدم إلى أعلى الصفحة أو لا يقدم وجهة متوقعة.", recommendation: "استخدم رابطاً فعلياً أو button للإجراء داخل الصفحة.", reference: "HTML: a element", inspect: ({ document }) => sample([...document.querySelectorAll("a[href]")].filter((node) => !node.getAttribute("href")?.trim()), "a[href='']"),
  },
  {
    id: "structure.javascript-link", category: "structure", severity: "warning", title: "رابط javascript: مرصود", rationale: "روابط javascript: تخلط بين التنقل وتنفيذ السلوك وقد لا تعمل مع بعض السياقات أو سياسات الأمان.", recommendation: "استخدم button للسلوك البرمجي واربط الأحداث بطريقة واضحة.", reference: "MDN: javascript: URLs", inspect: ({ document }) => sample([...document.querySelectorAll("a[href]")].filter((node) => /^javascript:/i.test(node.getAttribute("href") ?? "")), "a[href^=javascript:]"),
  },
  {
    id: "structure.password-get-form", category: "structure", severity: "warning", title: "حقل كلمة مرور داخل نموذج GET", rationale: "إرسال كلمة المرور في query قد يعرضها في العنوان والسجل ووسائط أخرى.", recommendation: "استخدم method=post لمسارات كلمات المرور مع نقل آمن على الخادم.", reference: "MDN: form method", inspect: ({ document }) => sample([...document.querySelectorAll('form[method="get" i]')].filter((form) => form.querySelector('input[type="password"]')), "form[method=get] يحوي password"),
  },
  {
    id: "structure.button-type-in-form", category: "structure", severity: "info", title: "زر داخل نموذج بلا type صريح", rationale: "قد يتصرف button بلا type كزر submit ويطلق الإرسال عند استخدامه لأمر آخر.", recommendation: "حدد type=submit أو type=button لكل زر داخل form وفق وظيفته.", reference: "MDN: button type", inspect: ({ document }) => sample([...document.querySelectorAll("form button")].filter((node) => !node.hasAttribute("type")), "form button بلا type"),
  },
  {
    id: "structure.duplicate-input-name", category: "structure", severity: "info", title: "أسماء حقول إدخال مكررة", rationale: "الاسم المكرر قد يكون مقصوداً للمجموعات، لكنه يستحق مراجعة عندما يخلط بيانات حقول مستقلة.", recommendation: "راجع الحقول ذات الاسم نفسه وتأكد أن الخادم يتوقعها كمجموعة فعلاً.", reference: "HTML: input name", inspect: ({ document }) => {
      const names = new Map<string, number>(); document.querySelectorAll("input[name],select[name],textarea[name]").forEach((node) => { const name = node.getAttribute("name") ?? ""; names.set(name, (names.get(name) ?? 0) + 1); }); const duplicates = [...names.entries()].filter(([, total]) => total > 1).slice(0, 5); return duplicates.length ? `أسماء مكررة: ${duplicates.map(([name]) => name).join("، ")}.` : null;
    },
  },
  {
    id: "structure.nested-main", category: "structure", severity: "warning", title: "أكثر من main داخل الصفحة", rationale: "المحتوى الرئيسي يجب أن يبقى معماً واضحاً كي تنتقل إليه تقنيات المساعدة بثقة.", recommendation: "اترك main واحداً للمحتوى الفريد واستخدم section أو article للأقسام الداخلية.", reference: "HTML: main element", inspect: ({ document }) => {
      const nodes = [...document.querySelectorAll("main")]; return nodes.length > 1 ? `وجدنا ${nodes.length} من عناصر main.` : null;
    },
  },
  {
    id: "structure.style-in-body", category: "structure", severity: "info", title: "كتلة style داخل body", rationale: "وضع CSS في body قد يصعّب تتبع مسؤولية الأنماط وترتيب تحميلها.", recommendation: "ضع الأنماط العامة في head أو في ملف CSS، واترك الحالات الديناميكية محددة ومبررة.", reference: "HTML: style element", inspect: ({ document }) => sample([...document.body.querySelectorAll("style")], "style داخل body"),
  },
  {
    id: "structure.table-without-header", category: "structure", severity: "info", title: "جدول بلا خلايا رأس", rationale: "الجداول البيانية تحتاج رؤوساً لتبقى العلاقة بين الصف والعمود مفهومة.", recommendation: "أضف th وscope أو caption للجدول الذي يعرض بيانات حقيقية.", reference: "W3C: Tables tutorial", inspect: ({ document }) => sample([...document.querySelectorAll("table")].filter((table) => table.querySelectorAll("th").length === 0), "table بلا th"),
  },
  {
    id: "structure.table-caption", category: "structure", severity: "info", title: "جدول بلا caption", rationale: "caption يساعد القارئ على فهم غرض الجدول قبل الانتقال داخله.", recommendation: "أضف caption موجزاً للجدول الذي لا يشرحه عنوان قريب بوضوح.", reference: "W3C: Tables tutorial", inspect: ({ document }) => sample([...document.querySelectorAll("table")].filter((table) => !table.querySelector("caption")), "table بلا caption"),
  },
  {
    id: "structure.heading-level-skip", category: "structure", severity: "info", title: "قفزة كبيرة بين مستويات العناوين", rationale: "القفز من H2 إلى H4 مثلاً قد يجعل شجرة المحتوى أصعب متابعة.", recommendation: "راجع تسلسل العناوين واجعل المستوى يعكس التداخل الحقيقي للأقسام.", reference: "W3C: Headings", inspect: ({ document }) => {
      const levels = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((node) => Number(node.tagName.slice(1))); return levels.some((level, index) => index > 0 && level > levels[index - 1] + 1) ? `تسلسل المستويات المرصود: ${levels.join(" → ")}.` : null;
    },
  },
  {
    id: "accessibility.label-target-missing", category: "accessibility", severity: "warning", title: "label يشير إلى id غير موجود", rationale: "ربط label بحقل غير موجود يمنع تسمية الحقل بالطريقة المقصودة.", recommendation: "راجع قيمة for واجعلها تطابق id فريداً لحقل موجود.", reference: "WCAG 2.2: Labels or Instructions", inspect: ({ document }) => sample([...document.querySelectorAll("label[for]")].filter((label) => !document.getElementById(label.getAttribute("for") ?? "")), "label[for] بلا هدف"),
  },
  {
    id: "accessibility.placeholder-only", category: "accessibility", severity: "warning", title: "حقل يعتمد على placeholder وحده", rationale: "placeholder يختفي عند الكتابة ولا يكفي غالباً كتسمية ثابتة للحقل.", recommendation: "أضف label مرئياً أو aria-label دقيقاً مع الإبقاء على placeholder مثالاً اختيارياً.", reference: "WCAG 2.2: Labels or Instructions", inspect: ({ document }) => sample([...document.querySelectorAll("input[placeholder],textarea[placeholder]")].filter((field) => !field.getAttribute("aria-label") && !field.getAttribute("aria-labelledby") && !(field.id && document.querySelector(`label[for="${CSS.escape(field.id)}"]`))), "حقل placeholder بلا label"),
  },
  {
    id: "accessibility.password-autocomplete", category: "accessibility", severity: "info", title: "حقل كلمة مرور بلا autocomplete", rationale: "تلميح autocomplete يساعد مديري كلمات المرور والمتصفحات على اختيار السلوك الصحيح.", recommendation: "استخدم current-password أو new-password وفق مقصد الحقل.", reference: "MDN: autocomplete", inspect: ({ document }) => sample([...document.querySelectorAll('input[type="password"]')].filter((field) => !field.getAttribute("autocomplete")), "input[type=password] بلا autocomplete"),
  },
  {
    id: "accessibility.aria-hidden-focusable", category: "accessibility", severity: "warning", title: "عنصر قابل للتركيز مخفي عن قارئ الشاشة", rationale: "aria-hidden على عنصر قابل للتركيز قد يترك المستخدم في موضع لا يعلن عنه قارئ الشاشة.", recommendation: "أزل التركيز عن العنصر المخفي أو لا تستخدم aria-hidden على عنصر تفاعلي.", reference: "WAI-ARIA: aria-hidden", inspect: ({ document }) => sample([...document.querySelectorAll('[aria-hidden="true"]')].filter((node) => node.matches("a[href],button,input,select,textarea,[tabindex]:not([tabindex='-1'])")), "عنصر focusable مع aria-hidden=true"),
  },
  {
    id: "accessibility.autofocus", category: "accessibility", severity: "info", title: "autofocus مرصود", rationale: "نقل التركيز تلقائياً قد يربك القراءة أو ينقل الشاشة على الهاتف.", recommendation: "استخدم autofocus فقط عندما تكون فائدة التركيز الفوري واضحة ومختبرة.", reference: "MDN: autofocus", inspect: ({ document }) => sample([...document.querySelectorAll("[autofocus]")], "[autofocus]"),
  },
  {
    id: "accessibility.role-img-name", category: "accessibility", severity: "warning", title: "عنصر role=img بلا اسم", rationale: "التمثيل المرئي الذي يعلن role=img يحتاج اسماً ليكون مفهوماً لقارئ الشاشة.", recommendation: "أضف aria-label أو aria-labelledby أو استخدم صورة ذات alt مناسب.", reference: "WAI-ARIA: img role", inspect: ({ document }) => sample([...document.querySelectorAll('[role="img"]')].filter((node) => !node.getAttribute("aria-label") && !node.getAttribute("aria-labelledby")), "[role=img] بلا اسم"),
  },
  {
    id: "accessibility.dialog-modal", category: "accessibility", severity: "info", title: "حوار role=dialog بلا aria-modal", rationale: "الحوار الحاجب يحتاج إعلاناً واضحاً عن علاقة الصفحة بالخلفية عندما يكون السلوك modal فعلاً.", recommendation: "أضف aria-modal=true وادِر التركيز إذا كان الحوار يمنع التفاعل بالخلفية.", reference: "WAI-ARIA: dialog role", inspect: ({ document }) => sample([...document.querySelectorAll('[role="dialog"]')].filter((node) => node.getAttribute("aria-modal") !== "true"), "[role=dialog] بلا aria-modal=true"),
  },
  {
    id: "accessibility.details-summary", category: "accessibility", severity: "warning", title: "details بلا summary", rationale: "summary يعرّف التحكم الذي يفتح التفاصيل للمستخدمين وتقنيات المساعدة.", recommendation: "ضع summary أول عنصر داخل كل details.", reference: "HTML: details element", inspect: ({ document }) => sample([...document.querySelectorAll("details")].filter((node) => !node.querySelector(":scope > summary")), "details بلا summary"),
  },
  {
    id: "accessibility.media-captions", category: "accessibility", severity: "info", title: "فيديو بلا مسار captions", rationale: "المسار النصي يساعد عند الحاجة إلى بديل صوتي أو قراءة محتوى الفيديو.", recommendation: "أضف track kind=captions للفيديو الذي يحتوي كلاماً عندما تكون الترجمة جزءاً من التجربة المقصودة.", reference: "WCAG 2.2: Captions", inspect: ({ document }) => sample([...document.querySelectorAll("video")].filter((node) => !node.querySelector('track[kind="captions"]')), "video بلا track captions"),
  },
  {
    id: "accessibility.svg-title", category: "accessibility", severity: "info", title: "SVG تفاعلي بلا تسمية", rationale: "الأيقونة SVG داخل عنصر تفاعلي تحتاج اسماً واضحاً إذا لم يقدمه النص أو aria-label في الحاوية.", recommendation: "أضف تسمية للحاوية التفاعلية أو title وaria-labelledby عندما يكون SVG هو الاسم الوحيد.", reference: "WAI-ARIA SVG accessibility", inspect: ({ document }) => sample([...document.querySelectorAll("button svg, a[href] svg")].filter((svg) => !svg.closest("button,a")?.getAttribute("aria-label") && !normalizedText(svg.closest("button,a") ?? null) && !svg.querySelector("title")), "SVG تفاعلي بلا تسمية"),
  },
  {
    id: "accessibility.image-alt-redundant", category: "accessibility", severity: "info", title: "alt صورة يبدأ بكلمة صورة", rationale: "قارئ الشاشة يعلن أن العنصر صورة عادة، وتكرار الوصف قد يطيل القراءة بلا فائدة.", recommendation: "صف المعنى أو المعلومة التي تضيفها الصورة بدلاً من نوع العنصر نفسه.", reference: "W3C: Images tutorial", inspect: ({ document }) => sample([...document.querySelectorAll("img[alt]")].filter((img) => /^(?:image|photo|صورة)\b/i.test(img.getAttribute("alt")?.trim() ?? "")), "img alt يبدأ بنوع الصورة"),
  },
  {
    id: "accessibility.heading-as-button", category: "accessibility", severity: "info", title: "عنوان يحمل role=button", rationale: "العنوان والزر يؤديان وظيفتين مختلفتين وقد يصبح التنقل بالعناوين مضللاً عند خلطهما.", recommendation: "استخدم button داخل العنوان أو بنية مكون توضح دور كل عنصر.", reference: "WAI-ARIA Authoring Practices", inspect: ({ document }) => sample([...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter((node) => node.getAttribute("role") === "button"), "عنوان role=button"),
  },
  {
    id: "accessibility.duplicate-landmark-label", category: "accessibility", severity: "info", title: "معالم مكررة بلا تسمية مميزة", rationale: "تسمية المعالم المكررة تساعد المستخدم على اختيار منطقة التنقل أو المحتوى الصحيحة.", recommendation: "أضف aria-label أو aria-labelledby مميزاً للمعالم المكررة عند الحاجة.", reference: "WAI-ARIA landmark roles", inspect: ({ document }) => {
      const landmarks = [...document.querySelectorAll("nav,aside,[role=navigation],[role=complementary]")]; return landmarks.length > 1 && landmarks.every((node) => !node.getAttribute("aria-label") && !node.getAttribute("aria-labelledby")) ? `وجدنا ${landmarks.length} معالم متكررة بلا تسمية.` : null;
    },
  },
  {
    id: "performance.lazy-iframes", category: "performance", severity: "info", title: "iframes بلا loading=lazy", rationale: "قد تؤخر الإطارات الخارجية عمل الصفحة عندما لا يحتاجها الزائر في البداية.", recommendation: "استخدم loading=lazy للإطارات البعيدة عن الشاشة ما لم تكن ضرورية للتفاعل الفوري.", reference: "MDN: iframe loading", inspect: ({ document }) => sample([...document.querySelectorAll("iframe")].filter((frame) => frame.getAttribute("loading") !== "lazy"), "iframe بلا loading=lazy"),
  },
  {
    id: "performance.lazy-images", category: "performance", severity: "info", title: "صور متعددة بلا تحميل مؤجل", rationale: "تحميل كل الصور فوراً قد يستهلك الشبكة قبل أن يصل المستخدم إلى المحتوى البعيد.", recommendation: "ضع loading=lazy للصور غير الحرجة، واترك صورة البداية ذات الأولوية الفعلية.", reference: "MDN: img loading", inspect: ({ document }) => {
      const images = [...document.querySelectorAll("img")]; const eager = images.filter((image) => image.getAttribute("loading") !== "lazy"); return images.length > 4 && eager.length > 4 ? `وجدنا ${eager.length} من ${images.length} صور بلا loading=lazy.` : null;
    },
  },
  {
    id: "performance.duplicate-script-src", category: "performance", severity: "warning", title: "ملف JavaScript خارجي مكرر", rationale: "تحميل الملف نفسه أكثر من مرة قد يضيف طلبات أو تنفيذاً متكرراً بلا فائدة.", recommendation: "احتفظ بمرجع script واحد لكل مورد ما لم يكن التكرار مقصوداً ومفهوماً.", reference: "web.dev: Optimize JavaScript", inspect: ({ document }) => {
      const sources = new Map<string, number>(); document.querySelectorAll("script[src]").forEach((node) => { const src = node.getAttribute("src") ?? ""; sources.set(src, (sources.get(src) ?? 0) + 1); }); const duplicate = [...sources.entries()].filter(([, total]) => total > 1); return duplicate.length ? `ملفات مكررة: ${duplicate.map(([src]) => src).join("، ")}.` : null;
    },
  },
  {
    id: "performance.duplicate-stylesheet", category: "performance", severity: "warning", title: "stylesheet خارجي مكرر", rationale: "ربط stylesheet نفسه أكثر من مرة يزيد الطلبات ويعقد تتبع cascade.", recommendation: "أزل الروابط المكررة واحتفظ بترتيب تحميل واضح للأنماط.", reference: "MDN: link rel=stylesheet", inspect: ({ document }) => {
      const hrefs = new Map<string, number>(); document.querySelectorAll('link[rel="stylesheet"][href]').forEach((node) => { const href = node.getAttribute("href") ?? ""; hrefs.set(href, (hrefs.get(href) ?? 0) + 1); }); const duplicate = [...hrefs.entries()].filter(([, total]) => total > 1); return duplicate.length ? `stylesheets مكررة: ${duplicate.map(([href]) => href).join("، ")}.` : null;
    },
  },
  {
    id: "performance.transition-all", category: "performance", severity: "info", title: "CSS يستخدم transition: all", rationale: "تحريك كل الخصائص قد يجعل المتصفح ينتقل بخصائص تخطيط أو رسم غير مقصودة.", recommendation: "حدد الخصائص المراد تحريكها مثل opacity أو transform عندما يكون ذلك مناسباً.", reference: "web.dev: Animations", inspect: ({ cssText }) => /transition(?:-property)?\s*:\s*all\b/i.test(cssText) ? "وجدنا transition: all في CSS المقدم." : null,
  },
  {
    id: "performance.important-overuse", category: "performance", severity: "info", title: "استخدام !important بكثرة", rationale: "الإفراط في !important يصعّب صيانة cascade وتحديد مصدر النمط الفائز.", recommendation: "راجع الانتقائية وترتيب الطبقات قبل اللجوء إلى !important المتكرر.", reference: "MDN: !important", inspect: ({ cssText }) => {
      const total = (cssText.match(/!important\b/gi) ?? []).length; return total > 10 ? `وجدنا ${total} استخدامات لـ !important.` : null;
    },
  },
  {
    id: "performance.autoplay-media", category: "performance", severity: "info", title: "وسيط يعمل تلقائياً", rationale: "الوسائط ذات autoplay قد تستهلك بيانات أو تشتت المستخدم إذا لم تكن جزءاً أساسياً من المهمة.", recommendation: "استخدم autoplay فقط مع سبب واضح، ووفّر عناصر تحكم ومراعاة تفضيلات المستخدم.", reference: "MDN: autoplay guide", inspect: ({ document }) => sample([...document.querySelectorAll("audio[autoplay],video[autoplay]")], "audio/video مع autoplay"),
  },
  {
    id: "performance.sync-font-import", category: "performance", severity: "info", title: "استيراد خط من CSS عبر @import", rationale: "الاستيراد المتداخل للخطوط قد يؤخر جلبها ويجعل مسار الرسم أقل وضوحاً.", recommendation: "راجع استخدام link أو بناء الخطوط محلياً مع استراتيجية تحميل مناسبة.", reference: "web.dev: Optimize fonts", inspect: ({ cssText }) => /@import[^;]+fonts?\./i.test(cssText) ? "وجدنا @import يشير إلى مصدر خطوط." : null,
  },
  {
    id: "rtl.ltr-input-types", category: "rtl", severity: "info", title: "حقول بريد أو رابط بلا اتجاه LTR صريح", rationale: "البريد والرابط قد يظهران بترتيب مربك داخل واجهة RTL عند عدم توضيح اتجاه الحقل.", recommendation: "راجع dir=ltr لحقول email وurl عند وجود واجهة RTL، ثم اختبر الإدخال الفعلي على الهاتف.", reference: "W3C: inline bidi markup", inspect: ({ document, containsArabic }) => {
      if (!containsArabic) return null; return sample([...document.querySelectorAll('input[type="email"],input[type="url"]')].filter((node) => node.getAttribute("dir") !== "ltr"), "input email/url بلا dir=ltr");
    },
  },
  {
    id: "rtl.physical-float", category: "rtl", severity: "info", title: "CSS يستخدم float باتجاه مادي", rationale: "float:left وfloat:right قد يحتاجان مراجعة عند دعم الاتجاهين لأنهما يربطان التخطيط بجهة ثابتة.", recommendation: "راجع إن كانت الخاصية المنطقية أو layout حديثاً يعبّر عن القصد بصورة أوضح.", reference: "MDN: CSS logical properties", inspect: ({ cssText, containsArabic }) => containsArabic && /float\s*:\s*(?:left|right)/i.test(cssText) ? "وجدنا float:left أو float:right في CSS مع محتوى عربي." : null,
  },
  {
    id: "rtl.physical-border-radius", category: "rtl", severity: "info", title: "زوايا CSS مادية في واجهة عربية", rationale: "قد تكون corner radius المادية مقصودة بصرياً، لكنها تستحق مراجعة عندما تتغير جهة المكوّن بين RTL وLTR.", recommendation: "راجع border-*-radius واستعمل الخصائص المنطقية عندما ترتبط الزاوية ببداية أو نهاية المحتوى.", reference: "MDN: CSS logical properties", inspect: ({ cssText, containsArabic }) => containsArabic && /border-(?:top|bottom)-(?:left|right)-radius/i.test(cssText) ? "وجدنا زوايا border-radius مادية في CSS مع محتوى عربي." : null,
  },
  {
    id: "rtl.number-input-direction", category: "rtl", severity: "info", title: "حقل رقم بلا اتجاه واضح", rationale: "ترتيب الرقم والرموز المجاورة قد يحتاج مراجعة داخل نماذج RTL، خصوصاً عند المزج مع وحدات أو عملات.", recommendation: "اختبر الحقل على متصفح مستهدف وحدد dir=ltr فقط عندما يوضح ذلك الإدخال فعلاً.", reference: "W3C: The dir attribute", inspect: ({ document, containsArabic }) => containsArabic ? sample([...document.querySelectorAll('input[type="number"]')].filter((node) => !node.getAttribute("dir")), "input[type=number] بلا dir") : null,
  },
];

export const extendedRules: AuditRule[] = signals.map(rule);
