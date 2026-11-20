/**
 * TweackTech transactional email templates.
 *
 * All templates share one responsive, table-based shell so they render
 * consistently in Gmail, Outlook and Apple Mail. Styles are inline because
 * most clients strip <style> blocks.
 */

export type EmailTemplate =
  | 'welcome'
  | 'password-reset'
  | 'certificate'
  | 'payment-received'
  | 'payment-approved'
  | 'payment-rejected'
  | 'course-invitation'
  | 'enrollment'
  | 'account-disabled'
  | 'session-reminder'
  | 'assignment-graded'
  | 'promotion'
  | 'generic';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const BRAND = {
  name: 'TweackTech',
  tagline: 'Learn. Build. Get hired.',
  red: '#dc2626',
  dark: '#0f172a',
  slate: '#475569',
  muted: '#64748b',
  border: '#e2e8f0',
  bg: '#f6f7fb',
};

const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const siteUrl = () =>
  process.env.FRONTEND_URL || 'http://localhost:3000';

const supportEmail = () =>
  process.env.SUPPORT_EMAIL || 'tweackchech@gmail.com';

const button = (href: string, label: string) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 8px">
    <tr>
      <td align="center" bgcolor="${BRAND.red}" style="border-radius:12px">
        <a href="${escapeHtml(href)}" target="_blank"
           style="display:inline-block;padding:14px 28px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;

const paragraph = (html: string) =>
  `<p style="margin:0 0 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:${BRAND.slate}">${html}</p>`;

const heading = (text: string) =>
  `<h1 style="margin:0 0 14px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:24px;line-height:1.3;color:${BRAND.dark};letter-spacing:-.02em">${escapeHtml(text)}</h1>`;

const panel = (html: string) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px">
    <tr>
      <td style="background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:18px">
        ${html}
      </td>
    </tr>
  </table>`;

const detailRow = (label: string, value: string) => `
  <tr>
    <td style="padding:7px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:${BRAND.muted};width:44%">${escapeHtml(label)}</td>
    <td style="padding:7px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:${BRAND.dark};font-weight:600;text-align:right">${escapeHtml(value)}</td>
  </tr>`;

const details = (rows: Array<[string, string]>) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px">${rows
    .map(([label, value]) => detailRow(label, value))
    .join('')}</table>`;

export function emailLayout({
  preheader,
  title,
  content,
}: {
  preheader: string;
  title: string;
  content: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};-webkit-font-smoothing:antialiased">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.bg}">
    <tr>
      <td align="center" style="padding:32px 14px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
          <tr>
            <td style="padding:0 4px 18px">
              <a href="${siteUrl()}" style="text-decoration:none;display:inline-block">
                <span style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:22px;font-weight:800;letter-spacing:-.03em;color:${BRAND.dark}">
                  Tweack<span style="color:${BRAND.red}">Tech</span>
                </span>
                <span style="display:block;margin-top:3px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#94a3b8">${BRAND.tagline}</span>
              </a>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border:1px solid ${BRAND.border};border-radius:20px;overflow:hidden;box-shadow:0 20px 50px -30px rgba(15,23,42,.35)">
              <div style="height:6px;background:linear-gradient(90deg,${BRAND.red},#7f1d1d)"></div>
              <div style="padding:36px 32px 30px">
                ${content}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 8px 8px;text-align:center">
              <p style="margin:0 0 8px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:${BRAND.muted}">
                Need a hand? Email <a href="mailto:${supportEmail()}" style="color:${BRAND.red};text-decoration:none;font-weight:600">${supportEmail()}</a>
              </p>
              <p style="margin:0 0 8px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#94a3b8">
                <a href="${siteUrl()}/courses" style="color:#94a3b8;text-decoration:none">Courses</a> &nbsp;·&nbsp;
                <a href="${siteUrl()}/talent" style="color:#94a3b8;text-decoration:none">Talent Hub</a> &nbsp;·&nbsp;
                <a href="${siteUrl()}/jobs" style="color:#94a3b8;text-decoration:none">Jobs</a> &nbsp;·&nbsp;
                <a href="${siteUrl()}/support" style="color:#94a3b8;text-decoration:none">Support</a>
              </p>
              <p style="margin:0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:11px;line-height:1.6;color:#94a3b8">
                © ${new Date().getFullYear()} TweackTech. All rights reserved.<br/>
                You are receiving this email because you have a TweackTech account.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderEmail(
  template: EmailTemplate,
  data: Record<string, any> = {},
): RenderedEmail {
  const firstName = data.firstName || 'there';
  const link = data.url || `${siteUrl()}/dashboard`;

  switch (template) {
    case 'welcome': {
      const passwordBlock = data.temporaryPassword
        ? panel(
            `<p style="margin:0 0 6px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${BRAND.red}">Temporary password</p>
             <p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:20px;font-weight:700;color:${BRAND.dark}">${escapeHtml(data.temporaryPassword)}</p>
             <p style="margin:8px 0 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:${BRAND.muted}">Sign in and change it right away from your profile page.</p>`,
          )
        : '';
      return {
        subject: `Welcome to TweackTech, ${firstName} 👋`,
        html: emailLayout({
          preheader: 'Your TweackTech account is ready. Start learning today.',
          title: 'Welcome to TweackTech',
          content: `${heading(`Welcome aboard, ${firstName}!`)}
            ${paragraph('Your TweackTech account is ready. Learn job-ready tech skills, build real projects, and connect with opportunities through our Talent Hub.')}
            ${passwordBlock}
            ${button(link, data.buttonLabel || 'Explore courses')}
            ${paragraph('<strong>What you can do next:</strong>')}
            ${paragraph('• Browse structured courses and enrol in minutes<br/>• Submit assignments and get instructor feedback<br/>• Earn certificates on paid-course completion<br/>• Build your Talent Hub profile for employers')}
            ${paragraph(`Questions? Reply to this email or contact <a href="mailto:${supportEmail()}" style="color:${BRAND.red}">${supportEmail()}</a>.`)}`,
        }),
        text: `Welcome to TweackTech, ${firstName}!\n\nYour account is ready.${data.temporaryPassword ? `\n\nTemporary password: ${data.temporaryPassword}` : ''}\n\nStart learning: ${link}\n\nNeed help? ${supportEmail()}`,
      };
    }

    case 'password-reset':
      return {
        subject: 'Reset your TweackTech password',
        html: emailLayout({
          preheader: 'Use this secure link to choose a new password. It expires in 1 hour.',
          title: 'Reset your password',
          content: `${heading('Reset your password')}
            ${paragraph(`Hi ${escapeHtml(firstName)}, we received a request to reset the password for your TweackTech account.`)}
            ${button(data.url, 'Choose a new password')}
            ${paragraph('This link expires in <strong>1 hour</strong> and can only be used once.')}
            ${panel(`<p style="margin:0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#991b1b">If you didn't request this, you can safely ignore this email — your password will not change.</p>`)}
            <p style="margin:16px 0 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:12px;word-break:break-all;color:${BRAND.muted}">Or paste this link into your browser:<br/><a href="${escapeHtml(data.url)}" style="color:${BRAND.red}">${escapeHtml(data.url)}</a></p>`,
        }),
        text: `Hi ${firstName},\n\nReset your TweackTech password using this link (valid for 1 hour):\n${data.url}\n\nIf you didn't request this, ignore this email.`,
      };

    case 'certificate':
      return {
        subject: `Your TweackTech certificate for ${data.courseTitle || 'your course'} 🎓`,
        html: emailLayout({
          preheader: `Congratulations! Your certificate for ${data.courseTitle} is ready.`,
          title: 'Certificate issued',
          content: `${heading('Congratulations, you did it! 🎓')}
            ${paragraph(`Hi ${escapeHtml(firstName)}, you've completed <strong>${escapeHtml(data.courseTitle || 'your course')}</strong> and your certificate is ready.`)}
            ${panel(`<p style="margin:0;text-align:center;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:.28em;text-transform:uppercase;color:#b91c1c">TweackTech Learning Institute</p>
              <p style="margin:12px 0 0;text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${BRAND.dark};letter-spacing:.06em">CERTIFICATE OF COMPLETION</p>
              <p style="margin:8px 0 0;text-align:center;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:${BRAND.muted}">${escapeHtml(firstName)} ${escapeHtml(data.lastName || '')} · ${escapeHtml(data.courseTitle || '')}</p>
              <p style="margin:16px 0 0;text-align:center;font-family:'Brush Script MT','Segoe Script',cursive;font-size:26px;color:${BRAND.dark}">Meyor Pop</p>
              <p style="margin:0;text-align:center;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:10px;color:${BRAND.muted}">Founder &amp; CEO · TweackTech</p>`)}
            ${details([
              ['Certificate ID', data.certificateCode || '—'],
              ['Issued', data.issuedAt || new Date().toLocaleDateString()],
              ['Grade', data.grade || '—'],
            ])}
            ${button(data.url || `${siteUrl()}/dashboard`, 'View & download certificate')}
            ${paragraph('Share it with employers and add it to your LinkedIn profile.')}`,
        }),
        text: `Congratulations ${firstName}!\n\nYour certificate for ${data.courseTitle} is ready.\nCertificate ID: ${data.certificateCode}\nVerify: ${data.url}\n`,
      };

    case 'course-invitation': {
      const paid = String(data.accessType || '').toUpperCase() === 'PAID';
      return {
        subject: paid
          ? `You're invited to ${data.courseTitle || 'a TweackTech course'} — payment required`
          : `You're invited to ${data.courseTitle || 'a TweackTech course'} 🎉`,
        html: emailLayout({
          preheader: paid
            ? 'Complete your invitation payment to unlock the course.'
            : 'Your free course access is ready.',
          title: 'Course invitation',
          content: `${heading(paid ? 'You are invited to enrol' : 'You have free access! 🎉')}
            ${paragraph(`Hi ${escapeHtml(firstName)}, <strong>${escapeHtml(data.invitedByName || 'Your instructor')}</strong> invited you to <strong>${escapeHtml(data.courseTitle || 'a TweackTech course')}</strong>.`)}
            ${paid
              ? details([
                  ['Course', data.courseTitle || '—'],
                  ['Invitation', 'Paid enrolment'],
                  ['Amount', `${data.currency || ''} ${data.amount || ''}`.trim() || 'See payments page'],
                ]) + button(data.url || `${siteUrl()}/payments`, 'Complete payment')
              : button(data.url || `${siteUrl()}/dashboard`, 'Start learning')}
            ${data.message ? panel(`<p style="margin:0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:${BRAND.slate}"><strong>Message from ${escapeHtml(data.invitedByName || 'your instructor')}:</strong> ${escapeHtml(data.message)}</p>`) : ''}
            ${paragraph(paid ? 'After your transfer is verified, the course will appear on your dashboard automatically.' : 'The course is already on your dashboard — no payment is required.')}`,
        }),
        text: `Hi ${firstName}, ${data.invitedByName || 'your instructor'} invited you to ${data.courseTitle}.${paid ? ` Complete payment: ${data.url || `${siteUrl()}/payments`}` : ` Start learning: ${data.url || `${siteUrl()}/dashboard`}`}${data.message ? `\n\nMessage: ${data.message}` : ''}`,
      };
    }

    case 'payment-received':
      return {
        subject: 'We received your payment proof — TweackTech',
        html: emailLayout({
          preheader: 'Our team is reviewing your bank transfer proof.',
          title: 'Payment proof received',
          content: `${heading('Payment proof received')}
            ${paragraph(`Thanks ${escapeHtml(firstName)}. We received your transfer proof for <strong>${escapeHtml(data.courseTitle || 'your course')}</strong> and our team is reviewing it.`)}
            ${details([
              ['Course', data.courseTitle || '—'],
              ['Reference', data.reference || '—'],
              ['Amount', data.amount ? `${data.currency || ''} ${data.amount}` : '—'],
              ['Status', 'Awaiting approval'],
            ])}
            ${paragraph('Approvals usually take less than one business day. You will get another email as soon as access is granted.')}
            ${button(`${siteUrl()}/payments`, 'Track your payment')}`,
        }),
        text: `Hi ${firstName}, we received your payment proof for ${data.courseTitle}. Reference: ${data.reference}. We will email you once it is approved.`,
      };

    case 'payment-approved':
      return {
        subject: `Payment approved — welcome to ${data.courseTitle || 'your course'}`,
        html: emailLayout({
          preheader: 'Your payment was approved and your course access is now active.',
          title: 'Payment approved',
          content: `${heading('You are enrolled! 🎉')}
            ${paragraph(`Hi ${escapeHtml(firstName)}, your payment for <strong>${escapeHtml(data.courseTitle || 'your course')}</strong> has been approved. Your course is unlocked and ready.`)}
            ${details([
              ['Course', data.courseTitle || '—'],
              ['Reference', data.reference || '—'],
              ['Amount', data.amount ? `${data.currency || ''} ${data.amount}` : '—'],
              ['Status', 'Paid'],
            ])}
            ${button(data.url || `${siteUrl()}/dashboard`, 'Start learning')}`,
        }),
        text: `Payment approved! You are enrolled in ${data.courseTitle}. Start learning: ${data.url || siteUrl()}`,
      };

    case 'payment-rejected':
      return {
        subject: 'Action needed: payment proof could not be verified',
        html: emailLayout({
          preheader: 'Please review the note and re-upload your payment proof.',
          title: 'Payment needs attention',
          content: `${heading('We could not verify your payment')}
            ${paragraph(`Hi ${escapeHtml(firstName)}, we reviewed your proof for <strong>${escapeHtml(data.courseTitle || 'your course')}</strong> but could not verify it.`)}
            ${data.reason ? panel(`<p style="margin:0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#991b1b"><strong>Reviewer note:</strong> ${escapeHtml(data.reason)}</p>`) : ''}
            ${paragraph('You can upload a clearer screenshot or transfer receipt from your payments page.')}
            ${button(`${siteUrl()}/payments`, 'Re-upload proof')}
            ${paragraph(`Still stuck? Contact <a href="mailto:${supportEmail()}" style="color:${BRAND.red}">${supportEmail()}</a> and we will sort it out.`)}`,
        }),
        text: `Hi ${firstName}, we could not verify your payment for ${data.courseTitle}.${data.reason ? `\nReason: ${data.reason}` : ''}\nRe-upload: ${siteUrl()}/payments`,
      };

    case 'enrollment':
      return {
        subject: `You're enrolled in ${data.courseTitle || 'a TweackTech course'}`,
        html: emailLayout({
          preheader: 'Your course access is active. Pick up where you left off.',
          title: 'Enrolment confirmed',
          content: `${heading("You're in!")}
            ${paragraph(`Hi ${escapeHtml(firstName)}, your enrolment in <strong>${escapeHtml(data.courseTitle || 'your course')}</strong> is confirmed.`)}
            ${button(data.url || `${siteUrl()}/dashboard`, 'Open my course')}
            ${paragraph('Tip: set a weekly learning goal and use the calendar to keep up with live sessions.')}`,
        }),
        text: `You're enrolled in ${data.courseTitle}. Start: ${data.url || siteUrl()}`,
      };

    case 'account-disabled':
      return {
        subject: 'Your TweackTech account has been disabled',
        html: emailLayout({
          preheader: 'Your account access has been paused. Contact support if this is unexpected.',
          title: 'Account disabled',
          content: `${heading('Your account has been disabled')}
            ${paragraph(`Hi ${escapeHtml(firstName)}, an administrator has disabled your TweackTech account. You have been signed out of all active sessions.`)}
            ${data.reason ? panel(`<p style="margin:0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#991b1b"><strong>Reason:</strong> ${escapeHtml(data.reason)}</p>`) : ''}
            ${paragraph(`If you believe this is a mistake, contact <a href="mailto:${supportEmail()}" style="color:${BRAND.red}">${supportEmail()}</a>.`)}`,
        }),
        text: `Hi ${firstName}, your TweackTech account has been disabled.${data.reason ? ` Reason: ${data.reason}` : ''} Contact ${supportEmail()}.`,
      };

    case 'session-reminder':
      return {
        subject: `Reminder: ${data.sessionTitle || 'Live class'} starts soon`,
        html: emailLayout({
          preheader: `Your live session for ${data.courseTitle} starts soon.`,
          title: 'Live session reminder',
          content: `${heading('Your live class starts soon')}
            ${paragraph(`Hi ${escapeHtml(firstName)}, <strong>${escapeHtml(data.sessionTitle || 'your live session')}</strong> for ${escapeHtml(data.courseTitle || 'your course')} starts in ${escapeHtml(data.minutes || '30')} minutes.`)}
            ${details([
              ['Starts', data.startTime || '—'],
              ['Course', data.courseTitle || '—'],
            ])}
            ${data.joinUrl ? button(data.joinUrl, 'Join live session') : button(`${siteUrl()}/calendar`, 'Open calendar')}`,
        }),
        text: `Reminder: ${data.sessionTitle} starts soon. ${data.joinUrl || `${siteUrl()}/calendar`}`,
      };

    case 'assignment-graded':
      return {
        subject: `Your assignment was graded: ${data.assignmentTitle || 'TweackTech'}`,
        html: emailLayout({
          preheader: `You scored ${data.score ?? '—'} on ${data.assignmentTitle}.`,
          title: 'Assignment graded',
          content: `${heading('Your assignment has been graded')}
            ${paragraph(`Hi ${escapeHtml(firstName)}, your submission for <strong>${escapeHtml(data.assignmentTitle || 'your assignment')}</strong> has been reviewed.`)}
            ${details([
              ['Score', `${data.score ?? '—'} / ${data.maxScore ?? '—'}`],
              ['Status', data.status || 'Graded'],
            ])}
            ${data.feedback ? panel(`<p style="margin:0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:${BRAND.slate}"><strong>Feedback:</strong> ${escapeHtml(data.feedback)}</p>`) : ''}
            ${data.certificateUrl ? paragraph('🎓 Your course certificate is now available.') + button(data.certificateUrl, 'View my certificate') : ''}
            ${button(`${siteUrl()}/assignments`, 'View assignment')}`,
        }),
        text: `Your assignment ${data.assignmentTitle} was graded: ${data.score}/${data.maxScore}. ${data.feedback || ''}`,
      };

    case 'promotion':
      return {
        subject: data.subject || data.headline || 'New at TweackTech',
        html: emailLayout({
          preheader: data.preheader || data.headline || 'Fresh courses and opportunities at TweackTech.',
          title: data.headline || 'New at TweackTech',
          content: `${heading(data.headline || 'New at TweackTech')}
            ${paragraph(data.body || 'Discover new courses, live sessions, and career opportunities on TweackTech.')}
            ${data.ctaUrl ? button(data.ctaUrl, data.ctaLabel || 'Explore now') : button(`${siteUrl()}/courses`, 'Explore courses')}
            <p style="margin:18px 0 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:11px;color:#94a3b8">
              You are receiving this because you subscribed to TweackTech updates.
              <a href="${escapeHtml(data.unsubscribeUrl || `${siteUrl()}/unsubscribe`)}" style="color:#94a3b8">Unsubscribe</a>.
            </p>`,
        }),
        text: `${data.headline || 'New at TweackTech'}\n\n${data.body || ''}\n\n${data.ctaUrl || `${siteUrl()}/courses`}`,
      };

    case 'generic':
    default:
      return {
        subject: data.subject || 'TweackTech',
        html: emailLayout({
          preheader: data.preheader || data.subject || 'A message from TweackTech.',
          title: data.subject || 'TweackTech',
          content: `${data.title ? heading(data.title) : ''}
            ${paragraph(data.body || data.message || '')}
            ${data.ctaUrl ? button(data.ctaUrl, data.ctaLabel || 'Open TweackTech') : ''}`,
        }),
        text: `${data.subject || 'TweackTech'}\n\n${data.body || data.message || ''}\n\n${data.ctaUrl || ''}`,
      };
  }
}
