// KashifWeb design reminder: Arabic editorial laboratory; asymmetric evidence rail, warm paper, ink blue, one amber signal.
import "./styles.css";
import "./share.css";
import "./launch.css";
import { auditHtml } from "./audit/engine";
import type { AuditReport, Finding, FindingCategory } from "./audit/types";
import { articles } from "./content/articles";
import { createShareCardUrl, parseShareCard, type ShareCardPayload } from "./report/card";
import { saveReport } from "./pro/workspace";
import { compareReports, listSavedReports, removeReport } from "./pro/workspace";

const SAMPLE_HTML = `<!doctype html>
<html>
<head><title>صفحة تجريبية</title><style>.hero { margin-left: 24px; text-align: right; }</style></head>
<body><h1>أهلاً بك في موقعنا</h1><h3>عنوان فرعي غير متسلسل</h3><img src="visual.jpg"><input id="email" type="email"><p>راسلنا على hello@example.com أو https://example.com.</p></body>
</html>`;

function getAppRoot(): HTMLDivElement {
  const root = document.querySelector<HTMLDivElement>("#app");
  if (!root) throw new Error("KashifWeb root element was not found.");
  return root;
}

const app = getAppRoot();

let currentReport: AuditReport | null = null;
let currentMode: "html" | "url" = "html";
let auditRunId = 0;
const MAX_SOURCE_BYTES = 3 * 1024 * 1024;

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[character] ?? character);
}

function severityLabel(severity: Finding["severity"]): string {
  return ({ error: "يتطلب معالجة", warning: "تحسين مقترح", info: "ملاحظة سياقية" })[severity];
}

function categoryLabel(category: FindingCategory): string {
  return ({ rtl: "العربية وRTL", seo: "SEO والبيانات", structure: "بنية وإتاحة" })[category];
}

function introTemplate(): string {
  return `
    <header class="site-header">
      <a class="brand" href="#tool" aria-label="كاشف، الصفحة الرئيسية">
        <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663375486418/GnWCwyewMCIwZAWj.png" alt="" width="46" height="46" />
        <span><b>كاشِف</b><em>KashifWeb</em></span>
      </a>
      <nav aria-label="التنقل الرئيسي">
        <a href="#tool">الأداة</a>
        <a href="#pro">Pro</a>
        <a href="#method">المنهجية</a>
        <a href="#guides">الأدلة</a>
        <a href="#about">عن كاشف</a>
      </nav>
      <div class="header-actions"><a class="language-link" href="#en" lang="en" dir="ltr">English</a><a class="header-note" href="#privacy">محلي الخصوصية <span aria-hidden="true">↙</span></a></div>
    </header>
  `;
}

function renderLanding(): void {
  app.innerHTML = `
    <main id="tool">
      ${introTemplate()}
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow"><span></span> فحص محلي الخصوصية — إصدار تجريبي</p>
          <h1 id="hero-title">افهم صفحة الويب<br /><i>قبل</i> أن تنشرها.</h1>
          <p class="hero-lede">كاشِف يقرأ المصدر الذي تقدمه على جهازك، ويحوّل إشارات العربية وRTL وSEO وبنية الصفحة إلى دليل واضح وخطوة عملية.</p>
          <div class="hero-actions">
            <a class="button primary" href="#workspace">ابدأ بفحص مصدر <span aria-hidden="true">←</span></a>
            <a class="button plain" href="#method">كيف نصل إلى النتيجة؟</a>
          </div>
          <dl class="hero-facts">
            <div><dt>0</dt><dd>ملفات مرفوعة لخادم</dd></div>
            <div><dt>3</dt><dd>مسارات فحص أولية</dd></div>
            <div><dt>1</dt><dd>تقرير مفهوم لك وللفريق</dd></div>
          </dl>
        </div>
        <div class="hero-art" aria-hidden="true">
          <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663375486418/OCcWftmEgVsqbLkd.jpg" alt="" />
          <div class="paper-chip top"><span>RTL</span><b>لغة واتجاه</b></div>
          <div class="paper-chip bottom"><span>01</span><b>دليل، لا ادعاء</b></div>
        </div>
      </section>

      <section id="workspace" class="workspace" aria-labelledby="workspace-title">
        <aside class="evidence-rail">
          <p class="rail-kicker">غرفة الفحص</p>
          <h2 id="workspace-title">قدّم المصدر.<br />نقرأ الدليل.</h2>
          <p>لا ننشئ حساباً، ولا نخزن الكود، ولا نحاول تجاوز إعدادات الموقع.</p>
          <ol>
            <li><span>01</span> الصق HTML أو حمّل ملفاً</li>
            <li><span>02</span> أضف CSS إن كان منفصلاً</li>
            <li><span>03</span> صدّر النتيجة محلياً</li>
          </ol>
          <button class="sample-link" id="load-sample">حمّل مثالاً تعليمياً <span>←</span></button>
        </aside>
        <div class="workbench">
          <div class="mode-tabs" role="tablist" aria-label="مصدر الفحص">
            <button class="mode-tab active" data-mode="html" role="tab" aria-selected="true">HTML أو ملف</button>
            <button class="mode-tab" data-mode="url" role="tab" aria-selected="false">رابط عام <small>مشروط بـ CORS</small></button>
          </div>
          <div id="html-panel" class="input-panel">
            <label class="source-label" for="html-source">مصدر HTML</label>
            <textarea id="html-source" spellcheck="false" dir="ltr" placeholder="<!doctype html>\n<html lang=\"ar\" dir=\"rtl\">\n  ..."></textarea>
            <div class="source-tools">
              <label class="file-select" for="html-file"><input id="html-file" type="file" accept=".html,.htm,text/html" />اختر ملف HTML</label>
              <label class="css-optional" for="css-source">CSS اختياري<textarea id="css-source" dir="ltr" placeholder="ألصق CSS منفصلاً إن وجد"></textarea></label>
            </div>
          </div>
          <div id="url-panel" class="input-panel hidden">
            <label class="source-label" for="url-source">عنوان صفحة عام</label>
            <input id="url-source" type="url" dir="ltr" placeholder="https://example.com/page" />
            <p class="cors-note">سنحاول القراءة من المتصفح فقط. إذا لم يسمح الموقع بـ CORS، ستظهر لك الرسالة الصحيحة بدل تقرير ناقص.</p>
          </div>
          <div class="audit-actions">
            <button id="run-audit" class="button primary">حلّل المصدر <span aria-hidden="true">←</span></button>
            <p><span class="privacy-dot"></span> تبقى البيانات على جهازك</p>
          </div>
          <p id="audit-status" class="audit-status" role="status"></p>
        </div>
      </section>

      <section id="report" class="report-section" aria-live="polite">
        <div class="report-empty" id="report-empty">
          <span class="empty-index">00</span>
          <div><p class="eyebrow">ينتظر مصدراً</p><h2>لن تحصل على رقم غامض.</h2><p>سترى القاعدة والدليل والسبب وخطوة التصحيح. هذا مؤشر أولي، لا شهادة امتثال.</p></div>
        </div>
        <div id="report-output"></div>
      </section>

      <section id="method" class="method-section" aria-labelledby="method-title">
        <div class="method-visual"><img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663375486418/swbNKkMNAvfNWzFM.jpg" alt="أوراق دليل وأداة قياس في ترتيب تحريري" /></div>
        <div class="method-copy">
          <p class="eyebrow"><span></span> منهجية قابلة للقراءة</p>
          <h2 id="method-title">نبحث عن الإشارة<br />ثم نذكر حدودها.</h2>
          <p>القواعد محددة داخل المصدر. كل نتيجة تشير إلى ما رصدناه، ولماذا قد يؤثر، وما الذي تحتاج لمراجعته. لا نسمّي الفحص المحدود «امتثالاً كاملاً».</p>
          <div class="method-grid">
            <div><b>العربية وRTL</b><span>لغة المستند، الاتجاه، bidi، وCSS المنطقي.</span></div>
            <div><b>SEO والبيانات</b><span>العنوان والوصف وcanonical وOpen Graph وviewport.</span></div>
            <div><b>بنية وإتاحة</b><span>العناوين والصور والحقول القابلة للفهم.</span></div>
          </div>
          <a class="text-link" href="#guides">اقرأ الأدلة والمراجع <span>←</span></a>
        </div>
      </section>

      <section id="guides" class="guides-section" aria-labelledby="guides-title">
        <div class="section-heading"><p class="eyebrow">مكتبة صغيرة، لا حشو</p><h2 id="guides-title">أدلة تُراجع قبل أن تُتّبع.</h2></div>
        <div class="article-list">${articles.map((article, index) => `
          <button class="article-card" data-article="${article.slug}"><span>0${index + 1}</span><h3>${article.title}</h3><p>${article.summary}</p><i>اقرأ الدليل ←</i></button>
        `).join("")}</div>
      </section>

      <section id="about" class="about-section">
        <p class="eyebrow"><span></span> عن المشروع</p>
        <h2>أداة صغيرة<br />تقول ما تعرفه فقط.</h2>
        <div class="about-columns">
          <p>كاشف مشروع مفتوح التجربة للمطورين الذين يريدون فهماً عملياً للمصدر قبل النشر. النسخة الأولى تعمل محلياً في المتصفح، ولا تعتمد على حساب أو تجميع للكود.</p>
          <div><a href="#privacy">الخصوصية</a><a href="#terms">الشروط</a><a href="#methodology">المنهجية الكاملة</a><a href="#contact">التواصل</a></div>
        </div>
      </section>

      <section id="pro" class="pro-section" aria-labelledby="pro-title">
        <div class="pro-mark" aria-hidden="true">P/01</div>
        <div class="pro-copy">
          <p class="eyebrow"><span></span> مساحة عمل مدفوعة — قيد الإعداد</p>
          <h2 id="pro-title">ليس جداراً فوق<br />فحص <i>مجاني</i>.</h2>
          <p>سيبقى الفحص المحلي الأساسي متاحاً بلا حساب. كاشف Pro يضيف مساراً منفصلاً للمطور الذي يحتاج خطاً زمنياً للمراجعات، مقارنة بين النتائج، وملفات قواعد قابلة للتكرار.</p>
          <a class="button plain" href="#pro-workspace">جرّب نموذج مساحة العمل <span aria-hidden="true">←</span></a>
        </div>
        <div class="pro-status" id="pro-details">
          <p class="status-label">حالة الاشتراك</p>
          <strong>قيد التحضير</strong>
          <p>لا يوجد رابط شراء أو تسليم مدفوع في هذه النسخة. لن نفتح الاشتراك قبل اختبار المزايا، وسياسة الاسترداد، وتسليم الوصول.</p>
          <ul><li>مشاريع وتقارير محفوظة</li><li>مقارنة baseline بين التقارير</li><li>ملفات قواعد عربية قابلة للتكرار</li></ul>
        </div>
      </section>
    </main>
    <footer class="site-footer"><span>كاشِف / KashifWeb</span><span>مصدر محلي. نتائج قابلة للمراجعة.</span><span>© 2026</span></footer>
  `;
  bindLandingEvents();
}

function renderReport(report: AuditReport): void {
  const output = document.querySelector<HTMLDivElement>("#report-output");
  const empty = document.querySelector<HTMLElement>("#report-empty");
  if (!output || !empty) return;
  empty.classList.add("hidden");
  const grouped = (["rtl", "seo", "structure"] as FindingCategory[]).map((category) => ({ category, items: report.findings.filter((finding) => finding.category === category) }));
  const errors = report.findings.filter((finding) => finding.severity === "error").length;
  const warnings = report.findings.filter((finding) => finding.severity === "warning").length;
  output.innerHTML = `
    <div class="report-head">
      <div><p class="eyebrow">تقرير محلي — ${escapeHtml(report.sourceLabel)}</p><h2>دليل الصفحة،<br />مرتب حسب الأولوية.</h2><p class="report-timestamp">أُنشئ في ${new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.generatedAt))} · حزمة القواعد ${report.rulePackVersion} · ${report.analysisDurationMs}ms محلياً</p></div>
      <div class="index-panel"><span>مؤشر مبدئي</span><strong>${report.initialIndex}</strong><small>ليس تصنيفاً خارجياً</small></div>
    </div>
    <div class="report-summary"><span><b>${errors}</b> تتطلب معالجة</span><span><b>${warnings}</b> تحسينات مقترحة</span><span><b>${report.findings.length}</b> إشارة مرصودة</span><button id="download-report">صدّر JSON <span>↓</span></button><button id="print-report" class="secondary-action">اطبع التقرير <span>↙</span></button><button id="copy-share-card" class="secondary-action">انسخ بطاقة ملخص <span>↗</span></button><button id="save-workspace" class="secondary-action">احفظ للمقارنة <span>＋</span></button></div>
    <div class="findings-groups">${grouped.map(({ category, items }) => `
      <section class="finding-group"><div class="group-title"><span>${categoryLabel(category)}</span><b>${String(items.length).padStart(2, "0")}</b></div>
        ${items.length ? items.map((finding) => findingTemplate(finding)).join("") : `<p class="group-clear">لم يرصد كاشف قاعدة من هذه الفئة في المصدر المقدم.</p>`}
      </section>
    `).join("")}</div>
    <aside class="limits"><b>حدود هذا التقرير</b><ul>${report.limitations.map((limitation) => `<li>${escapeHtml(limitation)}</li>`).join("")}</ul></aside>
  `;
  document.querySelector<HTMLButtonElement>("#download-report")?.addEventListener("click", () => downloadReport(report));
  document.querySelector<HTMLButtonElement>("#print-report")?.addEventListener("click", () => window.print());
  document.querySelector<HTMLButtonElement>("#copy-share-card")?.addEventListener("click", () => { void copyShareCard(report); });
  document.querySelector<HTMLButtonElement>("#save-workspace")?.addEventListener("click", () => saveCurrentReportToWorkspace(report));
}

function saveCurrentReportToWorkspace(report: AuditReport): void {
  const status = document.querySelector<HTMLElement>("#audit-status");
  const label = report.sourceLabel === "مصدر HTML محلي" ? `مراجعة محلية — ${new Intl.DateTimeFormat("ar-SA", { dateStyle: "short", timeStyle: "short" }).format(new Date())}` : report.sourceLabel;
  try {
    saveReport(report, label);
    if (status) status.textContent = "حُفظ ملخص التقرير محلياً في مساحة العمل. لا يُحفظ HTML أو CSS الذي فُحص.";
  } catch (error) {
    if (status) status.textContent = error instanceof Error ? error.message : "تعذر حفظ التقرير محلياً.";
  }
}

function findingTemplate(finding: Finding): string {
  return `<article class="finding severity-${finding.severity}"><div class="finding-flag"><span>${severityLabel(finding.severity)}</span><b>${finding.id}</b></div><div class="finding-body"><h3>${finding.title}</h3><p>${finding.rationale}</p><blockquote><b>الدليل</b>${escapeHtml(finding.evidence)}</blockquote><div class="recommendation"><b>التصحيح العملي</b><span>${finding.recommendation}</span></div><small>مرجع: ${finding.reference}</small></div></article>`;
}

function downloadReport(report: AuditReport): void {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = "kashifweb-report.json";
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

async function copyShareCard(report: AuditReport): Promise<void> {
  const status = document.querySelector<HTMLElement>("#audit-status");
  try {
    const url = createShareCardUrl(report);
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
    else window.prompt("انسخ رابط البطاقة المحلي:", url);
    if (status) status.textContent = "نُسخ رابط البطاقة. يحتوي على ملخص التقرير فقط، ولا يحتوي على HTML أو CSS الذي قدمته.";
  } catch (error) {
    if (status) status.textContent = error instanceof Error ? error.message : "تعذر إنشاء بطاقة المشاركة المحلية.";
  }
}

function renderShareCard(payload: ShareCardPayload): void {
  const date = new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(payload.generatedAt));
  app.innerHTML = `<main class="share-page">${introTemplate()}<article class="share-card"><a class="back-link" href="#tool">← العودة إلى كاشف</a><p class="eyebrow"><span></span> بطاقة محلية قابلة للمشاركة</p><h1>ملخص تقرير كاشف</h1><p class="article-summary">هذه البطاقة تعرض ملخصاً اختاره صاحب التقرير للمشاركة. لا تحتوي على مصدر HTML أو CSS المفحوص.</p><div class="share-index"><div><b>${escapeHtml(payload.sourceLabel)}</b><p class="report-timestamp">أُنشئ في ${date}</p></div><strong>${payload.initialIndex}</strong></div><div class="share-counts"><span>${payload.counts.error} تتطلب معالجة</span><span>${payload.counts.warning} تحسينات</span><span>${payload.counts.info} ملاحظات</span><span>${payload.totalFindings} إشارة</span></div><ol class="share-findings">${payload.topFindings.map((finding) => `<li><b>${escapeHtml(finding.id)} · ${severityLabel(finding.severity)}</b><span>${escapeHtml(finding.title)}</span></li>`).join("")}</ol><p class="share-disclosure">المؤشر ترتيب محلي لقواعد محددة، وليس تصنيفاً خارجياً أو شهادة امتثال أو SEO أو أمان.</p></article></main><footer class="site-footer"><span>كاشِف / KashifWeb</span><span>بطاقة محلية من دون خادم</span><span>© 2026</span></footer>`;
}

function openArticle(slug: string): void {
  const article = articles.find((item) => item.slug === slug);
  if (!article) return;
  app.innerHTML = `<main class="article-page">${introTemplate()}<article><a class="back-link" href="#guides">← العودة إلى الأدلة</a><p class="eyebrow">دليل من كاشف</p><h1>${article.title}</h1><p class="article-summary">${article.summary}</p><p class="article-meta">مراجع في: ${article.reviewedAt}</p>${article.body.map((paragraph) => `<p>${paragraph}</p>`).join("")}<section class="sources"><h2>المراجع</h2><ol>${article.sources.map((source) => `<li><a href="${source.href}" target="_blank" rel="noreferrer">${source.label} <span aria-hidden="true">↗</span></a></li>`).join("")}</ol></section></article></main><footer class="site-footer"><span>كاشِف / KashifWeb</span><span>مصدر محلي. نتائج قابلة للمراجعة.</span><span>© 2026</span></footer>`;
}

function renderEnglishPage(): void {
  document.documentElement.lang = "en";
  document.documentElement.dir = "ltr";
  app.innerHTML = `<main class="english-page" lang="en" dir="ltr">
    <header class="english-header"><a class="brand" href="#tool" aria-label="KashifWeb home"><img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663375486418/GnWCwyewMCIwZAWj.png" alt="" width="46" height="46" /><span><b>KashifWeb</b><em>كاشِف</em></span></a><nav><a href="#tool">Arabic workspace</a><a href="#pro">Pro</a><a href="#method">Method</a><a href="#guides">Guides</a><a href="#privacy">Privacy</a></nav><a class="language-link" href="#tool" lang="ar" dir="rtl">العربية</a></header>
    <section class="english-hero"><p class="eyebrow"><span></span> Arabic-first source review</p><h1>Make Arabic web quality<br /><i>legible</i> before release.</h1><p>KashifWeb is a local, evidence-led review workspace for the HTML and CSS you choose. It identifies practical Arabic/RTL, metadata, and document-structure signals without uploading your source by default.</p><div class="hero-actions"><a class="button primary" href="#tool">Open the Arabic workspace <span aria-hidden="true">→</span></a><a class="button plain" href="#method">See the method</a></div></section>
    <section class="english-principles"><div><span>01</span><h2>Local by default</h2><p>Paste source or choose a file. Analysis happens in your browser. URL mode reads only what the target deliberately makes available through CORS.</p></div><div><span>02</span><h2>Rules, not theatre</h2><p>Each finding includes a detected signal, a reason, an actionable repair path, and an explicit boundary. The local index is never presented as an external ranking.</p></div><div><span>03</span><h2>Arabic-aware engineering</h2><p>Direction, language declaration, bidi context, logical CSS, form direction, Arabic locale metadata, and local-business data are reviewed alongside essential page structure.</p></div></section>
    <section class="english-workflow"><div><p class="eyebrow"><span></span> How the review works</p><h2>A short path from source<br />to an informed next step.</h2></div><ol><li><b>Bring a source</b><span>Choose an HTML file, paste source, and optionally include separate CSS.</span></li><li><b>Read the evidence</b><span>Review findings grouped by Arabic/RTL, metadata, and document structure.</span></li><li><b>Export intentionally</b><span>Download JSON, print the local report, or share a compact card that excludes inspected HTML and CSS.</span></li></ol></section>
    <section class="english-boundary"><h2>What KashifWeb does not claim.</h2><p>It is not a crawler, a WCAG certification, a security audit, a search-ranking predictor, or a substitute for testing the rendered page in target browsers. It does not execute inspected-page scripts, bypass CORS, or collect source code in its primary flow.</p></section>
    <section class="english-pro"><p class="eyebrow"><span></span> Pro workspace — in preparation</p><h2>Paid work must deliver a real workflow.</h2><p>KashifWeb Pro is being prepared as a private workspace for saved review projects, baseline comparison and repeatable Arabic-first rule profiles. The free local audit remains available without an account. No checkout is live until the Pro workflow and delivery path are tested.</p><a class="button plain" href="#pro">Read the Arabic Pro outline <span aria-hidden="true">→</span></a></section>
  </main><footer class="site-footer"><span>KashifWeb / كاشِف</span><span>Local source. Reviewable evidence.</span><span>© 2026</span></footer>`;
}

function renderProWorkspace(): void {
  document.documentElement.lang = "ar";
  document.documentElement.dir = "rtl";
  const saved = listSavedReports();
  const options = saved.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)} — ${new Intl.DateTimeFormat("ar-SA", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.savedAt))}</option>`).join("");
  app.innerHTML = `<main class="pro-workspace-page">${introTemplate()}<section class="workspace-head"><p class="eyebrow"><span></span> نموذج مساحة Pro — محلي على هذا الجهاز</p><h1>قارن ما تغيّر.<br /><i>ولا ترفع المصدر.</i></h1><p>هذه مساحة تجريبية لحفظ ملخصات التقارير ومقارنتها. لا تنشئ حساباً، ولا تحفظ HTML أو CSS، ولا تمثّل اشتراكاً مدفوعاً مفتوحاً بعد.</p><a class="button plain" href="#tool">← العودة إلى الفحص</a></section><section class="workspace-history"><div><p class="eyebrow">محفوظ محلياً</p><h2>${saved.length} مراجعة${saved.length === 1 ? "" : "ات"}</h2><p>احفظ تقريراً من صفحة الفحص لتبدأ خطاً زمنياً للمراجعات على هذا الجهاز.</p></div><div class="history-list">${saved.length ? saved.map((item) => `<article><div><b>${escapeHtml(item.label)}</b><span>${item.report.findings.length} إشارة · ${item.report.initialIndex}/100</span></div><button data-delete-report="${escapeHtml(item.id)}">حذف</button></article>`).join("") : `<p class="empty-workspace">لا توجد مراجعات محفوظة بعد.</p>`}</div></section>${saved.length > 1 ? `<section class="baseline-compare"><p class="eyebrow"><span></span> مقارنة baseline</p><h2>افهم ما ظهر وما حُل.</h2><div class="compare-controls"><label>الأساس<select id="baseline-report">${options}</select></label><label>المراجعة الأحدث<select id="current-report">${options}</select></label><button id="compare-reports" class="button primary">قارن التقريرين <span>←</span></button></div><div id="compare-output" class="compare-output"><p>اختر تقريرين ثم اطلب المقارنة.</p></div></section>` : ""}</main><footer class="site-footer"><span>كاشِف / KashifWeb</span><span>مساحة محلية من دون خادم</span><span>© 2026</span></footer>`;
  document.querySelectorAll<HTMLButtonElement>("[data-delete-report]").forEach((button) => button.addEventListener("click", () => {
    if (!window.confirm("حذف هذا الملخص المحلي؟ لا يمكن استعادته.")) return;
    removeReport(button.dataset.deleteReport ?? "");
    renderProWorkspace();
  }));
  document.querySelector<HTMLButtonElement>("#compare-reports")?.addEventListener("click", () => {
    const baselineId = document.querySelector<HTMLSelectElement>("#baseline-report")?.value;
    const currentId = document.querySelector<HTMLSelectElement>("#current-report")?.value;
    const baseline = saved.find((item) => item.id === baselineId);
    const current = saved.find((item) => item.id === currentId);
    const output = document.querySelector<HTMLElement>("#compare-output");
    if (!output || !baseline || !current) return;
    if (baseline.id === current.id) { output.innerHTML = "<p>اختر تقريرين مختلفين لتظهر المقارنة.</p>"; return; }
    const delta = compareReports(baseline.report, current.report);
    const renderIds = (ids: string[]) => ids.length ? `<ul>${ids.map((id) => `<li>${escapeHtml(id)}</li>`).join("")}</ul>` : "<p>لا توجد عناصر.</p>";
    output.innerHTML = `<article><span>إشارات جديدة <b>${delta.newFindings.length}</b></span>${renderIds(delta.newFindings)}</article><article><span>إشارات حُلّت <b>${delta.resolvedFindings.length}</b></span>${renderIds(delta.resolvedFindings)}</article><article><span>إشارات مستمرة <b>${delta.persistentFindings.length}</b></span>${renderIds(delta.persistentFindings)}</article>`;
  });
}

function openUtilityPage(page: string): void {
  const copy: Record<string, { kicker: string; title: string; paragraphs: string[] }> = {
    privacy: { kicker: "الخصوصية", title: "الملف يبقى حيث وضعته.", paragraphs: ["يعالج كاشف HTML وCSS في المتصفح المحلي. لا يرسل المصدر إلى خادم في مسار الفحص الأساسي، ولا ينشئ حسابات أو يضيف أدوات تحليلات في هذه النسخة.", "إذا استخدمت فحص URL، يرسل المتصفح طلب قراءة عادي إلى الرابط الذي اخترته أنت. النتيجة تعتمد على CORS؛ لا نتجاوز إعدادات الموقع المستهدف."] },
    terms: { kicker: "الشروط", title: "نتائج مساعدة، لا شهادة.", paragraphs: ["كاشف أداة تعليمية تقنية. نتائجه مؤشرات قواعد وليست استشارة قانونية أو أمنية أو شهادة امتثال أو وعداً بالترتيب أو قبول الإعلانات.", "أنت مسؤول عن مراجعة التغييرات واختبارها قبل النشر، وعن امتلاك الحق في تحليل المصدر الذي تقدمه."] },
    methodology: { kicker: "المنهجية", title: "قاعدة، دليل، مراجعة.", paragraphs: ["تعمل النسخة الأولى عبر DOMParser وقواعد حتمية مفتوحة داخل المستودع. تفحص إشارات محددة في المصدر ولا تنفذ JavaScript الناتج عن الصفحة ولا تحاكي زاحف بحث.", "نعرض الدليل المختصر والتوصية والمرجع لكل نتيجة، ونذكر حدود التحليل داخل التقرير نفسه."] },
    contact: { kicker: "التواصل", title: "التجربة هي بداية الحوار.", paragraphs: ["للتغذية الراجعة أو الإبلاغ عن خطأ، افتح issue في مستودع المشروع عند إتاحته علناً. لا تجمع هذه النسخة أسماء أو عناوين بريد داخل الأداة."] },
  };
  const item = copy[page];
  if (!item) return;
  app.innerHTML = `<main class="article-page utility-page">${introTemplate()}<article><a class="back-link" href="#tool">← العودة للأداة</a><p class="eyebrow">${item.kicker}</p><h1>${item.title}</h1>${item.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}</article></main><footer class="site-footer"><span>كاشِف / KashifWeb</span><span>مصدر محلي. نتائج قابلة للمراجعة.</span><span>© 2026</span></footer>`;
}

function bindLandingEvents(): void {
  document.querySelectorAll<HTMLButtonElement>(".mode-tab").forEach((button) => button.addEventListener("click", () => {
    currentMode = button.dataset.mode === "url" ? "url" : "html";
    document.querySelectorAll(".mode-tab").forEach((tab) => { const active = tab === button; tab.classList.toggle("active", active); tab.setAttribute("aria-selected", String(active)); });
    document.querySelector("#html-panel")?.classList.toggle("hidden", currentMode !== "html");
    document.querySelector("#url-panel")?.classList.toggle("hidden", currentMode !== "url");
  }));
  document.querySelector<HTMLButtonElement>("#load-sample")?.addEventListener("click", () => {
    const source = document.querySelector<HTMLTextAreaElement>("#html-source");
    if (source) source.value = SAMPLE_HTML;
    document.querySelector<HTMLButtonElement>('[data-mode="html"]')?.click();
    document.querySelector("#workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.querySelector<HTMLInputElement>("#html-file")?.addEventListener("change", async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    const source = document.querySelector<HTMLTextAreaElement>("#html-source");
    const status = document.querySelector<HTMLElement>("#audit-status");
    if (!file || !source) return;
    if (file.size > MAX_SOURCE_BYTES) {
      if (status) status.textContent = "الملف أكبر من حد الفحص المحلي (3MB). صغّر المصدر أو افحص الجزء الذي تعمل عليه.";
      return;
    }
    source.value = await file.text();
    if (status) status.textContent = `تم تحميل ${file.name} محلياً (${Math.ceil(file.size / 1024)}KB).`;
  });
  document.querySelector<HTMLButtonElement>("#run-audit")?.addEventListener("click", () => { void runAudit(); });
  document.querySelectorAll<HTMLButtonElement>(".article-card").forEach((button) => button.addEventListener("click", () => openArticle(button.dataset.article ?? "")));
}

async function runAudit(): Promise<void> {
  const status = document.querySelector<HTMLElement>("#audit-status");
  const button = document.querySelector<HTMLButtonElement>("#run-audit");
  if (!status || !button) return;
  button.disabled = true;
  const thisRun = ++auditRunId;
  status.textContent = "نقرأ الدليل المحلي…";
  try {
    if (currentMode === "html") {
      const html = document.querySelector<HTMLTextAreaElement>("#html-source")?.value.trim() ?? "";
      const css = document.querySelector<HTMLTextAreaElement>("#css-source")?.value.trim() ?? "";
      if (!html) throw new Error("ألصق HTML أو اختر ملفاً قبل بدء الفحص.");
      if (new Blob([html, css]).size > MAX_SOURCE_BYTES) throw new Error("يتجاوز المصدر وCSS حد الفحص المحلي (3MB). افحص جزءاً أصغر أو ملفاً مقسماً.");
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      if (thisRun !== auditRunId) return;
      currentReport = auditHtml(html, css, "مصدر HTML محلي");
    } else {
      const url = document.querySelector<HTMLInputElement>("#url-source")?.value.trim() ?? "";
      if (!url) throw new Error("اكتب رابطاً عاماً كاملاً يبدأ بـ https://.");
      status.textContent = "نحاول القراءة وفق إعدادات CORS للموقع…";
      const response = await fetch(url, { mode: "cors", redirect: "follow" });
      if (!response.ok) throw new Error(`قرأ المتصفح الاستجابة لكن الخادم أعاد الحالة ${response.status}.`);
      const html = await response.text();
      currentReport = auditHtml(html, "", new URL(url).hostname);
    }
    if (thisRun !== auditRunId) return;
    renderReport(currentReport);
    status.textContent = "اكتمل التقرير محلياً. راجع الدليل قبل تعديل المصدر.";
    document.querySelector("#report")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "حدث تعذر غير معروف.";
    const isLikelyCors = currentMode === "url" && /Failed to fetch|NetworkError/i.test(message);
    status.textContent = isLikelyCors ? "لم يسمح الموقع للمتصفح بقراءة المصدر عبر CORS. نزّل HTML أو الصقه هنا للحصول على تقرير محلي كامل." : message;
  } finally {
    button.disabled = false;
  }
}

function route(): void {
  const hash = location.hash.replace(/^#/, "") || "tool";
  const card = parseShareCard(hash);
  if (card) renderShareCard(card);
  else if (hash === "en") renderEnglishPage();
  else if (hash === "pro") { renderLanding(); window.setTimeout(() => document.querySelector("#pro")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0); }
  else if (hash === "pro-workspace") renderProWorkspace();
  else if (hash.startsWith("guide/")) openArticle(hash.split("/")[1]);
  else if (["privacy", "terms", "methodology", "contact"].includes(hash)) openUtilityPage(hash);
  else { document.documentElement.lang = "ar"; document.documentElement.dir = "rtl"; renderLanding(); }
}

window.addEventListener("hashchange", route);
route();
