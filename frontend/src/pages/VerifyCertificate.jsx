import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  Download,
  Copy,
  ExternalLink,
  Award,
  Calendar,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  Share2,
  FileText,
  Lock,
  Building
} from 'lucide-react';
import { verifyService } from '../services/api';

const VerifyCertificate = () => {
  const { certificateId } = useParams();
  const navigate = useNavigate();

  const [inputCode, setInputCode] = useState(certificateId || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const performVerification = async (codeToVerify) => {
    const trimmed = (codeToVerify || '').trim();
    if (!trimmed) return;

    setLoading(true);
    setResult(null);

    try {
      const data = await verifyService.verify(trimmed);
      setResult(data);
    } catch (err) {
      setResult({
        valid: false,
        certificate_id: trimmed,
        status: 'Verification Error',
        message: err.response?.data?.detail || 'Unable to connect to verification server. Please ensure the backend is running.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (certificateId) {
      setInputCode(certificateId);
      performVerification(certificateId);
    }
  }, [certificateId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    navigate(`/verify/${encodeURIComponent(inputCode.trim().toUpperCase())}`);
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyHash = (hash) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const sampleCodes = ['CERT-1001', 'CERT-1002', 'CERT-202608-6502', 'CERT-202608-7999'];

  return (
    <div className="main-content" style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Top Navigation Back Link */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/dashboard" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
          Public Credential Verification Portal
        </span>
      </div>

      {/* Hero Header */}
      <div className="glass-panel" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', marginBottom: '2rem' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(16, 185, 129, 0.2))',
            border: '2px solid rgba(245, 158, 11, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            boxShadow: '0 0 25px rgba(245, 158, 11, 0.25)'
          }}
        >
          <ShieldCheck size={36} color="var(--gold-400)" />
        </div>
        <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-heading)', fontWeight: 800, marginBottom: '0.5rem' }}>
          Official Credential Verification
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 1.5rem', fontSize: '0.98rem' }}>
          Instantly verify the authenticity, issue status, and cryptographic SHA-256 integrity of any certificate issued by SCG Academy.
        </p>

        {/* Search Input Box */}
        <form onSubmit={handleSubmit} style={{ maxWidth: '540px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={18}
                style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}
              />
              <input
                type="text"
                className="search-input"
                placeholder="Enter Verification Code (e.g. CERT-1001)..."
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                style={{ paddingLeft: '2.75rem', width: '100%', height: '48px', fontSize: '1rem' }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !inputCode.trim()}
              style={{ padding: '0 1.5rem', height: '48px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {loading ? 'Verifying...' : 'Verify Now'}
            </button>
          </div>
        </form>

        {/* Quick Sample Chips */}
        <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Try Samples:</span>
          {sampleCodes.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                setInputCode(code);
                navigate(`/verify/${code}`);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                padding: '0.2rem 0.6rem',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontFamily: 'monospace'
              }}
              className="sample-code-chip"
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Verification Result Area */}
      {loading && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <div className="pulse-dot" style={{ width: '14px', height: '14px', margin: '0 auto 1rem', background: 'var(--gold-400)' }} />
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Querying tamper-proof certificate ledger...</p>
        </div>
      )}

      {!loading && result && result.valid && (
        <div
          className="glass-panel"
          style={{
            border: '2px solid rgba(16, 185, 129, 0.4)',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.15)',
            padding: '2.5rem',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Top Banner Status */}
          <div
            style={{
              background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05))',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '10px',
              padding: '1rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '2rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  background: 'var(--emerald-500)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)'
                }}
              >
                <CheckCircle2 size={22} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--emerald-400)', letterSpacing: '0.04em' }}>
                  OFFICIALLY VERIFIED & AUTHENTIC
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  This credential was digitally issued and verified in the institutional registry.
                </div>
              </div>
            </div>

            <div
              style={{
                fontFamily: 'monospace',
                fontWeight: 800,
                fontSize: '1rem',
                color: 'var(--gold-300)',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '0.35rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}
            >
              {result.certificate_id}
            </div>
          </div>

          {/* Certificate Main Details Card */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                padding: '1.25rem',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Recipient Student Name
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                {result.student_name}
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                padding: '1.25rem',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Course / Certification Program
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--blue-400)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GraduationCap size={20} />
                {result.course_name}
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                padding: '1.25rem',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Performance Grade
              </div>
              <div>
                <span className="badge badge-grade" style={{ fontSize: '1rem', padding: '0.3rem 0.9rem' }}>
                  {result.grade}
                </span>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                padding: '1.25rem',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Date of Issue
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} color="var(--gold-400)" />
                {result.issue_date}
              </div>
            </div>
          </div>

          {/* Issuer & Cryptographic Proof */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Lock size={16} color="var(--gold-400)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold-400)', textTransform: 'uppercase' }}>
                Cryptographic Integrity Verification
              </span>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              <strong>Issuing Authority:</strong> {result.issuer} &bull; <strong>Credential:</strong> {result.credential_type}
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: '0.35rem' }}>
              SHA-256 Tamper-Proof Fingerprint:
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '0.6rem 0.9rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <code style={{ fontSize: '0.82rem', color: 'var(--emerald-400)', wordBreak: 'break-all', flex: 1 }}>
                {result.fingerprint}
              </code>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                onClick={() => handleCopyHash(result.fingerprint)}
                title="Copy Hash"
              >
                <Copy size={13} /> {copiedHash ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCopyLink}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Share2 size={16} />
              {copiedLink ? 'Link Copied to Clipboard!' : 'Share Verification Link'}
            </button>

            <a
              href={result.pdf_download_url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Download size={16} />
              Download Official PDF Certificate
            </a>
          </div>
        </div>
      )}

      {/* Invalid / Not Found State */}
      {!loading && result && !result.valid && (
        <div
          className="glass-panel"
          style={{
            border: '2px solid rgba(244, 63, 94, 0.4)',
            boxShadow: '0 0 30px rgba(244, 63, 94, 0.15)',
            padding: '2.5rem',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '2px solid rgba(244, 63, 94, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}
          >
            <ShieldAlert size={34} color="var(--rose-500)" />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--rose-400)', marginBottom: '0.5rem' }}>
            Certificate Not Recognized
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 1.5rem', fontSize: '0.95rem' }}>
            We could not find an official certificate record matching the verification code{' '}
            <strong style={{ color: '#FFF', fontFamily: 'monospace' }}>"{result.certificate_id}"</strong>.
          </p>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '10px',
              padding: '1.25rem',
              maxWidth: '480px',
              margin: '0 auto 1.75rem',
              textAlign: 'left',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Troubleshooting Suggestions:
            </div>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li>Ensure the verification code is typed accurately (e.g. <code>CERT-1001</code>).</li>
              <li>Scan the QR code directly from the physical or PDF certificate.</li>
              <li>Verify that the certificate has been generated and published in the system.</li>
            </ul>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setInputCode('');
              setResult(null);
            }}
          >
            Try Another Verification Code
          </button>
        </div>
      )}
    </div>
  );
};

export default VerifyCertificate;
