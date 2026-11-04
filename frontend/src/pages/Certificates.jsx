import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Download, FileArchive, CheckCircle2, ShieldCheck, ExternalLink, RefreshCw } from 'lucide-react';
import { certificateService } from '../services/api';
import DownloadButton from '../components/DownloadButton';

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      const res = await certificateService.getAll();
      setCertificates(res);
    } catch (err) {
      console.error('Failed to load certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
  }, []);

  const filteredCerts = certificates.filter(
    (c) =>
      c.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.certificate_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.course_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="main-content">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h2 className="page-title">Certificates Repository Archive</h2>
          <p className="page-subtitle">
            Inspect generated PDF credentials, verify unique certificates, and export ZIP bundles.
          </p>
        </div>
        <div className="header-action-group">
          <button className="btn btn-secondary" onClick={loadCertificates} title="Refresh Live Database">
            <RefreshCw size={15} /> Refresh
          </button>
          <DownloadButton mode="zip" label="Export All Certificates (ZIP)" />
        </div>
      </div>

      {/* Table Container with Search */}
      <div className="glass-panel table-panel">
        <div className="table-toolbar">
          <div className="search-box-wrap">
            <Search size={18} className="search-icon-pos" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by Verification Code, Candidate Name, or Course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
            Total Issued: <span style={{ color: 'var(--gold-400)' }}>{certificates.length}</span> credentials
          </div>
        </div>

        <div className="table-responsive-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Verification Code</th>
                <th>Recipient Name</th>
                <th>Course Program</th>
                <th>Grade</th>
                <th>Issue Date</th>
                <th>Template</th>
                <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-tertiary)' }}>
                    Loading certificate repository...
                  </td>
                </tr>
              ) : filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-tertiary)' }}>
                    No certificates issued yet. Upload an Excel spreadsheet in the Dashboard to validate data and generate official credentials.
                  </td>
                </tr>
              ) : (
                filteredCerts.map((cert) => (
                  <tr key={cert.id}>
                    <td>
                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          color: 'var(--gold-400)',
                          background: 'rgba(245, 158, 11, 0.1)',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}
                      >
                        {cert.certificate_id}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {cert.student_name || cert.name || cert.candidate_name || 'Candidate'}
                    </td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{cert.course_name}</td>
                    <td>
                      <span className="badge badge-grade">{cert.grade}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{cert.issue_date}</td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--indigo-400)' }}>
                        {cert.template_name}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '1.2rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                        <Link
                          to={`/verify/${cert.certificate_id}`}
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          title="Verify Credential Authenticity"
                        >
                          <ShieldCheck size={14} color="var(--emerald-400)" /> Verify
                        </Link>
                        <a
                          href={certificateService.getSingleDownloadUrl(cert.certificate_id)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-accent"
                          style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
                        >
                          <Download size={14} /> Download PDF
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Certificates;
