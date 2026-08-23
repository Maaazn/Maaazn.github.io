import type { AuditRule } from "./types";
import { makeFinding, normalizedText } from "./types";

function parseJsonLd(document: Document): unknown[] {
  return [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap((script) => {
    try {
      const value: unknown = JSON.parse(script.textContent ?? "");
      return Array.isArray(value) ? value : [value];
    } catch {
      return [];
    }
  });
}

function getType(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  const typed = (value as { "@type"?: unknown })["@type"];
  return Array.isArray(typed) ? typed.filter((item): item is string => typeof item === "string") : typeof typed === "string" ? [typed] : [];
}

export const seoRules: AuditRule[] = [
  {
    id: "seo.charset",
    category: "seo",
    evaluate: ({ document }) => document.querySelector("meta[charset]") ? null : makeFinding("seo.charset", "seo", "warning", "ترميز الصفحة غير معلن", "إعلان UTF-8 مبكراً يساعد المتصفحات على تفسير النص العربي بصورة متسقة.", "لم نجد meta[charset] في المصدر المقدم.", "أضف <meta charset=\"UTF-8\"> ضمن بداية head.", "HTML Standard: character encoding declaration"),
  },
  {
    id: "seo.title",
    category: "seo",
    evaluate: ({ document }) => normalizedText(document.querySelector("title")) ? null : makeFinding("seo.title", "seo", "error", "عنوان الصفحة مفقود", "عنوان الوثيقة يعرّف الصفحة في علامات المتصفح ونتائج البحث.", "لم نجد عنصر <title> له نص.", "أضف عنواناً محدداً يصف الغرض الحقيقي للصفحة.", "Google Search: title links"),
  },
  {
    id: "seo.description",
    category: "seo",
    evaluate: ({ document }) => document.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() ? null : makeFinding("seo.description", "seo", "warning", "الوصف التعريفي مفقود", "الوصف الجيد يساعد في تلخيص الصفحة عندما تختاره محركات البحث.", "لم نجد meta[name=\"description\"] بمحتوى.", "أضف وصفاً أصلياً ومحدداً لما يفعله المستخدم في هذه الصفحة.", "Google Search: meta descriptions"),
  },
  {
    id: "seo.canonical",
    category: "seo",
    evaluate: ({ document }) => document.querySelector('link[rel="canonical"]')?.getAttribute("href")?.trim() ? null : makeFinding("seo.canonical", "seo", "info", "رابط canonical غير موجود", "يفيد canonical عندما توجد نسخ متقاربة من الصفحة قابلة للوصول بعناوين متعددة.", "لم نجد link[rel=\"canonical\"].", "أضف canonical فقط إذا كان لديك عنوان مفضّل ثابت يمكن الوصول إليه.", "Google Search: consolidating duplicate URLs"),
  },
  {
    id: "seo.og-title",
    category: "seo",
    evaluate: ({ document }) => document.querySelector('meta[property="og:title"]')?.getAttribute("content")?.trim() ? null : makeFinding("seo.og-title", "seo", "info", "عنوان المشاركة الاجتماعية غير محدد", "قد تستخدم منصات المشاركة بيانات Open Graph عند توفرها.", "لم نجد meta[property=\"og:title\"].", "أضف og:title مطابقاً لعنوان الصفحة أو مخصصاً للمشاركة.", "Open Graph protocol"),
  },
  {
    id: "seo.viewport",
    category: "seo",
    evaluate: ({ document }) => document.querySelector('meta[name="viewport"]')?.getAttribute("content")?.trim() ? null : makeFinding("seo.viewport", "seo", "warning", "وسم viewport مفقود", "غياب viewport قد يضعف عرض الصفحة على الهواتف.", "لم نجد meta[name=\"viewport\"] بمحتوى.", "أضف <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">.", "MDN: viewport meta tag"),
  },
  {
    id: "seo.og-locale",
    category: "seo",
    evaluate: ({ document, containsArabic }) => {
      if (!containsArabic) return null;
      const locale = document.querySelector('meta[property="og:locale"]')?.getAttribute("content")?.trim();
      if (locale?.toLowerCase().startsWith("ar_")) return null;
      return makeFinding("seo.og-locale", "seo", "info", "لغة Open Graph العربية غير محددة", "تساعد og:locale منصات المشاركة على فهم لغة النسخة التي تشاركها.", locale ? `وجدنا og:locale بقيمة "${locale}".` : "لم نجد meta[property=\"og:locale\"].", "أضف og:locale عربياً مناسباً لنسختك، مثل ar_SA أو ar_EG، فقط عندما يكون مطابقاً للغة والمحتوى الفعليين.", "Open Graph protocol: locales");
    },
  },
  {
    id: "seo.hreflang-region",
    category: "seo",
    evaluate: ({ document }) => {
      const genericArabic = [...document.querySelectorAll('link[rel="alternate"][hreflang]')].find((link) => link.getAttribute("hreflang")?.toLowerCase() === "ar");
      if (!genericArabic) return null;
      return makeFinding("seo.hreflang-region", "seo", "info", "نسخة عربية عامة في hreflang", "القيمة ar صحيحة للنسخة العربية العامة، لكن النسخ الإقليمية المنفصلة تحتاج رموزاً إقليمية دقيقة عندما تكون فعلاً صفحات مختلفة.", "وجدنا hreflang=\"ar\".", "لا تغيّرها إذا كان لديك محتوى عربي موحّد. استخدم ar-SA أو ar-EG فقط إذا كنت تملك نسخاً إقليمية مستقلة ومتقابلة فعلاً.", "Google Search: localized versions");
    },
  },
  {
    id: "seo.local-business-basics",
    category: "seo",
    evaluate: ({ document, containsArabic }) => {
      if (!containsArabic) return null;
      const businesses = parseJsonLd(document).filter((item) => getType(item).some((type) => /localbusiness|organization|store|restaurant|professionalservice/i.test(type)));
      if (businesses.length === 0) return null;
      const incomplete = businesses.find((item) => {
        const business = item as { name?: unknown; address?: unknown; telephone?: unknown };
        return typeof business.name !== "string" || !business.name.trim() || !business.address || typeof business.telephone !== "string" || !business.telephone.trim();
      });
      if (!incomplete) return null;
      return makeFinding("seo.local-business-basics", "seo", "info", "بيانات النشاط المحلي تحتاج مراجعة", "إذا استعملت بيانات JSON-LD لنشاط محلي، فإن الاسم والعنوان ووسيلة تواصل واضحة تساعد في وصف الكيان بشكل متسق.", "وجدنا كائناً منظماً لنشاط أو مؤسسة لا يتضمن الاسم والعنوان والهاتف معاً.", "راجع بيانات JSON-LD وأضف فقط معلومات صحيحة ومتاحة للزوار. لا تضمن البيانات المنظمة الظهور في نتائج البحث.", "Google Search: Local business structured data");
    },
  },
];
