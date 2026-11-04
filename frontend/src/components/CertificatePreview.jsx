import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, Printer, Download, Sparkles, CheckCircle2, ShieldCheck, QrCode, Palette } from 'lucide-react';
import { certificateService } from '../services/api';

const TEMPLATE_STYLES = {
  Standard: {
    id: 'Standard',
    label: 'Executive Gold (Standard)',
    borderColor: '#D4AF37',
    subBorderColor: '#0F172A',
    cornerBg: '#D4AF37',
    canvasBg: 'linear-gradient(135deg, #FFFDF8 0%, #FAF6ED 100%)',
    primaryColor: '#0F172A',
    accentColor: '#D4AF37',
    titleColor: '#0F172A',
    recipientColor: '#1E3A8A',
    courseBadgeBg: 'rgba(2, 132, 199, 0.12)',
    courseBadgeColor: '#0284C7',
    sealBg: 'radial-gradient(circle, #F59E0B 0%, #D97706 70%, #92400E 100%)',
    sealBorder: '3px solid #FDE68A',
    sealText: 'ACADEMIC\nEXCELLENCE',
    sealSub: 'Tamper-Proof Credential',
    defaultInst: 'National Academy of Technology',
    defaultInstSub: 'Accredited Council of Higher Education',
    defaultTitle: 'Certificate of Excellence',
    defaultSignatory: 'Dr. Aris Thorne',
    defaultSignatoryRole: 'Director of Academics',
  },
  'Modern Tech': {
    id: 'Modern Tech',
    label: 'Modern Tech (Cyber Cyan)',
    borderColor: '#06B6D4',
    subBorderColor: '#3B82F6',
    cornerBg: '#06B6D4',
    canvasBg: 'linear-gradient(135deg, #F8FAFC 0%, #EDF7FA 100%)',
    primaryColor: '#0F172A',
    accentColor: '#06B6D4',
    titleColor: '#0891B2',
    recipientColor: '#0369A1',
    courseBadgeBg: 'rgba(6, 182, 212, 0.15)',
    courseBadgeColor: '#0891B2',
    sealBg: 'radial-gradient(circle, #06B6D4 0%, #0284C7 70%, #0F172A 100%)',
    sealBorder: '3px solid #67E8F9',
    sealText: 'TECH\nACCREDITED',
    sealSub: 'Verified Cloud Credential',
    defaultInst: 'Institute of Advanced Technologies',
    defaultInstSub: 'Applied Computing & AI Research Labs',
    defaultTitle: 'Certificate of Technical Proficiency',
    defaultSignatory: 'Prof. Elena Vance',
    defaultSignatoryRole: 'Chief Technology Architect',
  },
  'Academic Burgundy': {
    id: 'Academic Burgundy',
    label: 'Academic Prestige (Burgundy)',
    borderColor: '#991B1B',
    subBorderColor: '#B45309',
    cornerBg: '#991B1B',
    canvasBg: 'linear-gradient(135deg, #FFFDFB 0%, #FAF0EE 100%)',
    primaryColor: '#450A0A',
    accentColor: '#B45309',
    titleColor: '#7F1D1D',
    recipientColor: '#991B1B',
    courseBadgeBg: 'rgba(180, 83, 9, 0.14)',
    courseBadgeColor: '#B45309',
    sealBg: 'radial-gradient(circle, #DC2626 0%, #991B1B 70%, #450A0A 100%)',
    sealBorder: '3px solid #FCA5A5',
    sealText: 'SIGILLUM\nACADEMIAE',
    sealSub: 'Excellentia & Veritas',
    defaultInst: 'Royal University of Sciences & Arts',
    defaultInstSub: 'Established MDCCXC • Charter of Excellence',
    defaultTitle: 'Honoris Certificatum Excellentia',
    defaultSignatory: 'Sir Arthur Pendelton',
    defaultSignatoryRole: 'Chancellor & Provost',
  },
  'Minimalist Platinum': {
    id: 'Minimalist Platinum',
    label: 'Minimalist Platinum (Emerald)',
    borderColor: '#059669',
    subBorderColor: '#64748B',
    cornerBg: '#059669',
    canvasBg: 'linear-gradient(135deg, #FAFAFA 0%, #F0FDF4 100%)',
    primaryColor: '#064E3B',
    accentColor: '#059669',
    titleColor: '#065F46',
    recipientColor: '#047857',
    courseBadgeBg: 'rgba(5, 150, 105, 0.12)',
    courseBadgeColor: '#047857',
    sealBg: 'radial-gradient(circle, #10B981 0%, #059669 70%, #064E3B 100%)',
    sealBorder: '3px solid #6EE7B7',
    sealText: 'VERIFIED\nMERIT',
    sealSub: 'Global Standard Board',
    defaultInst: 'Global Professional Certification Board',
    defaultInstSub: 'International Quality Accreditation Framework',
    defaultTitle: 'Certificate of Professional Mastery',
    defaultSignatory: 'Marcus Vance, MBA',
    defaultSignatoryRole: 'Managing Director',
  },
};

export const resolveTemplateKey = (name) => {
  if (!name) return 'Standard';
  if (TEMPLATE_STYLES[name]) return name;
  const lower = String(name).toLowerCase();
  if (lower.includes('cyan') || lower.includes('modern') || lower.includes('tech')) return 'Modern Tech';
  if (lower.includes('burgundy') || lower.includes('prestige') || lower.includes('academic')) return 'Academic Burgundy';
  if (lower.includes('platinum') || lower.includes('emerald') || lower.includes('minimalist')) return 'Minimalist Platinum';
  if (lower.includes('gold') || lower.includes('executive') || lower.includes('standard')) return 'Standard';
  return 'Standard';
};

const CertificatePreview = ({ studentData, onClose, onTemplateChange }) => {
  const {
    student_id = 'STU-101',
    name = 'Rahul Sharma',
    course = 'Full Stack Web Development',
    grade = 'A+',
    issue_date = '2026-10-15',
    certificate_id = 'CERT-1001',
    template_name = 'Standard',
    institution_name = '',
    cert_title = '',
    signatory_name = '',
    signatory_title = '',
  } = studentData || {};

  const resolvedInitial = resolveTemplateKey(studentData?.template_name || template_name);
  const [activeTemplate, setActiveTemplate] = useState(resolvedInitial);

  // Automatically update the canvas theme when the parent updates the selected template
  useEffect(() => {
    const nextKey = resolveTemplateKey(studentData?.template_name || template_name);
    setActiveTemplate(nextKey);
  }, [studentData?.template_name, template_name]);

  const currentTpl = TEMPLATE_STYLES[activeTemplate] || TEMPLATE_STYLES['Standard'];

  // Resolve custom branding overrides in real-time
  const displayInst = (institution_name && institution_name.trim()) ? institution_name.trim() : currentTpl.defaultInst;
  const displayTitle = (cert_title && cert_title.trim()) ? cert_title.trim() : currentTpl.defaultTitle;
  const displaySignatory = (signatory_name && signatory_name.trim()) ? signatory_name.trim() : currentTpl.defaultSignatory;
  const displaySignatoryRole = (signatory_title && signatory_title.trim()) ? signatory_title.trim() : currentTpl.defaultSignatoryRole;

  const handleTemplateSwitch = (newTemplate) => {
    const resolved = resolveTemplateKey(newTemplate);
    setActiveTemplate(resolved);
    if (onTemplateChange) onTemplateChange(resolved);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="visualizer-container">
      {/* Visualizer Action Bar */}
      <div className="glass-panel visualizer-action-bar" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div className="canvas-status-pill">
            <Sparkles size={14} />
            <span>Live Vector Canvas</span>
          </div>

          {onClose && (
            <button
              className="btn btn-secondary"
              onClick={onClose}
              title="Close Preview"
              style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', borderRadius: '6px' }}
            >
              ✕
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', width: '100%', flexWrap: 'wrap' }}>
          {/* Template Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: 1, minWidth: '150px' }}>
            <Palette size={14} color="var(--gold-400)" />
            <select
              value={activeTemplate}
              onChange={(e) => handleTemplateSwitch(e.target.value)}
              className="form-select"
              style={{
                width: '100%',
                padding: '0.32rem 0.6rem',
                fontSize: '0.78rem',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid var(--border-glass)',
                color: '#FFF',
                cursor: 'pointer',
              }}
              title="Switch Custom Certificate Template"
            >
              {Object.values(TEMPLATE_STYLES).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {certificate_id && (
              <Link
                to={`/verify/${certificate_id}`}
                className="btn btn-secondary"
                style={{ padding: '0.32rem 0.6rem', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                title="Verify this certificate on public portal"
              >
                <ShieldCheck size={12} color="var(--emerald-400)" /> Verify
              </Link>
            )}

            <button
              className="btn btn-secondary"
              onClick={handlePrint}
              title="Print Preview"
              style={{ padding: '0.32rem 0.6rem', fontSize: '0.76rem' }}
            >
              <Printer size={12} /> Print
            </button>

            {certificate_id && (
              <a
                href={certificateService.getSingleDownloadUrl(certificate_id)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ padding: '0.32rem 0.75rem', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <Download size={12} /> PDF
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Parchment Certificate Canvas */}
      <div
        className="cert-canvas-frame"
        style={{
          background: currentTpl.canvasBg,
          border: `1.5px solid ${currentTpl.borderColor}80`,
          boxShadow: `0 20px 48px -10px rgba(0, 0, 0, 0.75), 0 0 24px ${currentTpl.borderColor}25`,
        }}
      >
        {/* Dynamic Corner Accents */}
        <div className="cert-corner-ornament cert-corner-tl" style={{ borderColor: currentTpl.borderColor, background: 'transparent' }} />
        <div className="cert-corner-ornament cert-corner-tr" style={{ borderColor: currentTpl.borderColor, background: 'transparent' }} />
        <div className="cert-corner-ornament cert-corner-bl" style={{ borderColor: currentTpl.borderColor, background: 'transparent' }} />
        <div className="cert-corner-ornament cert-corner-br" style={{ borderColor: currentTpl.borderColor, background: 'transparent' }} />

        {/* Inner Border Trim */}
        <div
          style={{
            position: 'absolute',
            inset: '6px',
            border: `1px solid ${currentTpl.subBorderColor}50`,
            pointerEvents: 'none',
            borderRadius: '8px',
          }}
        />

        {/* Top Header Row */}
        <div className="cert-top-row">
          <div className="cert-institution-box">
            <img
              src="/assets/logo.png"
              alt="Academy Crest"
              className="cert-inst-logo"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div>
              <div className="cert-inst-title" style={{ color: currentTpl.primaryColor }}>
                {displayInst}
              </div>
              <div className="cert-inst-sub">{currentTpl.defaultInstSub}</div>
            </div>
          </div>

          <div
            className="cert-verification-pill"
            style={{ border: `1px solid ${currentTpl.subBorderColor}40` }}
          >
            <div className="cert-verif-lbl" style={{ color: currentTpl.borderColor }}>
              {currentTpl.id} Design
            </div>
            <div className="cert-verif-code" style={{ color: currentTpl.primaryColor }}>
              {certificate_id || 'CERT-PREVIEW'}
            </div>
          </div>
        </div>

        {/* Center Certificate Content */}
        <div className="cert-center-body">
          <h2 className="cert-main-headline" style={{ color: currentTpl.titleColor }}>
            {displayTitle}
          </h2>
          <p className="cert-pre-text">This official credential is formally conferred upon</p>

          <div className="cert-recipient-name" style={{ color: currentTpl.recipientColor }}>
            {name || 'Candidate Name'}
          </div>

          <div className="cert-statement-text">
            for successfully satisfying all academic rigor, comprehensive assessments, and demonstrating mastery in
            <span
              className="cert-course-badge"
              style={{
                background: currentTpl.courseBadgeBg,
                color: currentTpl.courseBadgeColor,
                borderColor: `${currentTpl.courseBadgeColor}40`,
              }}
            >
              {course || 'Professional Certification Course'}
            </span>
            with an evaluation grade of <strong>{grade || 'A+ (Distinction)'}</strong>.
          </div>
        </div>

        {/* Footer Signature & Seal Row */}
        <div className="cert-footer-row">
          {/* Issue Date Column */}
          <div className="cert-sign-col">
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: currentTpl.primaryColor }}>
              {issue_date || '2026-10-15'}
            </div>
            <div className="cert-sign-name" style={{ borderTop: `1px solid ${currentTpl.subBorderColor}60` }}>
              Date of Issue
            </div>
            <div className="cert-sign-role">Official Registry</div>
          </div>

          {/* Dynamic 3D Seal */}
          <div
            className="cert-gold-seal"
            style={{
              background: currentTpl.sealBg,
              border: currentTpl.sealBorder,
              whiteSpace: 'pre-line',
            }}
          >
            {currentTpl.sealText}
          </div>

          {/* QR Verification Badge */}
          <Link
            to={`/verify/${certificate_id || 'CERT-1001'}`}
            title="Scan or Click to Verify Tamper-Proof Cryptographic Hash"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              background: '#FFFFFF',
              border: `1px solid ${currentTpl.borderColor}50`,
              padding: '0.35rem 0.55rem',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <QrCode size={34} color={currentTpl.primaryColor} />
            <span
              style={{
                fontSize: '0.58rem',
                fontWeight: 800,
                color: currentTpl.primaryColor,
                marginTop: '2px',
                textTransform: 'uppercase',
              }}
            >
              Scan to Verify
            </span>
          </Link>

          {/* Signatory Column */}
          <div className="cert-sign-col">
            <img
              src="/assets/signature.png"
              alt="Signatory Signature"
              className="cert-sign-img"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="cert-sign-name" style={{ borderTop: `1px solid ${currentTpl.subBorderColor}60` }}>
              {displaySignatory}
            </div>
            <div className="cert-sign-role">{displaySignatoryRole}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview;
