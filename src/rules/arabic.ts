import type { AuditRule } from "./types";
import { makeFinding, normalizedText } from "./types";

const PHYSICAL_CSS_RE = /\b(?:margin|padding|border)-(?:left|right)\b|\b(?:left|right)\s*:|\btext-align\s*:\s*(?:left|right)\b|\bfloat\s*:\s*(?:left|right)\b/gi;
const ARABIC_RE = /[\u0600-\u06FF]/;

export const arabicRules: AuditRule[] = [
  {
    id: "rtl.language",
    category: "rtl",
    evaluate: ({ document, containsArabic }) => {
      const language = document.documentElement.getAttribute("lang")?.trim().toLowerCase();
      if (!containsArabic || language?.startsWith("ar")) return null;
      return makeFinding("rtl.language", "rtl", "warning", "لغة الصفحة العربية غير معرّفة", "تساعد لغة المستند تقنيات القراءة ومحركات البحث على فهم النص العربي.", language ? `وجدنا lang="${language}" في عنصر html.` : "لم نجد سمة lang في عنصر html.", "استخدم <html lang=\"ar\" dir=\"rtl\"> للصفحة العربية الأساسية.", "W3C: Language and direction in HTML");
    },
  },
  {
    id: "rtl.direction",
    category: "rtl",
    evaluate: ({ document, containsArabic }) => {
      const direction = document.documentElement.getAttribute("dir")?.trim().toLowerCase();
      if (!containsArabic || direction === "rtl") return null;
      return makeFinding("rtl.direction", "rtl", "error", "اتجاه الصفحة لا يعلن RTL", "اللغة وحدها لا تعيّن اتجاه تدفق النص أو محاذاة الحقول والجداول.", direction ? `وجدنا dir="${direction}" في عنصر html.` : "لم نجد سمة dir في عنصر html.", "أضف dir=\"rtl\" إلى عنصر html، ثم استخدم اتجاهات محلية للمقاطع الإنجليزية عند الحاجة.", "W3C: The dir attribute");
    },
  },
  {
    id: "rtl.logical-css",
    category: "rtl",
    evaluate: ({ cssText }) => {
      const matches = [...cssText.matchAll(PHYSICAL_CSS_RE)].map((match) => match[0]).slice(0, 5);
      if (matches.length === 0) return null;
      return makeFinding("rtl.logical-css", "rtl", "warning", "خصائص CSS مرتبطة باليسار واليمين", "الخصائص الفيزيائية قد تجعل الواجهة تتصرف بصورة خاطئة عند دعم العربية أو تبديل الاتجاه.", `أمثلة مرصودة: ${matches.join("، ")}.`, "استبدل left/right بخصائص منطقية مثل inset-inline-start وmargin-inline-start وtext-align: start.", "W3C: CSS logical properties");
    },
  },
  {
    id: "rtl.mixed-bidi",
    category: "rtl",
    evaluate: ({ document }) => {
      const mixedNodes = [...document.querySelectorAll("p, li, small, label, button, a")]
        .filter((node) => ARABIC_RE.test(normalizedText(node)) && /https?:\/\/|www\.|@/i.test(normalizedText(node)))
        .slice(0, 3);
      if (mixedNodes.length === 0) return null;
      return makeFinding("rtl.mixed-bidi", "rtl", "info", "نص عربي مختلط بروابط أو معرّفات لاتينية", "المقاطع المختلطة قد تعيد ترتيب علامات الترقيم أو عناوين الويب بصرياً.", `رصدنا ${mixedNodes.length} مقطعاً عربياً يحوي رابطاً أو بريداً أو رمز @.`, "ضع المحتوى الديناميكي المختلط داخل <bdi> أو استخدم dir=\"auto\"/dir=\"ltr\" عند الحاجة.", "W3C: Inline bidi markup");
    },
  },
  {
    id: "rtl.decimal-leading-numerals",
    category: "rtl",
    evaluate: ({ document, containsArabic }) => {
      if (!containsArabic) return null;
      const nodes = [...document.querySelectorAll("p, li, td, th, label")].filter((node) => /^\s*\d+(?:[.,]\d+)?\s+[\u0600-\u06FF]/.test(normalizedText(node))).slice(0, 3);
      if (nodes.length === 0) return null;
      return makeFinding("rtl.decimal-leading-numerals", "rtl", "info", "رقم غربي في مستهل نص عربي", "بدء مقطع RTL برقم غربي قد يجعل علامة الترقيم أو ترتيب النص غير واضحين في بعض السياقات.", `رصدنا ${nodes.length} مقطعاً يبدأ برقم غربي ثم نص عربي.`, "راجع العرض في المتصفح المستهدف، وجرّب تغليف المقطع بـ<bdi> أو استخدام أرقام عربية إذا كان ذلك أنسب للمحتوى.", "W3C: Inline bidi markup");
    },
  },
  {
    id: "rtl.form-direction",
    category: "rtl",
    evaluate: ({ document, containsArabic }) => {
      if (!containsArabic) return null;
      const conflicting = [...document.querySelectorAll("input[dir='ltr'], textarea[dir='ltr'], select[dir='ltr'], form[dir='ltr'] input, form[dir='ltr'] textarea, form[dir='ltr'] select")]
        .filter((control) => ARABIC_RE.test(control.getAttribute("placeholder") ?? "") || ARABIC_RE.test(control.getAttribute("aria-label") ?? ""))
        .slice(0, 3);
      if (conflicting.length === 0) return null;
      return makeFinding("rtl.form-direction", "rtl", "warning", "اتجاه حقل نموذج يناقض محتواه العربي", "الحقل الذي يحمل تعليماً عربياً لكنه يفرض LTR قد يربك إدخال النص وعلامات الترقيم.", `رصدنا ${conflicting.length} حقلاً عربياً داخل سياق dir=\"ltr\".`, "دع الحقل يرث RTL أو استخدم dir=\"auto\" عندما يتوقع إدخالاً عربياً وإنجليزياً مختلطاً.", "W3C: The dir attribute");
    },
  },
];
