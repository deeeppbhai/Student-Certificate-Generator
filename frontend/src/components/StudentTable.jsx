import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, CheckCircle2, Clock, Trash2, Zap, Download, Sparkles, ShieldCheck, Palette, FileArchive } from 'lucide-react';
import { certificateService, studentService } from '../services/api';

const StudentTable = ({ students, onRefresh, onSelectStudentForPreview, selectedStudentId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('Standard');

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PENDING' && s.status !== 'Generated') ||
      (statusFilter === 'ISSUED' && s.status === 'Generated');

    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredStudents.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBatchGenerate = async () => {
    if (selectedIds.length === 0) return;
    setGenerating(true);
    try {
      await certificateService.generate(selectedIds, selectedTemplate);
      setSelectedIds([]);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Failed to generate certificates: ' + (err.response?.data?.detail || err.message));
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadSelectedZip = async () => {
    const selectedStudents = students.filter((s) => selectedIds.includes(s.id) && s.certificate_id);
    if (selectedStudents.length === 0) {
      alert('None of the selected students have issued certificates yet.');
      return;
    }

    try {
      const certIds = selectedStudents.map((s) => s.certificate_id);
      const blob = await certificateService.downloadSelectedZip(certIds);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `selected_certificates_${certIds.length}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download selected ZIP bundle.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student record?')) return;
    try {
      await studentService.delete(id);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Delete failed.');
    }
  };

  const handleAutoDownloadAllPDFs = () => {
    const generated = filteredStudents.filter((s) => s.status === 'Generated' && s.certificate_id);
    if (generated.length === 0) {
      alert('No generated PDF certificates available to download yet.');
      return;
    }

    generated.forEach((student, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = certificateService.getSingleDownloadUrl(student.certificate_id);
        link.download = `${student.certificate_id}_${student.name.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 300);
    });
  };

  return (
    <div className="glass-panel table-panel">
      {/* Table Toolbar */}
      <div className="table-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '320px', flexWrap: 'wrap' }}>
          <div className="search-box-wrap" style={{ flex: '1 1 240px', maxWidth: '360px' }}>
            <Search size={17} className="search-icon-pos" />
            <input
              type="text"
              className="search-input"
              placeholder="Search student by name, ID, or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            <button
              className={`btn ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
              onClick={() => setStatusFilter('ALL')}
            >
              All ({students.length})
            </button>
            <button
              className={`btn ${statusFilter === 'PENDING' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
              onClick={() => setStatusFilter('PENDING')}
            >
              Pending ({students.filter((s) => s.status !== 'Generated').length})
            </button>
            <button
              className={`btn ${statusFilter === 'ISSUED' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
              onClick={() => setStatusFilter('ISSUED')}
            >
              Issued ({students.filter((s) => s.status === 'Generated').length})
            </button>
          </div>
        </div>

        <div className="table-action-buttons" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={handleAutoDownloadAllPDFs}
            title="Download individual PDFs sequentially"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
          >
            <Download size={14} /> Auto-Download All PDFs
          </button>

          {selectedIds.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {/* Template selector for batch generation */}
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="form-select"
                style={{
                  padding: '0.4rem 0.65rem',
                  fontSize: '0.8rem',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid var(--border-glow)',
                  color: '#FFF',
                }}
              >
                <option value="Standard">Executive Gold</option>
                <option value="Modern Tech">Modern Tech</option>
                <option value="Academic Burgundy">Academic Burgundy</option>
                <option value="Minimalist Platinum">Minimalist Platinum</option>
              </select>

              <button
                className="btn btn-primary"
                onClick={handleBatchGenerate}
                disabled={generating}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
              >
                <Zap size={14} />
                {generating ? 'Issuing...' : `Batch Generate (${selectedIds.length})`}
              </button>

              <button
                className="btn btn-secondary"
                onClick={handleDownloadSelectedZip}
                title="Download ZIP for selected"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
              >
                <FileArchive size={14} /> ZIP ({selectedIds.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Responsive Table Container */}
      <div className="table-responsive-container">
        <table className="custom-table" style={{ width: '100%', minWidth: '700px' }}>
          <thead>
            <tr>
              <th style={{ width: '38px', textAlign: 'center', padding: '0.85rem 0.4rem' }}>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={filteredStudents.length > 0 && selectedIds.length === filteredStudents.length}
                  style={{ accentColor: 'var(--gold-400)', cursor: 'pointer' }}
                />
              </th>
              <th style={{ minWidth: '150px' }}>Student Details</th>
              <th style={{ minWidth: '135px' }}>Course / Specialization</th>
              <th style={{ width: '85px', whiteSpace: 'nowrap' }}>Grade</th>
              <th style={{ width: '100px', whiteSpace: 'nowrap' }}>Issue Date</th>
              <th style={{ width: '85px', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ width: '150px', textAlign: 'right', whiteSpace: 'nowrap', paddingRight: '1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      No Certificates Generated Yet
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', maxWidth: '420px' }}>
                      Upload an Excel spreadsheet (.xlsx / .xls) to validate student records and generate official vector certificates.
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => {
                const isSelected = selectedStudentId === student.id;
                return (
                  <tr key={student.id} className={isSelected ? 'active-preview-row' : ''}>
                    <td style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(student.id)}
                        onChange={() => handleSelectOne(student.id)}
                        style={{ accentColor: 'var(--gold-400)', cursor: 'pointer' }}
                      />
                    </td>
                    <td>
                      <div className="student-name-stack">
                        <span className="student-display-name">{student.name}</span>
                        <span className="student-meta-sub">
                          {student.student_id} • {student.email}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{student.course}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className="badge badge-grade" style={{ whiteSpace: 'nowrap' }}>{student.grade}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                      {student.issue_date}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {student.status === 'Generated' ? (
                        <span className="badge badge-success" style={{ whiteSpace: 'nowrap' }}>
                          <CheckCircle2 size={12} /> Issued
                        </span>
                      ) : (
                        <span className="badge badge-pending" style={{ whiteSpace: 'nowrap' }}>
                          <Clock size={12} /> Pending
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '1.25rem', whiteSpace: 'nowrap' }}>
                      <div className="row-actions-group">
                        <button
                          className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => onSelectStudentForPreview && onSelectStudentForPreview(student)}
                          title="Preview in Canvas"
                          style={{ padding: '0.35rem 0.65rem' }}
                        >
                          <Eye size={13} /> {isSelected ? 'Viewing' : 'Preview'}
                        </button>

                        {student.status === 'Generated' && student.certificate_id && (
                          <>
                            <Link
                              to={`/verify/${student.certificate_id}`}
                              className="btn btn-secondary"
                              title="Verify Certificate Authenticity"
                              style={{ padding: '0.35rem 0.6rem' }}
                            >
                              <ShieldCheck size={13} color="var(--emerald-400)" /> Verify
                            </Link>
                            <a
                              href={certificateService.getSingleDownloadUrl(student.certificate_id)}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-accent"
                              title="Download Vector PDF"
                              style={{ padding: '0.35rem 0.65rem' }}
                            >
                              <Download size={13} /> PDF
                            </a>
                          </>
                        )}

                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(student.id)}
                          title="Delete Student Record"
                          style={{ padding: '0.35rem 0.55rem' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentTable;
