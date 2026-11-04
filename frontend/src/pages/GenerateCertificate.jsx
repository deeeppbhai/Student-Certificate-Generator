import React, { useState } from 'react';
import CertificateForm from '../components/CertificateForm';
import CertificatePreview from '../components/CertificatePreview';
import confetti from 'canvas-confetti';

const GenerateCertificate = () => {
  const [formData, setFormData] = useState({
    student_id: 'STU-108',
    name: 'Ananya Sharma',
    email: 'ananya.sharma@example.com',
    course: 'Artificial Intelligence & Machine Learning',
    grade: 'O (Outstanding)',
    issue_date: new Date().toISOString().split('T')[0],
    template_name: 'Standard',
    institution_name: '',
    cert_title: '',
    signatory_name: '',
    signatory_title: '',
  });

  const [lastGeneratedCert, setLastGeneratedCert] = useState(null);

  const handleGenerateSuccess = (certResult) => {
    confetti({ particleCount: 110, spread: 75, origin: { y: 0.6 } });
    if (certResult?.certificates && certResult.certificates.length > 0) {
      setLastGeneratedCert(certResult.certificates[0]);
    }
  };

  const previewData = {
    student_id: formData.student_id,
    name: formData.name,
    email: formData.email,
    course: formData.course,
    grade: formData.grade,
    issue_date: formData.issue_date,
    certificate_id: lastGeneratedCert?.certificate_id || 'CERT-LIVE-PREVIEW',
    template_name: formData.template_name,
    institution_name: formData.institution_name,
    cert_title: formData.cert_title,
    signatory_name: formData.signatory_name,
    signatory_title: formData.signatory_title,
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <div className="page-header-text">
          <h2 className="page-title">Certificate Design & Generation Studio</h2>
          <p className="page-subtitle">
            Configure student metadata, select custom vector templates, and preview real-time PDF canvas before issuing official credentials.
          </p>
        </div>
      </div>

      <div className="dashboard-split-layout with-preview">
        <div>
          <CertificateForm
            formData={formData}
            setFormData={setFormData}
            onGenerateSuccess={handleGenerateSuccess}
          />
        </div>

        <div className="sticky-visualizer-col">
          <CertificatePreview
            studentData={previewData}
            onTemplateChange={(tpl) => setFormData((prev) => ({ ...prev, template_name: tpl }))}
          />
        </div>
      </div>
    </div>
  );
};

export default GenerateCertificate;
