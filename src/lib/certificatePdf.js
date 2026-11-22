const formatIssued = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { dateStyle: 'long' })
    : new Date().toLocaleDateString(undefined, { dateStyle: 'long' });

/**
 * Generates a landscape A4 scholar certificate PDF and downloads it.
 * The design mirrors the on-screen/print certificate: gold border, watermark,
 * official seal, certificate ID, verification URL and signature.
 */
export const downloadCertificatePdf = async ({
  studentName,
  courseTitle,
  certificateCode,
  issuedAt,
  grade,
  score,
  verifyUrl,
}) => {
  // jsPDF is a large library only needed when a certificate is actually
  // downloaded. Keep it out of the route bundle until that moment.
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const width = 297;
  const height = 210;
  doc.setProperties({
    title: `TweackTech Certificate — ${courseTitle || 'Course'}`,
    subject: 'TweackTech certificate of completion',
    author: 'TweackTech Learning Institute',
    creator: 'TweackTech LMS',
  });

  // Parchment background
  doc.setFillColor(255, 253, 247);
  doc.rect(0, 0, width, height, 'F');

  // Gold border
  doc.setDrawColor(201, 162, 39);
  doc.setLineWidth(1.2);
  doc.rect(10, 10, width - 20, height - 20);
  doc.setLineWidth(0.35);
  doc.rect(14, 14, width - 28, height - 28);

  // Watermark
  doc.setTextColor(236, 238, 242);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(92);
  doc.text('TWEACKTECH', width / 2, 125, { align: 'center', angle: -28 });
  doc.setFontSize(54);
  doc.text('CERTIFIED', width / 2, 175, { align: 'center', angle: -28 });

  // Brand
  doc.setTextColor(185, 28, 28);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TWEACKTECH LEARNING INSTITUTE', width / 2, 30, {
    align: 'center',
    charSpace: 1.2,
  });

  // Title
  doc.setTextColor(15, 23, 42);
  doc.setFont('times', 'bold');
  doc.setFontSize(32);
  doc.text('CERTIFICATE OF COMPLETION', width / 2, 48, { align: 'center' });

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('THIS IS TO CERTIFY THAT', width / 2, 62, {
    align: 'center',
    charSpace: 0.9,
  });

  // Student name
  const name = String(studentName || 'Learner');
  doc.setTextColor(127, 29, 29);
  doc.setFont('times', 'italic');
  doc.setFontSize(name.length > 28 ? 28 : 36);
  doc.text(name, width / 2, 82, { align: 'center' });
  doc.setDrawColor(214, 196, 138);
  doc.setLineWidth(0.4);
  doc.line(width / 2 - 60, 86, width / 2 + 60, 86);

  // Course
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('has successfully completed all requirements of', width / 2, 98, {
    align: 'center',
  });

  doc.setTextColor(15, 23, 42);
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  const courseLines = doc.splitTextToSize(String(courseTitle || 'Course'), 210);
  doc.text(courseLines, width / 2, 108, { align: 'center' });

  const gradeText =
    grade || (score !== undefined && score !== null ? `${Math.round(Number(score))}%` : '');
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `${gradeText ? `Awarded grade ${gradeText}  ·  ` : ''}Issued ${formatIssued(issuedAt)}`,
    width / 2,
    122,
    { align: 'center' },
  );

  // Certificate ID
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text('CERTIFICATE ID', 28, 160);
  doc.setTextColor(51, 65, 85);
  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  doc.text(String(certificateCode || ''), 28, 166);

  // Seal
  doc.setFillColor(201, 162, 39);
  doc.circle(width / 2, 165, 13, 'F');
  doc.setDrawColor(255, 247, 214);
  doc.setLineWidth(1.2);
  doc.circle(width / 2, 165, 12, 'S');
  doc.setTextColor(66, 47, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.text('OFFICIAL', width / 2, 163, { align: 'center' });
  doc.text('SEAL', width / 2, 166, { align: 'center' });
  doc.text('★', width / 2, 170, { align: 'center' });

  // Signature
  doc.setTextColor(15, 23, 42);
  doc.setFont('times', 'italic');
  doc.setFontSize(22);
  doc.text('Meyor Pop', width - 28, 158, { align: 'right' });
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(width - 78, 161, width - 28, 161);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Founder & CEO · TweackTech', width - 28, 166, { align: 'right' });

  // Verification
  if (verifyUrl) {
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.text(`Verify this certificate at ${verifyUrl}`, width / 2, 188, {
      align: 'center',
    });
  }

  doc.save(`TweackTech-Certificate-${certificateCode || 'download'}.pdf`);
};
