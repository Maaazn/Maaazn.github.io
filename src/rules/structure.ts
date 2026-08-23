import type { AuditRule } from "./types";
import { makeFinding } from "./types";

function cssEscape(value: string): string {
  return globalThis.CSS?.escape ? globalThis.CSS.escape(value) : value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

export const structureRules: AuditRule[] = [
  {
    id: "structure.h1",
    category: "structure",
    evaluate: ({ document }) => document.querySelectorAll("h1").length > 0 ? null : makeFinding("structure.h1", "structure", "warning", "العنوان الرئيسي H1 مفقود", "العنوان الرئيسي الواضح يساعد القارئ وتقنيات المساعدة على فهم موضوع الصفحة.", "لم نجد عنصر h1.", "اكتب عنواناً رئيسياً واحداً يلخص موضوع الصفحة بدقة.", "W3C: Headings"),
  },
  {
    id: "structure.heading-order",
    category: "structure",
    evaluate: ({ document }) => {
      let previous = 0;
      const skipped = [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")].find((heading) => {
        const level = Number(heading.tagName.slice(1));
        const issue = previous > 0 && level > previous + 1;
        previous = level;
        return issue;
      });
      return skipped ? makeFinding("structure.heading-order", "structure", "warning", "تسلسل العناوين يقفز مستوى", "ترتيب العناوين المتسق يحافظ على بنية مفهومة عند التنقل بقارئ الشاشة.", `وجدنا <${skipped.tagName.toLowerCase()}> بعد مستوى أعلى من دون المستوى الوسيط.`, "رتّب العناوين في تسلسل منطقي، ولا تستخدم مستوى العنوان لأجل المظهر فقط.", "W3C: Headings") : null;
    },
  },
  {
    id: "structure.image-alt",
    category: "structure",
    evaluate: ({ document }) => {
      const missing = [...document.querySelectorAll("img")].filter((image) => !image.hasAttribute("alt")).slice(0, 5);
      return missing.length ? makeFinding("structure.image-alt", "structure", "warning", "صور بلا نص بديل", "النص البديل يشرح الصورة عندما لا يمكن رؤيتها أو تحميلها.", `وجدنا ${missing.length} صورة بلا سمة alt (حتى خمسة أمثلة).`, "أضف alt موجزاً للصور ذات المعنى، واستخدم alt=\"\" للصور الزخرفية فقط.", "WCAG 2.2: Non-text content") : null;
    },
  },
  {
    id: "structure.image-alt-empty",
    category: "structure",
    evaluate: ({ document }) => {
      const ambiguous = [...document.querySelectorAll('a img[alt=""], figure img[alt=""]')].slice(0, 5);
      return ambiguous.length ? makeFinding("structure.image-alt-empty", "structure", "info", "صورة ذات دور محتمل بنص بديل فارغ", "alt الفارغ صحيح للصور الزخرفية، لكنه يحتاج مراجعة عندما تكون الصورة رابطاً أو داخل figure.", `وجدنا ${ambiguous.length} صورة مرتبطة أو داخل figure مع alt فارغ.`, "تأكد أنها زخرفية فعلاً؛ إن كانت تحمل معنى أو تفتح رابطاً، اكتب نصاً بديلاً موجزاً.", "WCAG 2.2: Non-text content") : null;
    },
  },
  {
    id: "structure.form-labels",
    category: "structure",
    evaluate: ({ document }) => {
      const unlabeled = [...document.querySelectorAll("input:not([type=hidden]), textarea, select")].filter((control) => {
        const id = control.getAttribute("id");
        const hasForLabel = Boolean(id && document.querySelector(`label[for="${cssEscape(id)}"]`));
        return !(hasForLabel || control.closest("label") || control.getAttribute("aria-label") || control.getAttribute("aria-labelledby"));
      }).slice(0, 5);
      return unlabeled.length ? makeFinding("structure.form-labels", "structure", "warning", "حقول نموذج بلا تسمية برمجية", "التسمية الصريحة تشرح غرض الحقل لقارئات الشاشة وللناس.", `وجدنا ${unlabeled.length} حقلاً بلا label أو aria-label (حتى خمسة أمثلة).`, "اربط كل حقل بـ<label for> أو وفّر aria-label واضحاً عند تعذر ذلك.", "WCAG 2.2: Labels or instructions") : null;
    },
  },
];
