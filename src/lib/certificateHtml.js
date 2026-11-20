const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatIssued = (value) => {
  if (!value) return new Date().toLocaleDateString(undefined, { dateStyle: 'long' });
  return new Date(value).toLocaleDateString(undefined, { dateStyle: 'long' });
};

/**
 * Printable scholar certificate. Kept as a string so the dashboard can open it
 * in a new window and trigger the browser print dialog.
 */
export const certificateHtml = ({
  studentName,
  courseTitle,
  certificateCode,
  issuedAt,
  grade,
  score,
  verifyUrl,
}) => {
  const name = escapeHtml(studentName || 'Learner');
  const course = escapeHtml(courseTitle || 'Course');
  const code = escapeHtml(certificateCode || '');
  const issued = escapeHtml(formatIssued(issuedAt));
  const gradeLabel = grade ? escapeHtml(grade) : score ? `${Math.round(Number(score))}%` : '';
  const verify = escapeHtml(verifyUrl || '');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Certificate · ${course}</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #eef1f6;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #0f172a;
    padding: 24px;
  }
  .certificate {
    position: relative;
    width: 100%;
    max-width: 1040px;
    min-height: 650px;
    margin: 0 auto;
    padding: 18px;
    background: #fffdf7;
    border: 2px solid #c9a227;
    box-shadow: 0 24px 70px -30px rgba(15, 23, 42, .45);
    overflow: hidden;
  }
  .inner {
    position: relative;
    height: 100%;
    min-height: 610px;
    border: 1px solid #c9a227;
    padding: 44px 56px;
    text-align: center;
    background:
      radial-gradient(circle at 15% 15%, rgba(201,162,39,.09), transparent 32%),
      radial-gradient(circle at 85% 85%, rgba(220,38,38,.07), transparent 34%);
  }
  .watermark {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    transform: rotate(-28deg);
    font-size: 132px;
    font-weight: 900;
    letter-spacing: .1em;
    color: #0f172a;
    opacity: .055;
    white-space: nowrap;
  }
  .watermark.second { transform: rotate(-28deg) translateY(210px); font-size: 92px; opacity: .035; }
  .brand { font-size: 12px; font-weight: 800; letter-spacing: .35em; text-transform: uppercase; color: #b91c1c; }
  .logo {
    width: 54px; height: 54px; margin: 0 auto 10px; border-radius: 14px;
    display: grid; place-items: center; color: #fff; font-weight: 900; font-size: 20px;
    background: linear-gradient(135deg, #ef4444, #7f1d1d);
  }
  h1 {
    margin: 12px 0 4px;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 40px;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: #0f172a;
  }
  .sub { color: #64748b; font-size: 13px; letter-spacing: .08em; text-transform: uppercase; }
  .awarded { margin: 30px 0 0; color: #475569; font-size: 15px; }
  .name {
    margin: 10px auto 0;
    font-family: 'Brush Script MT', 'Segoe Script', 'Snell Roundhand', cursive;
    font-size: 52px;
    line-height: 1.1;
    color: #7f1d1d;
    border-bottom: 1px solid #d6c48a;
    display: inline-block;
    padding: 0 28px 10px;
  }
  .course-line { margin: 22px 0 0; color: #475569; font-size: 15px; }
  .course {
    margin: 8px auto 0;
    max-width: 720px;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 28px;
    font-weight: 700;
    color: #0f172a;
  }
  .meta {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 24px;
    margin-top: 42px;
    text-align: left;
    font-size: 11px;
    color: #64748b;
  }
  .meta strong { display: block; font-size: 9px; letter-spacing: .14em; text-transform: uppercase; color: #94a3b8; margin-bottom: 3px; }
  .signature { text-align: center; min-width: 190px; }
  .signature .script { font-family: 'Brush Script MT', 'Segoe Script', cursive; font-size: 32px; color: #0f172a; line-height: 1; }
  .signature .line { border-top: 1px solid #94a3b8; margin-top: 4px; padding-top: 5px; font-size: 10px; color: #475569; }
  .seal {
    width: 96px; height: 96px; border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #f7df8b, #c9a227 55%, #8a6d12);
    border: 4px double #fff7d6;
    color: #422f00;
    display: grid; place-items: center;
    font-weight: 900; font-size: 10px; text-align: center; line-height: 1.15;
    box-shadow: 0 8px 18px rgba(138,109,18,.25);
    flex-shrink: 0;
  }
  .seal span { display: block; }
  .verify { margin-top: 16px; font-size: 9px; letter-spacing: .08em; text-transform: uppercase; color: #94a3b8; }
  .verify b { color: #7f1d1d; letter-spacing: 0; text-transform: none; }
  @media print {
    body { background: #fff; padding: 0; }
    .certificate { max-width: none; width: 297mm; min-height: 210mm; border-width: 2px; box-shadow: none; }
    .inner { min-height: 204mm; }
  }
</style>
</head>
<body>
  <div class="certificate">
    <div class="watermark">TWEACKTECH</div>
    <div class="watermark second">CERTIFIED</div>
    <div class="inner">
      <div class="logo">T</div>
      <div class="brand">TweackTech Learning Institute</div>
      <h1>Certificate of Completion</h1>
      <p class="sub">This is to certify that</p>
      <div class="name">${name}</div>
      <p class="awarded">has successfully completed all requirements of</p>
      <p class="course">${course}</p>
      <p class="course-line">${gradeLabel ? `Awarded grade <strong>${gradeLabel}</strong> · ` : ''}Issued ${issued}</p>

      <div class="meta">
        <div>
          <strong>Certificate ID</strong>
          ${code}
        </div>
        <div class="seal"><span>OFFICIAL<br/>SEAL<br/>★</span></div>
        <div class="signature">
          <div class="script">Meyor Pop</div>
          <div class="line">Founder &amp; CEO · TweackTech</div>
        </div>
      </div>
      <p class="verify">Verify this certificate at <b>${verify}</b></p>
    </div>
  </div>
</body>
</html>`;
};

export const printCertificate = (data) => {
  const win = window.open('', '_blank', 'width=1120,height=820');
  if (!win) return false;
  win.document.write(certificateHtml(data));
  win.document.close();
  win.onload = () => {
    window.setTimeout(() => win.print(), 350);
  };
  return true;
};
