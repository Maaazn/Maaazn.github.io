// KashifWeb design reminder: Arabic editorial laboratory; asymmetric evidence rail, warm paper, ink blue, one amber signal.
import "./styles.css";
import "./share.css";
import "./launch.css";
import "./pro-access.css";
import "./pro-sync.css";
import { auditHtml, rulePack } from "./audit/engine";
import { buildActionPlan } from "./audit/action-plan";
import type { AuditReport, Finding, FindingCategory } from "./audit/types";
import { articles } from "./content/articles";
import { createShareCardUrl, parseShareCard, type ShareCardPayload } from "./report/card";
import { buildWorkspaceInsight } from "./pro/insights";
import { clearProSession, currentProSession, requestProSession } from "./pro/entitlement";
import { syncWorkspace } from "./pro/sync";
import { compareReports, listSavedReports, saveReport } from "./pro/workspace";

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
const PRO_PURCHASE_URL = "https://ghhhyyy.gumroad.com/l/iamkd?wanted=true";
let proSession = currentProSession();

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[character] ?? character);
}

function severityLabel(severity: Finding["severity"]): string {
  return ({ error: "يتطلب معالجة", warning: "تحسين مقترح", info: "ملاحظة سياقية" })[severity];
}

function categoryLabel(category: FindingCategory): string {
  return ({ rtl: "العربية وRTL", seo: "SEO والبيانات", structure: "بنية الصفحة", accessibility: "الإتاحة", performance: "الأداء" })[category];
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
	        <a href="#readiness">جاهزية النشر</a>
	        <a href="#pro">Pro</a>
	        <a href="#method">المنهجية</a>
        <a href="#guides">الأدلة</a>
        <a href="#about">عن كاشف</a>
      </nav>
      <div class="header-actions"><a class="language-link" href="#en" lang="en" dir="ltr">English</a><a class="header-note" href="#privacy">محلي الخصوصية <span aria-hidden="true">↙</span></a></div>
    </header>
  `;
}

function proWorkspaceTemplate(): string {
  const saved = listSavedReports();
  const insight = buildWorkspaceInsight(saved);
  const active = Boolean(proSession);
  return `
    <section id="pro" class="pro-section pro-workspace-section" aria-labelledby="pro-title">
      <div class="pro-mark" aria-hidden="true">P/02</div>
      <div class="pro-copy">
        <p class="eyebrow"><span></span> مساحة Pro — تاريخ، مقارنة، مزامنة</p>
        <h2 id="pro-title">لا تراجع النتيجة وحدها.<br />راجع <i>اتجاهها</i>.</h2>
        <p>Pro يبني فوق التقارير التي حفظتها: يقارن اللقطات، يوضح ما حُلّ وما ظهر، ويزامن ملخصات الأدلة فقط بين جلساتك. لا يرفع HTML أو CSS أو مفتاح Gumroad.</p>
        <div class="pro-feature-list"><span>مقارنة قبل/بعد</span><span>سجل محلي حتى 18 تقريراً</span><span>مزامنة 30 ملخصاً</span><span>تصدير وخطة إصلاح</span></div>
      </div>
      <div class="pro-status" id="pro-workspace-panel">
        <p class="status-label">${active ? "وصول Pro نشط" : "ابدأ من تقريرك الأول"}</p>
        <strong>${insight.savedCount ? `${insight.savedCount} تقرير محفوظ` : "لا توجد لقطة محفوظة بعد."}</strong>
        <p>${insight.latestLabel ? `أحدث لقطة: ${escapeHtml(insight.latestLabel)} · المؤشر ${insight.latestIndex}` : "احفظ تقريراً من نتيجة الفحص لتنشئ خط أساس للمقارنة."}</p>
        ${insight.delta ? `<ul class="pro-delta"><li><b>${insight.delta.resolved}</b> إشارة حُلّت</li><li><b>${insight.delta.introduced}</b> إشارة جديدة</li><li><b>${insight.delta.persistent}</b> إشارة مستمرة</li></ul>` : ""}
        ${active ? `
          ${proHistoryTemplate()}
          <button id="pro-sync" class="button primary">زامن ملخصات مساحة العمل <span aria-hidden="true">↻</span></button>
          <button id="pro-signout" class="text-button">إنهاء جلسة Pro على هذا الجهاز</button>
        ` : `
          <a class="button primary" href="${PRO_PURCHASE_URL}" target="_blank" rel="noreferrer">افتح ترخيص Pro <span aria-hidden="true">↗</span></a>
          <form class="pro-access-form" id="pro-access-form">
            <label for="pro-license-key">لديك ترخيص بالفعل؟</label>
            <div><input id="pro-license-key" type="password" autocomplete="off" placeholder="ألصق مفتاح Gumroad هنا" /><button class="button" type="submit">فعّل Pro</button></div>
            <p>يتحقق المفتاح عبر المزود ثم نحفظ جلسة قصيرة على هذا الجهاز فقط. لا يُحفظ المفتاح داخل المتصفح.</p>
          </form>
        `}
        <p id="pro-status" class="pro-runtime-status"></p>
      </div>
    </section>
  `;
}

function reportOptionLabel(label: string, savedAt: string, index: number): string {
  const date = new Intl.DateTimeFormat("ar-SA", { dateStyle: "short" }).format(new Date(savedAt));
  return `${label} · ${date} · ${index}`;
}

function findingChangeList(ids: string[], reports: ReturnType<typeof listSavedReports>): string {
  if (!ids.length) return `<p class="pro-change-empty">لا توجد نتائج ضمن هذه الفئة بين اللقطتين.</p>`;
  const titles = new Map(reports.flatMap((item) => item.report.findings.map((finding) => [finding.id, finding.title])));
  return `<ul>${ids.slice(0, 5).map((id) => `<li><b>${escapeHtml(id)}</b><span>${escapeHtml(titles.get(id) ?? "إشارة من حزمة القواعد")}</span></li>`).join("")}${ids.length > 5 ? `<li><span>و${ids.length - 5} إشارات إضافية.</span></li>` : ""}</ul>`;
}

function comparisonResultTemplate(baselineId: string, currentId: string): string {
  const saved = listSavedReports();
  const baseline = saved.find((item) => item.id === baselineId);
  const current = saved.find((item) => item.id === currentId);
  if (!baseline || !current || baseline.id === current.id) return `<p class="pro-change-empty">اختر لقطتين مختلفتين لقراءة التغيّر بينهما.</p>`;
  const delta = compareReports(baseline.report, current.report);
  return `<div class="pro-change-columns"><article><p><b>${delta.resolvedFindings.length}</b> حُلّت</p>${findingChangeList(delta.resolvedFindings, saved)}</article><article><p><b>${delta.newFindings.length}</b> ظهرت</p>${findingChangeList(delta.newFindings, saved)}</article><article><p><b>${delta.persistentFindings.length}</b> مستمرة</p>${findingChangeList(delta.persistentFindings, saved)}</article></div>`;
}

function proHistoryTemplate(): string {
  const saved = listSavedReports();
  if (!saved.length) return `<p class="pro-unlocked-note">فعّل الوصول الآن، ثم احفظ تقريراً محلياً لتبدأ مساحة التاريخ.</p>`;
  const latest = saved[0];
  const baseline = saved[1] ?? latest;
  return `<div class="pro-history" aria-label="مقارنة التقارير المحفوظة">
    <p class="pro-unlocked-note">مساحة Pro نشطة على هذا الجهاز. قارن ملخصات اللقطات المحفوظة محلياً قبل مزامنتها اختيارياً.</p>
    ${saved.length > 1 ? `<div class="pro-compare-controls"><label for="pro-baseline">خط الأساس<select id="pro-baseline">${saved.map((item) => `<option value="${item.id}"${item.id === baseline.id ? " selected" : ""}>${escapeHtml(reportOptionLabel(item.label, item.savedAt, item.report.initialIndex))}</option>`).join("")}</select></label><label for="pro-current">اللقطة اللاحقة<select id="pro-current">${saved.map((item) => `<option value="${item.id}"${item.id === latest.id ? " selected" : ""}>${escapeHtml(reportOptionLabel(item.label, item.savedAt, item.report.initialIndex))}</option>`).join("")}</select></label><button id="pro-compare" class="button" type="button">قارن اللقطتين</button></div><div id="pro-comparison-result" class="pro-comparison-result">${comparisonResultTemplate(baseline.id, latest.id)}</div>` : `<p class="pro-unlocked-note">لديك لقطة واحدة. احفظ تقريراً ثانياً بعد تعديل المصدر لتظهر المقارنة التفصيلية هنا.</p>`}
    <ol class="pro-history-list">${saved.slice(0, 5).map((item) => `<li><span>${escapeHtml(item.label)}</span><b>${item.report.initialIndex}</b><small>${new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(item.savedAt))}</small></li>`).join("")}</ol>
  </div>`;
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
            <div><dt>${rulePack.length}</dt><dd>قواعد معلنة</dd></div>
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
            <textarea id="html-source" spellcheck="false" dir="ltr" placeholder='<!doctype html>\n<html lang="ar" dir="rtl">\n  ...'></textarea>
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

      <section id="readiness" class="pro-section" aria-labelledby="readiness-title">
        <div class="pro-mark" aria-hidden="true">P/01</div>
        <div class="pro-copy">
          <p class="eyebrow"><span></span> قبل طلب أي مراجعة خارجية</p>
          <h2 id="readiness-title">اجعل الصفحة مفيدة<br />قبل أن تطلب <i>الثقة</i>.</h2>
          <p>ابدأ بتقرير محلي، أصلح الدليل الذي يظهر لك، ثم اختبر الصفحة المنشورة على الهاتف وسطح المكتب. لا يختصر كاشف هذا المسار ولا يحوّل مؤشره إلى شهادة أو وعد بقبول إعلان أو تصنيف.</p>
          <a class="button plain" href="#guides">ابدأ بدليل عملي <span aria-hidden="true">←</span></a>
        </div>
        <div class="pro-status" id="readiness-details">
          <p class="status-label">مسار مراجعة واقعي</p>
          <strong>لا تطلب مراجعة قبل اكتمال الصفحة.</strong>
          <p>استخدم هذا التسلسل كقائمة عمل، وليس كضمان من أي منصة خارجية.</p>
          <ul><li>قدّم محتوى أصلياً يشرح مشكلة أو قراراً تقنياً مفيداً.</li><li>اختبر التنقل والقراءة على الهاتف وسطح المكتب.</li><li>أضف الخصوصية والشروط والتواصل، ثم راجع الدليل داخل التقرير.</li></ul>
	          <p class="pro-price">الفحص المحلي وحفظ اللقطات وخطة الإصلاح متاحان بلا حساب. Pro يضيف المقارنة المرئية بين اللقطات والمزامنة الاختيارية لملخصاتها.</p>
        </div>
      </section>
      ${proWorkspaceTemplate()}
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
  const grouped = (["rtl", "seo", "structure", "accessibility", "performance"] as FindingCategory[]).map((category) => ({ category, items: report.findings.filter((finding) => finding.category === category) }));
  const errors = report.findings.filter((finding) => finding.severity === "error").length;
  const warnings = report.findings.filter((finding) => finding.severity === "warning").length;
  output.innerHTML = `
    <div class="report-head">
      <div><p class="eyebrow">تقرير محلي — ${escapeHtml(report.sourceLabel)}</p><h2>دليل الصفحة،<br />مرتب حسب الأولوية.</h2><p class="report-timestamp">أُنشئ في ${new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.generatedAt))} · حزمة القواعد ${report.rulePackVersion} · ${report.analysisDurationMs}ms محلياً</p></div>
      <div class="index-panel"><span>مؤشر مبدئي</span><strong>${report.initialIndex}</strong><small>ليس تصنيفاً خارجياً</small></div>
    </div>
    <div class="report-summary"><span><b>${errors}</b> تتطلب معالجة</span><span><b>${warnings}</b> تحسينات مقترحة</span><span><b>${report.findings.length}</b> إشارة مرصودة</span><button id="download-action-plan">نزّل خطة إصلاح <span>↓</span></button><button id="download-report">صدّر JSON <span>↓</span></button><button id="print-report" class="secondary-action">اطبع التقرير <span>↙</span></button><button id="copy-share-card" class="secondary-action">انسخ بطاقة ملخص <span>↗</span></button><button id="save-workspace" class="secondary-action">احفظ للمقارنة <span>＋</span></button></div>
    <div class="findings-groups">${grouped.map(({ category, items }) => `
      <section class="finding-group"><div class="group-title"><span>${categoryLabel(category)}</span><b>${String(items.length).padStart(2, "0")}</b></div>
        ${items.length ? items.map((finding) => findingTemplate(finding)).join("") : `<p class="group-clear">لم يرصد كاشف قاعدة من هذه الفئة في المصدر المقدم.</p>`}
      </section>
    `).join("")}</div>
    <aside class="limits"><b>حدود هذا التقرير</b><ul>${report.limitations.map((limitation) => `<li>${escapeHtml(limitation)}</li>`).join("")}</ul></aside>
  `;
  document.querySelector<HTMLButtonElement>("#download-action-plan")?.addEventListener("click", () => downloadActionPlan(report));
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
    const savedCount = listSavedReports().length;
    if (status) status.textContent = savedCount > 1 ? "حُفظت اللقطة الثانية. أصبح فرق النتائج جاهزاً في مساحة Pro؛ لا يُحفظ HTML أو CSS الذي فُحص." : "حُفظ ملخص التقرير محلياً في مساحة العمل. احفظ لقطة ثانية بعد التعديل لتنشئ فرقاً قابلاً للمقارنة؛ لا يُحفظ HTML أو CSS.";
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

function downloadActionPlan(report: AuditReport): void {
  const blob = new Blob([buildActionPlan(report)], { type: "text/markdown;charset=utf-8" });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = "kashifweb-action-plan.md";
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
    <section class="english-pro"><p class="eyebrow"><span></span> Pro workspace — licensed access</p><h2>Paid work should make progress traceable.</h2><p>KashifWeb Pro adds saved-snapshot comparison, a local review timeline, and optional source-free summary sync to the free local audit. A short session is issued after entitlement verification; inspected HTML, CSS, and the license key are not stored in report history. This version does not claim live crawling, rendered-page analysis, or ranking guarantees.</p><a class="button plain" href="#pro">Open the Arabic Pro workspace <span aria-hidden="true">→</span></a></section>
  </main><footer class="site-footer"><span>KashifWeb / كاشِف</span><span>Local source. Reviewable evidence.</span><span>© 2026</span></footer>`;
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
  document.querySelector<HTMLFormElement>("#pro-access-form")?.addEventListener("submit", (event) => { event.preventDefault(); void activatePro(); });
  document.querySelector<HTMLButtonElement>("#pro-sync")?.addEventListener("click", () => { void syncProWorkspace(); });
  document.querySelector<HTMLButtonElement>("#pro-signout")?.addEventListener("click", () => { clearProSession(); proSession = null; renderLanding(); document.querySelector("#pro")?.scrollIntoView({ block: "start" }); });
  document.querySelector<HTMLButtonElement>("#pro-compare")?.addEventListener("click", () => {
    const baseline = document.querySelector<HTMLSelectElement>("#pro-baseline")?.value ?? "";
    const current = document.querySelector<HTMLSelectElement>("#pro-current")?.value ?? "";
    const output = document.querySelector<HTMLElement>("#pro-comparison-result");
    if (output) output.innerHTML = comparisonResultTemplate(baseline, current);
  });
}

function setProStatus(message: string): void {
  const status = document.querySelector<HTMLElement>("#pro-status");
  if (status) status.textContent = message;
}

async function activatePro(): Promise<void> {
  const input = document.querySelector<HTMLInputElement>("#pro-license-key");
  const key = input?.value.trim() ?? "";
  if (!key) { setProStatus("ألصق مفتاح Gumroad لتفعيل الوصول."); return; }
  setProStatus("نتحقق من الترخيص عبر مزود Pro…");
  try {
    proSession = await requestProSession(key);
    if (input) input.value = "";
    renderLanding();
    document.querySelector("#pro")?.scrollIntoView({ block: "start" });
  } catch (error) {
    setProStatus(error instanceof Error ? error.message : "تعذر تفعيل وصول Pro.");
  }
}

async function syncProWorkspace(): Promise<void> {
  const saved = listSavedReports();
  if (!saved.length) { setProStatus("احفظ تقريراً واحداً على الأقل قبل مزامنة مساحة العمل."); return; }
  setProStatus("نزامن ملخصات التقارير فقط…");
  try {
    const remote = await syncWorkspace(saved);
    setProStatus(`اكتملت مزامنة ${remote.length} ملخصاً. بقي HTML وCSS على جهازك.`);
  } catch (error) {
    setProStatus(error instanceof Error ? error.message : "تعذرت مزامنة مساحة Pro.");
  }
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
	  else if (["pro", "pro-workspace", "readiness"].includes(hash)) { renderLanding(); window.setTimeout(() => document.querySelector(hash === "readiness" ? "#readiness" : "#pro")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0); }
  else if (hash.startsWith("guide/")) openArticle(hash.split("/")[1]);
  else if (["privacy", "terms", "methodology", "contact"].includes(hash)) openUtilityPage(hash);
  else { document.documentElement.lang = "ar"; document.documentElement.dir = "rtl"; renderLanding(); }
}

window.addEventListener("hashchange", route);
route();
