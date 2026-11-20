import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Award, Download, Loader2, ShieldAlert } from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import CertificateArtwork from '../Component/CertificateArtwork';
import { downloadCertificatePdf } from '../lib/certificatePdf';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const unwrap = (body) => (body && typeof body === 'object' && 'data' in body ? body.data : body);

const VerifyCertificate = () => {
  const { code } = useParams();
  const [state, setState] = useState('loading');
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${API_URL}/certificates/verify/${encodeURIComponent(code)}`)
      .then((res) => {
        if (cancelled) return;
        setCertificate(unwrap(res.data)?.certificate || unwrap(res.data));
        setState('valid');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err.response?.status === 404
            ? 'No certificate matches this ID. Check the code and try again.'
            : err.response?.data?.message || 'Could not verify this certificate right now.',
        );
        setState('invalid');
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const certificateData = certificate
    ? {
        studentName: `${certificate.user?.firstName || ''} ${certificate.user?.lastName || ''}`.trim(),
        courseTitle: certificate.course?.title,
        certificateCode: certificate.certificateCode,
        issuedAt: certificate.issuedAt,
        grade: certificate.grade,
        score: certificate.score,
        verifyUrl: window.location.href,
      }
    : null;

  const downloadPdf = () => {
    if (certificateData) downloadCertificatePdf(certificateData);
  };

  return (
    <div className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-950">
      <Navbar />
      <div className="container-page py-10">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <span className="section-eyebrow mx-auto">
              <Award className="h-3.5 w-3.5" /> Certificate verification
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Verify a TweackTech certificate
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Certificate ID: <span className="font-mono text-slate-900 dark:text-white">{code}</span>
            </p>
          </div>

          {state === 'loading' && (
            <div className="card mt-8 flex items-center justify-center gap-3 p-16 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin text-red-600" /> Checking the certificate registry…
            </div>
          )}

          {state === 'invalid' && (
            <div className="card mt-8 p-10 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                <ShieldAlert className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                Certificate not verified
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">{error}</p>
              <Link to="/support" className="btn-secondary mt-5">Contact support</Link>
            </div>
          )}

          {state === 'valid' && certificate && (
            <>
              <div className="mt-8">
                <CertificateArtwork
                  studentName={`${certificate.user?.firstName || ''} ${certificate.user?.lastName || ''}`.trim()}
                  courseTitle={certificate.course?.title}
                  certificateCode={certificate.certificateCode}
                  issuedAt={certificate.issuedAt}
                  grade={certificate.grade}
                  score={certificate.score}
                  verifyUrl={window.location.href}
                />
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-2 print:hidden">
                <button type="button" onClick={downloadPdf} className="btn-primary">
                  <Download className="h-4 w-4" /> Download certificate PDF
                </button>
                <Link to="/dashboard" className="btn-secondary">
                  <Award className="h-4 w-4" /> My certificates
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default VerifyCertificate;
