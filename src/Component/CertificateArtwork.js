import React from 'react';

const formatIssued = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { dateStyle: 'long' })
    : new Date().toLocaleDateString(undefined, { dateStyle: 'long' });

const CertificateArtwork = ({
  studentName,
  courseTitle,
  certificateCode,
  issuedAt,
  grade,
  score,
  verifyUrl,
}) => (
  <div className="relative mx-auto w-full max-w-4xl overflow-hidden border-2 border-amber-500/80 bg-[#fffdf7] p-2 shadow-2xl sm:p-3">
    <div className="relative min-h-[560px] overflow-hidden border border-amber-500/60 px-6 py-10 text-center sm:px-14">
      {/* Watermarks */}
      <div className="pointer-events-none absolute inset-0 flex rotate-[-28deg] items-center justify-center whitespace-nowrap text-[clamp(4rem,14vw,9rem)] font-black tracking-[0.12em] text-slate-900 opacity-[0.045]">
        TWEACKTECH
      </div>
      <div className="pointer-events-none absolute inset-0 flex translate-y-32 rotate-[-28deg] items-center justify-center whitespace-nowrap text-[clamp(3rem,9vw,6rem)] font-black tracking-[0.12em] text-slate-900 opacity-[0.03]">
        CERTIFIED
      </div>

      <div className="relative">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-red-500 to-red-800 text-xl font-black text-white shadow-lg">
          T
        </div>
        <p className="mt-3 text-[10px] font-extrabold uppercase tracking-[0.3em] text-red-700">
          TweackTech Learning Institute
        </p>
        <h2 className="mt-3 font-serif text-2xl font-bold uppercase tracking-[0.08em] text-slate-900 sm:text-4xl">
          Certificate of Completion
        </h2>
        <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
          This is to certify that
        </p>
        <p className="mx-auto mt-3 inline-block border-b border-amber-300/70 px-6 pb-2 font-serif text-3xl font-bold text-red-900 sm:text-5xl">
          {studentName || 'Learner'}
        </p>
        <p className="mt-5 text-sm text-slate-600">has successfully completed all requirements of</p>
        <p className="mx-auto mt-2 max-w-2xl font-serif text-xl font-bold text-slate-900 sm:text-3xl">
          {courseTitle || 'Course'}
        </p>
        <p className="mt-4 text-xs text-slate-500">
          {grade ? `Awarded grade ${grade} · ` : score ? `Score ${Math.round(score)}% · ` : ''}
          Issued {formatIssued(issuedAt)}
        </p>

        <div className="mt-10 flex flex-col items-center justify-between gap-6 text-left sm:flex-row sm:items-end">
          <div className="min-w-[160px] text-[10px] text-slate-500">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Certificate ID
            </p>
            <p className="mt-1 font-mono text-slate-700">{certificateCode}</p>
          </div>

          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full border-4 border-double border-amber-100 bg-[radial-gradient(circle_at_35%_30%,#f7df8b,#c9a227_55%,#8a6d12)] text-center text-[9px] font-black leading-tight text-amber-950 shadow-lg">
            OFFICIAL
            <br />
            SEAL
            <br />★
          </div>

          <div className="min-w-[180px] text-center">
            <p className="font-serif text-3xl italic text-slate-900">Meyor Pop</p>
            <p className="mt-1 border-t border-slate-400 pt-1 text-[10px] text-slate-600">
              Founder &amp; CEO · TweackTech
            </p>
          </div>
        </div>

        {verifyUrl && (
          <p className="mt-6 text-[9px] uppercase tracking-[0.12em] text-slate-400">
            Verify this certificate at <span className="normal-case text-red-800">{verifyUrl}</span>
          </p>
        )}
      </div>
    </div>
  </div>
);

export default CertificateArtwork;
