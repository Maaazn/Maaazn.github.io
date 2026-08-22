# كاشِف / KashifWeb

**فاحص محلي الخصوصية لمصدر صفحات الويب العربية.** يحوّل HTML وCSS اللذين تختارهما إلى إشارات عملية عن العربية وRTL وSEO وبنية الصفحة، مع دليل مختصر وخطوة مراجعة.

> **Arabic-first, privacy-first web source checks.** KashifWeb analyzes the HTML/CSS you choose in your browser and turns Arabic/RTL, metadata, and document-structure signals into practical review steps.

## ما الذي يفعله؟ / What it does

| العربية | English |
|---|---|
| يفحص `lang` و`dir` وbidi وCSS المنطقي واتجاه الحقول. | Checks document language/direction, bidi signals, logical CSS, and form direction. |
| يراجع عنوان الصفحة والوصف وcanonical وOpen Graph و`hreflang`. | Reviews title, description, canonical, Open Graph, and `hreflang` signals. |
| يرصد بنية العناوين وبدائل الصور وتسميات الحقول. | Detects heading structure, image alternatives, and programmatic form labels. |
| يصدر JSON أو بطاقة ملخص محلية لا تتضمن المصدر المفحوص. | Exports JSON or a compact local summary card without the inspected source. |

## الحدود الصريحة / Explicit limits

يعمل الفحص محلياً ولا يرفع HTML أو CSS إلى خادم KashifWeb. فحص الرابط لا يعمل إلا عندما يسمح الموقع الهدف بالقراءة عبر CORS. النتائج إشارات قواعد للمراجعة وليست شهادة WCAG أو SEO أو أمان أو امتثال قانوني. لا يشغّل KashifWeb JavaScript من الصفحة المفحوصة، ولا يتجاوز الحماية، ولا يحتوي crawler أو API أو إعلانات مفعّلة.

KashifWeb runs locally and does not upload inspected HTML/CSS to a KashifWeb server. URL analysis requires the target to allow CORS. Findings are review signals—not accessibility, SEO, security, or legal certification. It does not execute inspected-page JavaScript, bypass protection, or include a crawler, API, or active ads.

## التشغيل / Run

```bash
pnpm install
pnpm dev
```

للتأكد من الجودة قبل المساهمة أو النشر:

```bash
pnpm check
```

## المشروع / Project

النسخة الحالية تحتوي قواعد TypeScript قابلة للاختبار وfixtures محلية وCI للبناء والاختبار. قبل مشاركة بطاقة تقرير، تأكد أن ملخصها مناسب للمشاركة؛ فهي لا تتضمن المصدر لكنها قد تعرض اسم المصدر وعدد النتائج وعناوينها.

The current release includes testable TypeScript rules, local fixtures, and CI for tests and builds. Before sharing a summary card, ensure its compact metadata is safe to share; it excludes source code but can include the source label, counts, and finding titles.

المصدر الأصلي تحت رخصة [MIT](LICENSE). راجع [LEGAL.md](LEGAL.md) و[SECURITY.md](SECURITY.md) قبل المساهمة أو الإبلاغ عن مشكلة.
