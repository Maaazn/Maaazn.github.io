import type { AuditRule } from "./types";
import { makeFinding, normalizedText } from "./types";

type MissingSelectorSpec = {
  id: string;
  category: AuditRule["category"];
  selector: string;
  title: string;
  rationale: string;
  recommendation: string;
  reference: string;
  severity?: "error" | "warning" | "info";
};

function missingSelectorRule(spec: MissingSelectorSpec): AuditRule {
  return {
    id: spec.id,
    category: spec.category,
    evaluate: ({ document }) => document.querySelector(spec.selector) ? null : makeFinding(
      spec.id,
      spec.category,
      spec.severity ?? "warning",
      spec.title,
      spec.rationale,
      `لم نجد ${spec.selector} في المصدر المقدم.`,
      spec.recommendation,
      spec.reference,
    ),
  };
}

function count(elements: Element[], limit = 5): string {
  return `${elements.length} عنصر${elements.length === 1 ? "" : "اً"} (حتى ${limit} أمثلة).`;
}

function bySelector(document: Document, selector: string): Element[] {
  return [...document.querySelectorAll(selector)].slice(0, 5);
}

function documentTextLength(document: Document): number {
  return normalizedText(document.body).replace(/\s+/g, "").length;
}

const missingRules: MissingSelectorSpec[] = [
  { id: "seo.og-description", category: "seo", selector: 'meta[property="og:description"][content]', title: "وصف المشاركة الاجتماعية غير محدد", rationale: "قد تستخدم منصات المشاركة وصف Open Graph عندما يتاح.", recommendation: "أضف og:description موجزاً يصف الصفحة نفسها.", reference: "Open Graph protocol", severity: "info" },
  { id: "seo.og-image", category: "seo", selector: 'meta[property="og:image"][content]', title: "صورة Open Graph غير محددة", rationale: "الصورة الواضحة تجعل معاينة الرابط أقل التباساً عند المشاركة.", recommendation: "أضف og:image لصورة تملك حق استخدامها وتصف الصفحة.", reference: "Open Graph protocol", severity: "info" },
  { id: "seo.twitter-card", category: "seo", selector: 'meta[name="twitter:card"][content]', title: "Twitter Card غير محدد", rationale: "بعض المنصات تستخدم Twitter Card لتنسيق المعاينة.", recommendation: "أضف twitter:card فقط إذا كانت المعاينة جزءاً من تجربة النشر لديك.", reference: "X Cards markup", severity: "info" },
  { id: "seo.favicon", category: "seo", selector: 'link[rel~="icon"]', title: "أيقونة الموقع غير محددة", rationale: "الأيقونة تساعد المستخدم على تمييز الصفحة في التبويبات وقائمة المحفوظات.", recommendation: "أضف favicon مناسباً وصغيراً ومملوكاً للموقع.", reference: "HTML link rel=icon", severity: "info" },
  { id: "seo.manifest", category: "seo", selector: 'link[rel="manifest"]', title: "Web App Manifest غير محدد", rationale: "الـmanifest مفيد فقط عندما تقدم تجربة ويب قابلة للتثبيت أو تحتاج بيانات عرض إضافية.", recommendation: "أضف manifest إن كانت له قيمة تشغيلية فعلية؛ لا تضفه لمجرد رفع المؤشر.", reference: "Web App Manifest", severity: "info" },
  { id: "seo.theme-color", category: "seo", selector: 'meta[name="theme-color"][content]', title: "لون واجهة المتصفح غير محدد", rationale: "يمكن للمتصفحات الداعمة استعماله لتنسيق واجهة الموقع حول الصفحة.", recommendation: "أضف theme-color متوافقاً مع اللون الذي يراه المستخدم فعلاً.", reference: "HTML meta theme-color", severity: "info" },
  { id: "structure.main-landmark", category: "structure", selector: "main, [role=main]", title: "معلم المحتوى الرئيسي مفقود", rationale: "المعلم الرئيسي يساعد التنقل المباشر إلى محتوى الصفحة في تقنيات المساعدة.", recommendation: "ضع المحتوى الفريد للصفحة داخل عنصر main واحد أو role=main.", reference: "WAI-ARIA landmark roles" },
  { id: "structure.navigation-landmark", category: "structure", selector: "nav, [role=navigation]", title: "معلم التنقل مفقود", rationale: "التنقل المعلن يجعل الانتقال بين أقسام الصفحة أوضح لقارئ الشاشة.", recommendation: "لف روابط التنقل الرئيسية بعنصر nav مع تسمية عند وجود أكثر من قائمة.", reference: "WAI-ARIA landmark roles", severity: "info" },
  { id: "structure.skip-link", category: "accessibility", selector: 'a[href^="#"]', title: "رابط تجاوز إلى المحتوى غير مرصود", rationale: "رابط التجاوز يساعد مستخدمي لوحة المفاتيح على تخطي القوائم المتكررة.", recommendation: "أضف رابطاً مرئياً عند التركيز ينتقل إلى المعلم الرئيسي للمحتوى.", reference: "WCAG 2.2: Bypass Blocks", severity: "info" },
];

export const qualityRules: AuditRule[] = [
  ...missingRules.map(missingSelectorRule),
  {
    id: "seo.canonical-absolute",
    category: "seo",
    evaluate: ({ document }) => {
      const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href")?.trim();
      return !canonical || /^https?:\/\//i.test(canonical) ? null : makeFinding("seo.canonical-absolute", "seo", "warning", "Canonical ليس رابطاً مطلقاً", "الرابط المطلق يقلل التباس تفسير العنوان الأساسي خارج سياق الصفحة.", `وجدنا canonical بالقيمة "${canonical}".`, "استخدم رابطاً مطلقاً يطابق العنوان العام الذي تريد اعتباره النسخة الأساسية.", "Google Search Central: canonicalization");
    },
  },
  {
    id: "seo.canonical-multiple",
    category: "seo",
    evaluate: ({ document }) => {
      const canonicals = bySelector(document, 'link[rel="canonical"]');
      return canonicals.length <= 1 ? null : makeFinding("seo.canonical-multiple", "seo", "warning", "يوجد أكثر من canonical", "تعدد الإشارات الأساسية قد يترك المحركات بلا إشارة واضحة للنسخة المفضلة.", `وجدنا ${count(canonicals)} من روابط canonical.`, "اترك رابط canonical واحداً مناسباً لكل صفحة قابلة للفهرسة.", "Google Search Central: canonicalization");
    },
  },
  {
    id: "seo.robots-noindex",
    category: "seo",
    evaluate: ({ document }) => {
      const value = document.querySelector('meta[name="robots" i]')?.getAttribute("content") ?? "";
      return /\bnoindex\b/i.test(value) ? makeFinding("seo.robots-noindex", "seo", "warning", "الصفحة تطلب noindex", "هذه الإشارة تخبر محركات البحث بعدم فهرسة الصفحة عند احترامها.", `وجدنا robots="${value}".`, "أزل noindex فقط إذا كانت الصفحة عامة ومكتملة وتريد فهرستها فعلاً.", "Google Search Central: robots meta tag") : null;
    },
  },
  {
    id: "seo.jsonld-invalid",
    category: "seo",
    evaluate: ({ document }) => {
      const invalid = bySelector(document, 'script[type="application/ld+json"]').find((node) => {
        try { JSON.parse(node.textContent ?? ""); return false; } catch { return true; }
      });
      return invalid ? makeFinding("seo.jsonld-invalid", "seo", "warning", "JSON-LD غير قابل للقراءة", "البيانات المنظمة المكسورة لن تُفسر كما تقصدها الأدوات التي تقرأ JSON-LD.", "وجدنا script[type=application/ld+json] لا يمر عبر JSON.parse.", "صحح JSON-LD ثم افحصه بأداة مناسبة لنوع المخطط الذي تستخدمه.", "Schema.org JSON-LD") : null;
    },
  },
  {
    id: "structure.multiple-h1",
    category: "structure",
    evaluate: ({ document }) => {
      const headings = bySelector(document, "h1");
      return headings.length <= 1 ? null : makeFinding("structure.multiple-h1", "structure", "info", "يوجد أكثر من عنوان H1", "وجود أكثر من H1 ليس خطأً دائماً، لكنه يحتاج بنية صفحات ومقاطع واضحة.", `وجدنا ${count(headings)} من عناصر h1.`, "راجع ما إذا كان كل H1 يمثل مقطعاً مستقلاً؛ وإلا اجعل عنوان الصفحة الرئيسي واحداً.", "W3C: Headings");
    },
  },
  {
    id: "structure.empty-heading",
    category: "structure",
    evaluate: ({ document }) => {
      const empty = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter((node) => !normalizedText(node)).slice(0, 5);
      return empty.length ? makeFinding("structure.empty-heading", "structure", "warning", "عنوان فارغ في البنية", "العنوان الفارغ قد يربك قائمة العناوين في تقنيات المساعدة.", `وجدنا ${count(empty)} من العناوين بلا نص.`, "أزل العنوان الفارغ أو أعطه نصاً يصف القسم فعلاً.", "W3C: Headings") : null;
    },
  },
  {
    id: "structure.duplicate-id",
    category: "structure",
    evaluate: ({ document }) => {
      const ids = new Map<string, number>();
      document.querySelectorAll("[id]").forEach((node) => ids.set(node.id, (ids.get(node.id) ?? 0) + 1));
      const duplicates = [...ids.entries()].filter(([, total]) => total > 1).slice(0, 5);
      return duplicates.length ? makeFinding("structure.duplicate-id", "structure", "warning", "معرّفات id مكررة", "تكرار id يكسر الربط الدقيق بين labels والروابط والعناصر المقصودة.", `معرّفات مكررة: ${duplicates.map(([id]) => `#${id}`).join("، ")}.`, "اجعل كل id فريداً في الصفحة، ثم راجع أي label أو href يعتمد عليه.", "HTML: The id global attribute") : null;
    },
  },
  {
    id: "accessibility.empty-link",
    category: "accessibility",
    evaluate: ({ document }) => {
      const empty = [...document.querySelectorAll("a[href]")].filter((node) => !normalizedText(node) && !node.getAttribute("aria-label") && !node.querySelector("img[alt]:not([alt=''])")).slice(0, 5);
      return empty.length ? makeFinding("accessibility.empty-link", "accessibility", "warning", "رابط بلا اسم قابل للوصول", "قارئ الشاشة يحتاج اسماً يوضح وجهة الرابط أو غرضه.", `وجدنا ${count(empty)} من الروابط بلا نص أو aria-label أو صورة ذات alt.`, "أضف نصاً مرئياً أو aria-label صادقاً يصف وجهة الرابط.", "WCAG 2.2: Link Purpose") : null;
    },
  },
  {
    id: "accessibility.empty-button",
    category: "accessibility",
    evaluate: ({ document }) => {
      const empty = [...document.querySelectorAll("button, [role=button]")].filter((node) => !normalizedText(node) && !node.getAttribute("aria-label") && !node.getAttribute("aria-labelledby")).slice(0, 5);
      return empty.length ? makeFinding("accessibility.empty-button", "accessibility", "warning", "زر بلا اسم قابل للوصول", "الزر بلا اسم لا يشرح الإجراء الذي سينفذه للمستخدمين وتقنيات المساعدة.", `وجدنا ${count(empty)} من الأزرار بلا نص أو aria-label.`, "أضف تسمية مرئية أو aria-label تصف الفعل بدقة.", "WCAG 2.2: Name, Role, Value") : null;
    },
  },
  {
    id: "accessibility.iframe-title",
    category: "accessibility",
    evaluate: ({ document }) => {
      const missing = [...document.querySelectorAll("iframe")].filter((frame) => !frame.getAttribute("title")?.trim()).slice(0, 5);
      return missing.length ? makeFinding("accessibility.iframe-title", "accessibility", "warning", "إطار iframe بلا عنوان", "العنوان يعرّف محتوى الإطار عند التنقل عبر تقنيات المساعدة.", `وجدنا ${count(missing)} من iframes بلا title.`, "أضف title قصيراً يصف محتوى كل iframe أو أزل الإطار غير الضروري.", "WCAG 2.2: Frame titles") : null;
    },
  },
  {
    id: "accessibility.positive-tabindex",
    category: "accessibility",
    evaluate: ({ document }) => {
      const elements = [...document.querySelectorAll("[tabindex]")].filter((node) => Number(node.getAttribute("tabindex")) > 0).slice(0, 5);
      return elements.length ? makeFinding("accessibility.positive-tabindex", "accessibility", "warning", "tabindex موجب يغير ترتيب لوحة المفاتيح", "إجبار ترتيب التركيز قد يجعل التنقل لا يطابق ترتيب الصفحة المرئي.", `وجدنا ${count(elements)} من عناصر tabindex الموجب.`, "اعتمد ترتيب DOM الطبيعي أو tabindex=0 عند الحاجة لجعل عنصر قابلاً للتركيز.", "WCAG 2.2: Focus Order") : null;
    },
  },
  {
    id: "accessibility.target-blank-rel",
    category: "accessibility",
    evaluate: ({ document }) => {
      const unsafe = [...document.querySelectorAll('a[target="_blank"]')].filter((node) => !/\bnoopener\b/i.test(node.getAttribute("rel") ?? "")).slice(0, 5);
      return unsafe.length ? makeFinding("accessibility.target-blank-rel", "accessibility", "warning", "روابط نافذة جديدة بلا noopener", "فتح تبويب جديد بلا noopener يسمح للصفحة الجديدة بالوصول إلى window.opener في متصفحات تدعمه.", `وجدنا ${count(unsafe)} من روابط target=_blank بلا rel=noopener.`, "أضف rel=\"noopener noreferrer\" للروابط التي تفتح تبويباً جديداً، واذكر ذلك في النص عندما يلزم.", "MDN: rel=noopener") : null;
    },
  },
  {
    id: "accessibility.viewport-zoom-lock",
    category: "accessibility",
    evaluate: ({ document }) => {
      const viewport = document.querySelector('meta[name="viewport" i]')?.getAttribute("content") ?? "";
      return /user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\.0+)?(?:\D|$)/i.test(viewport) ? makeFinding("accessibility.viewport-zoom-lock", "accessibility", "warning", "التكبير مقيد في viewport", "منع التكبير قد يصعّب قراءة النص والتفاصيل الصغيرة على الهاتف.", `وجدنا viewport="${viewport}".`, "لا تقيد user-scalable أو maximum-scale إلا إذا كان لديك سبب وصولي واضح ومختبر.", "WCAG 2.2: Resize Text") : null;
    },
  },
  {
    id: "accessibility.focus-outline-none",
    category: "accessibility",
    evaluate: ({ cssText }) => /:focus[^\{]*\{[^}]*outline\s*:\s*(?:0|none)/i.test(cssText) && !/:focus-visible/i.test(cssText) ? makeFinding("accessibility.focus-outline-none", "accessibility", "warning", "إزالة outline من دون بديل focus-visible", "مؤشر التركيز ضروري لمعرفة موضع لوحة المفاتيح داخل الصفحة.", "رصدنا إزالة outline في :focus ولم نجد :focus-visible في CSS المقدم.", "أضف نمط :focus-visible عالي التباين قبل إزالة outline الافتراضي.", "WCAG 2.2: Focus Visible") : null,
  },
  {
    id: "performance.css-import",
    category: "performance",
    evaluate: ({ cssText }) => /@import\s+(?:url\()?/i.test(cssText) ? makeFinding("performance.css-import", "performance", "info", "CSS يستخدم @import", "@import قد يضيف سلسلة طلبات إضافية بحسب طريقة التحميل.", "وجدنا @import في CSS المقدم.", "راجع إمكانية ربط stylesheet مباشرة أو دمجه في مسار البناء عند وجود أثر أداء فعلي.", "web.dev: Avoid CSS @import") : null,
  },
  {
    id: "performance.blocking-head-script",
    category: "performance",
    evaluate: ({ document }) => {
      const scripts = [...document.head.querySelectorAll("script[src]")].filter((script) => !script.hasAttribute("async") && !script.hasAttribute("defer") && script.getAttribute("type") !== "module").slice(0, 5);
      return scripts.length ? makeFinding("performance.blocking-head-script", "performance", "info", "Script خارجي متزامن في head", "الـscript المتزامن قد يؤخر تحليل المستند حتى ينتهي تحميله وتنفيذه.", `وجدنا ${count(scripts)} من scripts خارجية متزامنة في head.`, "راجع defer أو type=module أو موضع التحميل عندما لا يحتاج السكربت إلى منع بناء الصفحة.", "web.dev: Optimize third-party JavaScript") : null;
    },
  },
  {
    id: "performance.image-dimensions",
    category: "performance",
    evaluate: ({ document }) => {
      const images = [...document.querySelectorAll("img")].filter((image) => !image.hasAttribute("width") || !image.hasAttribute("height")).slice(0, 5);
      return images.length ? makeFinding("performance.image-dimensions", "performance", "info", "صور بلا أبعاد معلنة", "الأبعاد أو نسبة العرض تساعد المتصفح على حجز مساحة قبل اكتمال تحميل الصورة.", `وجدنا ${count(images)} من الصور من دون width وheight معاً.`, "أضف أبعاداً أو نسبة عرض ثابتة للصور التي تؤثر في التخطيط.", "web.dev: Optimize CLS") : null;
    },
  },
  {
    id: "performance.inline-css-large",
    category: "performance",
    evaluate: ({ cssText }) => cssText.length > 50_000 ? makeFinding("performance.inline-css-large", "performance", "info", "كتلة CSS محلية كبيرة", "الحجم الكبير ليس خطأً بحد ذاته، لكنه يستحق مراجعة قبل وضعه داخل كل صفحة.", `حجم CSS المقدم ${Math.ceil(cssText.length / 1024)}KB.`, "افحص ما إذا كان CSS يحتاج تقسيم أو إزالة قواعد غير مستخدمة وفق نتائج البناء الفعلية.", "web.dev: Reduce unused CSS") : null,
  },
  {
    id: "structure.low-visible-text",
    category: "structure",
    evaluate: ({ document }) => documentTextLength(document) >= 250 ? null : makeFinding("structure.low-visible-text", "structure", "info", "النص الظاهر محدود جداً", "قلة النص ليست مخالفة، لكنها تستحق مراجعة عندما تكون الصفحة المقصودة مرجعاً أو صفحة شرح.", `النص المرصود يحوي نحو ${documentTextLength(document)} حرفاً غير فارغ.`, "تأكد من أن الصفحة تشرح هدفها وخطوتها التالية للقارئ، بدلاً من إضافة حشو أو نص مكرر.", "Google Search Central: helpful content") ,
  },
];
