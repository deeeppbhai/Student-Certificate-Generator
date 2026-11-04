import React, { useState } from 'react';
import { User, Mail, BookOpen, Award, Calendar, Layers, Sparkles, CheckCircle2, Sliders } from 'lucide-react';
import { studentService, certificateService } from '../services/api';

const CertificateForm = ({ formData, setFormData, onGenerateSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const studentRes = await studentService.create({
        student_id: formData.student_id || `STU-${Math.floor(100 + Math.random() * 900)}`,
        name: formData.name,
        email: formData.email,
        course: formData.course,
        grade: formData.grade,
        issue_date: formData.issue_date,
      });

      const certRes = await certificateService.generate(
        [studentRes.id],
        formData.template_name || 'Standard',
        {
          institution_name: formData.institution_name,
          cert_title: formData.cert_title,
          signatory_name: formData.signatory_name,
          signatory_title: formData.signatory_title,
        }
      );

      setMessage({ type: 'success', text: 'Certificate generated & issued successfully with selected template!' });
      if (onGenerateSuccess) {
        onGenerateSuccess(certRes);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to generate certificate.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem 2.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold-400)',
              boxShadow: '0 4px 12px var(--gold-glow)',
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: '#FFF' }}>
              Recipient Metadata & Template Design
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Configure student credentials and select custom certificate layout
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Sliders size={14} />
          {showAdvanced ? 'Hide Custom Branding' : 'Custom Branding'}
        </button>
      </div>

      {message && (
        <div
          style={{
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(244, 63, 94, 0.14)',
            border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            color: message.type === 'success' ? 'var(--emerald-400)' : 'var(--rose-400)',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {message.type === 'success' && <CheckCircle2 size={16} />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Student ID</label>
            <input
              type="text"
              name="student_id"
              className="form-input"
              value={formData.student_id}
              onChange={handleChange}
              placeholder="e.g. STU-201"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Student Full Name</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Ananya Sharma"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            name="email"
            className="form-input"
            value={formData.email}
            onChange={handleChange}
            placeholder="e.g. ananya@example.com"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Course / Program Specialization</label>
          <input
            type="text"
            name="course"
            className="form-input"
            value={formData.course}
            onChange={handleChange}
            placeholder="e.g. Artificial Intelligence & Machine Learning"
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Performance Grade</label>
            <select name="grade" className="form-input" value={formData.grade} onChange={handleChange}>
              <option value="O (Outstanding)">O (Outstanding)</option>
              <option value="A+ (Distinction)">A+ (Distinction)</option>
              <option value="A (Excellence)">A (Excellence)</option>
              <option value="B+ (Very Good)">B+ (Very Good)</option>
              <option value="First Class">First Class</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Issue Date</label>
            <input
              type="date"
              name="issue_date"
              className="form-input"
              value={formData.issue_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Custom Template</label>
            <select
              name="template_name"
              className="form-input"
              value={formData.template_name}
              onChange={handleChange}
            >
              <option value="Standard">Executive Gold (Standard)</option>
              <option value="Modern Tech">Modern Tech (Cyber Cyan)</option>
              <option value="Academic Burgundy">Academic Prestige (Burgundy)</option>
              <option value="Minimalist Platinum">Minimalist Platinum (Emerald)</option>
            </select>
          </div>
        </div>

        {/* Advanced Branding Options */}
        {showAdvanced && (
          <div
            style={{
              marginTop: '1.25rem',
              padding: '1.25rem',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '12px',
              border: '1px dashed var(--border-glow)',
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold-400)', marginBottom: '1rem' }}>
              Custom Academy Branding & Authority Overrides
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Custom Institution Name</label>
                <input
                  type="text"
                  name="institution_name"
                  className="form-input"
                  value={formData.institution_name || ''}
                  onChange={handleChange}
                  placeholder="e.g. Stanford Technology Institute"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Custom Certificate Headline</label>
                <input
                  type="text"
                  name="cert_title"
                  className="form-input"
                  value={formData.cert_title || ''}
                  onChange={handleChange}
                  placeholder="e.g. Master of Science Award"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Signatory Name</label>
                <input
                  type="text"
                  name="signatory_name"
                  className="form-input"
                  value={formData.signatory_name || ''}
                  onChange={handleChange}
                  placeholder="e.g. Dr. Jennifer Lawrence"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Signatory Title</label>
                <input
                  type="text"
                  name="signatory_title"
                  className="form-input"
                  value={formData.signatory_title || ''}
                  onChange={handleChange}
                  placeholder="e.g. Dean of Graduate Studies"
                />
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '1.5rem', padding: '0.85rem' }}
          disabled={loading}
        >
          {loading ? 'Rendering Custom Vector PDF...' : '✨ Generate & Issue Certificate'}
        </button>
      </form>
    </div>
  );
};

export default CertificateForm;
