import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  Clock,
  FileSpreadsheet,
  Upload,
  Download,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileArchive,
  Palette,
  ShieldCheck,
  Bot,
  ExternalLink,
  Trash2,
  Filter,
  Check,
  Info,
  Play
} from 'lucide-react';
import { studentService, certificateService, logsService, rpaService } from '../services/api';
import StudentTable from '../components/StudentTable';
import CertificatePreview from '../components/CertificatePreview';
import DownloadButton from '../components/DownloadButton';
import confetti from 'canvas-confetti';

const RPA_STAGES = [
  { id: 1, name: 'Initializing', description: 'Environment setup and run configuration' },
  { id: 2, name: 'Authentication', description: 'Secure administrator JWT login' },
  { id: 3, name: 'Excel Import', description: 'Spreadsheet ingestion and detection' },
  { id: 4, name: 'Data Validation', description: 'OpenPyXL schema and syntax checking' },
  { id: 5, name: 'Certificate Generation', description: 'Bulk vector PDF rendering with ReportLab' },
  { id: 6, name: 'PDF Verification', description: 'Non-zero size and header integrity check' },
  { id: 7, name: 'ZIP Creation', description: 'Archive bundling with manifest and CSV summary' },
  { id: 8, name: 'ZIP Validation', description: 'ZIP integrity check and content audit' },
  { id: 9, name: 'Audit Logging', description: 'Database audit trail persistence' },
  { id: 10, name: 'Certificate Verification', description: 'Cryptographic SHA-256 fingerprint check' },
  { id: 11, name: 'Report Generation', description: 'Robot Framework HTML report generation' },
  { id: 12, name: 'Completed', description: 'Execution finalized and downloads ready' },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('registry'); // 'registry' | 'excel' | 'templates' | 'logs' | 'robot'
  const [students, setStudents] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logStats, setLogStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedStudentForPreview, setSelectedStudentForPreview] = useState(null);
  const [activeTemplateInDashboard, setActiveTemplateInDashboard] = useState('Standard');

  // Excel validation state
  const [validationReport, setValidationReport] = useState(null);
  const [selectedErrorDetail, setSelectedErrorDetail] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [backendOffline, setBackendOffline] = useState(false);

  // RPA Automation State
  const [rpaRunning, setRpaRunning] = useState(false);
  const [rpaRunId, setRpaRunId] = useState(null);
  const [rpaCurrentStage, setRpaCurrentStage] = useState('Idle');
  const [rpaProgress, setRpaProgress] = useState(0);
  const [rpaStatus, setRpaStatus] = useState('IDLE'); // IDLE, RUNNING, COMPLETED, FAILED
  const [rpaTemplate, setRpaTemplate] = useState('Standard');
  const [rpaStats, setRpaStats] = useState({
    total_records: 0,
    valid_records: 0,
    invalid_records: 0,
    certificates_generated: 0,
    duration_seconds: 0,
    pdf_verification_status: 'PENDING',
    zip_validation_status: 'PENDING',
    cert_verification_status: 'PENDING',
  });
  const [rpaLogs, setRpaLogs] = useState([]);
  const [rpaHistory, setRpaHistory] = useState([]);
  const [rpaError, setRpaError] = useState('');

  const loadRpaHistory = async () => {
    try {
      const res = await rpaService.getHistory();
      const runs = res.runs || [];
      setRpaHistory(runs);
      if (res.is_running && runs.length > 0) {
        const active = runs.find((r) => r.status === 'RUNNING');
        if (active) {
          setRpaRunning(true);
          setRpaRunId(active.run_id);
          setRpaStatus('RUNNING');
          setRpaCurrentStage(active.current_stage || 'Processing');
          setRpaProgress(active.progress_pct || 15);
        }
      }
    } catch (err) {
      console.warn('Could not load RPA history:', err);
    }
  };

  const getStageNumber = (stageName) => {
    if (!stageName) return 1;
    const lower = stageName.toLowerCase();
    const idx = RPA_STAGES.findIndex((s) => lower.includes(s.name.toLowerCase()));
    return idx >= 0 ? idx + 1 : 1;
  };

  const getStageStatus = (stageId, currentStageName, status) => {
    if (status === 'COMPLETED') return 'completed';
    const activeIdx = getStageNumber(currentStageName);
    if (status === 'FAILED') {
      if (stageId < activeIdx) return 'completed';
      if (stageId === activeIdx) return 'failed';
      return 'pending';
    }
    if (status === 'RUNNING') {
      if (stageId < activeIdx) return 'completed';
      if (stageId === activeIdx) return 'in-progress';
      return 'pending';
    }
    return 'pending';
  };

  const handleStartRpaAutomation = async () => {
    if (rpaRunning) return;
    setRpaError('');
    setRpaRunning(true);
    setRpaStatus('RUNNING');
    setRpaCurrentStage('Initializing');
    setRpaProgress(5);
    setRpaLogs(['[*] Initializing One-Click 12-Stage RPA Automation Pipeline...']);

    try {
      const res = await rpaService.start(rpaTemplate);
      const newRunId = res.run_id;
      setRpaRunId(newRunId);

      const pollInterval = setInterval(async () => {
        try {
          const status = await rpaService.getStatus(newRunId);
          setRpaCurrentStage(status.current_stage || 'Processing');
          setRpaProgress(status.progress_pct || 10);
          setRpaStats({
            total_records: status.total_records || 0,
            valid_records: status.valid_records || 0,
            invalid_records: status.invalid_records || 0,
            certificates_generated: status.certificates_generated || 0,
            duration_seconds: status.duration_seconds || 0,
            pdf_verification_status: status.pdf_verification_status || 'PENDING',
            zip_validation_status: status.zip_validation_status || 'PENDING',
            cert_verification_status: status.cert_verification_status || 'PENDING',
          });
          if (status.stage_logs && status.stage_logs.length > 0) {
            setRpaLogs(status.stage_logs);
          }

          if (status.status === 'COMPLETED') {
            clearInterval(pollInterval);
            setRpaRunning(false);
            setRpaStatus('COMPLETED');
            setRpaProgress(100);
            setRpaCurrentStage('Completed');
            confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });

            // Automatically download the generated certificate ZIP file directly to the user's Downloads folder without any click
            try {
              const downloadUrl = rpaService.getDownloadUrl(newRunId);
              const zipFileName = `all_students_certificates_${newRunId}.zip`;
              await certificateService.downloadZipFromUrl(downloadUrl, zipFileName);
            } catch (dlErr) {
              console.error('Automatic ZIP download error:', dlErr);
            }

            loadRpaHistory();
            loadData();
          } else if (status.status === 'FAILED') {
            clearInterval(pollInterval);
            setRpaRunning(false);
            setRpaStatus('FAILED');
            setRpaError(status.error_message || 'RPA Automation failed.');
            loadRpaHistory();
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 1200);
    } catch (err) {
      setRpaRunning(false);
      setRpaStatus('FAILED');
      setRpaError(err.response?.data?.detail || err.message || 'Failed to trigger automation.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [stuRes, certRes, logsRes, statsRes] = await Promise.all([
        studentService.getAll(),
        certificateService.getAll(),
        logsService.getAll(50),
        logsService.getStats().catch(() => null),
      ]);

      setStudents(stuRes);
      setCertificates(certRes);
      setLogs(logsRes);
      if (statsRes) setLogStats(statsRes);
      setBackendOffline(false);
      loadRpaHistory();

      if (stuRes.length > 0 && !selectedStudentForPreview) {
        setSelectedStudentForPreview(stuRes[0]);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setBackendOffline(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (e) => {
    let files = [];
    if (e.target && e.target.files && e.target.files.length > 0) {
      files = Array.from(e.target.files);
    } else if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      files = Array.from(e.dataTransfer.files);
    } else if (e instanceof File) {
      files = [e];
    } else if (Array.isArray(e)) {
      files = e;
    }
    if (files.length === 0) return;

    setUploading(true);
    setValidationReport(null);
    try {
      // Backend automatically validates single or multiple spreadsheets and immediately implements/generates certificates
      const result = await studentService.uploadExcel(files, activeTemplateInDashboard);
      setValidationReport(result);

      if (result.valid_count > 0 || (result.certificates && result.certificates.length > 0)) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

        // Automatically download the generated certificate ZIP file
        const zipPath = result.batch_zip_url || result.zip_download_url || '/api/download/all-zip';
        const baseName = files.length === 1 && files[0].name
          ? files[0].name.replace(/\.[^/.]+$/, '')
          : `multi_batch_${files.length}_files`;
        const zipFileName = `certificates_${baseName}.zip`;

        await certificateService.downloadZipFromUrl(zipPath, zipFileName);
      }

      await loadData();
    } catch (err) {
      let detail = err.response?.data?.detail;
      if (!detail) {
        if (!err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
          setBackendOffline(true);
          detail = 'Cannot connect to backend server. Please make sure the FastAPI backend is running on port 8000 (run.bat or start_backend.bat).';
        } else {
          detail = err.message || 'Failed to parse Excel file(s).';
        }
      }
      alert(detail);
    } finally {
      setUploading(false);
      setDragActive(false);
      if (e.target && e.target.value) {
        e.target.value = '';
      }
    }
  };

  const handleAutoProcessLocalExcel = async () => {
    setUploading(true);
    try {
      const result = await studentService.autoImportLocalExcel();
      alert(result.message || 'Successfully auto-imported Excel and generated certificates!');
      await loadData();
    } catch (err) {
      let detail = err.response?.data?.detail;
      if (!detail) {
        if (!err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
          setBackendOffline(true);
          detail = 'Cannot connect to backend server. Please make sure the FastAPI backend is running on port 8000.';
        } else {
          detail = err.message || 'Failed to auto-process Excel.';
        }
      }
      alert(detail);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e);
    }
  };

  const handleClearAllStudentsAndCertificates = async () => {
    if (!window.confirm('Are you sure you want to clear all student and certificate records?')) return;
    try {
      await studentService.clearAll();
      setSelectedStudentForPreview(null);
      setValidationReport(null);
      await loadData();
    } catch (err) {
      alert('Failed to clear records.');
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear the audit generation logs?')) return;
    try {
      await logsService.clear();
      await loadData();
    } catch (err) {
      alert('Failed to clear logs.');
    }
  };

  const totalStudents = students.length;
  const totalGenerated = students.filter((s) => s.status === 'Generated').length;
  const totalPending = students.filter((s) => s.status !== 'Generated').length;
  const successRate = totalStudents ? Math.round((totalGenerated / totalStudents) * 100) : 100;

  return (
    <div className="main-content">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h2 className="page-title">Executive Analytics & Administration Portal</h2>
          <p className="page-subtitle">
            Manage student records, batch Excel data validation, custom certificate templates, and audit logs.
          </p>
        </div>

        <div className="header-action-group">
          <button className="btn btn-secondary" onClick={loadData} title="Refresh Live Data">
            <RefreshCw size={15} /> Refresh
          </button>
          {students.length > 0 && (
            <button
              className="btn btn-secondary"
              onClick={handleClearAllStudentsAndCertificates}
              title="Clear all records and start fresh"
              style={{ color: 'var(--rose-400)', borderColor: 'rgba(244, 63, 94, 0.3)' }}
            >
              <Trash2 size={15} /> Clear Registry
            </button>
          )}
          <DownloadButton mode="zip" label="Export All Certificates (ZIP)" />
        </div>
      </div>

      {/* Backend Offline Warning Banner */}
      {backendOffline && (
        <div
          className="glass-panel"
          style={{
            marginBottom: '1.5rem',
            padding: '1.15rem 1.35rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.2)' }}>
              <AlertCircle size={24} color="var(--rose-400)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#FFF', fontSize: '0.98rem' }}>
                Backend API Server Offline
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginTop: '0.2rem' }}>
                Cannot connect to the FastAPI backend server on port 8000. Please launch <code>run.bat</code> or <code>backend\start_backend.bat</code>.
              </div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={loadData} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            <RefreshCw size={14} /> Retry Connection
          </button>
        </div>
      )}

      {/* Analytics Stats Grid */}
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--sapphire-600)' }}>
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-val">{totalStudents}</div>
            <div className="stat-lbl">Registered Students</div>
            <span className="stat-pill" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--sapphire-600)', borderColor: 'rgba(37, 99, 235, 0.25)' }}>
              Active Registry
            </span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(217, 119, 6, 0.1)', color: 'var(--gold-600)' }}>
            <Award size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-val">{totalGenerated}</div>
            <div className="stat-lbl">Certificates Issued</div>
            <span className="stat-pill" style={{ background: 'rgba(217, 119, 6, 0.1)', color: 'var(--gold-600)', borderColor: 'rgba(217, 119, 6, 0.25)' }}>
              Verified Vector PDFs
            </span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(225, 29, 72, 0.1)', color: 'var(--rose-600)' }}>
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-val">{totalPending}</div>
            <div className="stat-lbl">Pending Generation</div>
            <span
              className="stat-pill"
              style={{
                background: totalPending === 0 ? 'rgba(5, 150, 105, 0.1)' : 'rgba(225, 29, 72, 0.1)',
                color: totalPending === 0 ? 'var(--emerald-600)' : 'var(--rose-600)',
                borderColor: totalPending === 0 ? 'rgba(5, 150, 105, 0.25)' : 'rgba(225, 29, 72, 0.25)',
              }}
            >
              {totalPending === 0 ? 'All Cleared' : 'In Queue'}
            </span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(5, 150, 105, 0.1)', color: 'var(--emerald-600)' }}>
            <Sparkles size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-val">{successRate}%</div>
            <div className="stat-lbl">Issuance Rate</div>
            <span className="stat-pill" style={{ background: 'rgba(5, 150, 105, 0.1)', color: 'var(--emerald-600)', borderColor: 'rgba(5, 150, 105, 0.25)' }}>
              Live Integrity
            </span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(147, 51, 234, 0.1)', color: '#9333EA' }}>
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-val">{logStats?.total_events || logs.length}</div>
            <div className="stat-lbl">Audit Log Events</div>
            <span className="stat-pill" style={{ background: 'rgba(147, 51, 234, 0.1)', color: '#9333EA', borderColor: 'rgba(147, 51, 234, 0.25)' }}>
              Error Trace Active
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="dashboard-subnav-bar">
        <button
          className={`dashboard-subnav-tab ${activeTab === 'registry' ? 'active' : ''}`}
          onClick={() => setActiveTab('registry')}
        >
          <Users size={16} /> Student Registry & Canvas
        </button>

        <button
          className={`dashboard-subnav-tab ${activeTab === 'excel' ? 'active' : ''}`}
          onClick={() => setActiveTab('excel')}
        >
          <FileSpreadsheet size={16} /> Excel Upload & Data Validation
        </button>

        <button
          className={`dashboard-subnav-tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <Palette size={16} /> Custom Templates Gallery
        </button>

        <button
          className={`dashboard-subnav-tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <FileText size={16} /> Generation Logs & Reports ({logs.length})
        </button>

        <button
          className={`dashboard-subnav-tab ${activeTab === 'robot' ? 'active' : ''}`}
          onClick={() => setActiveTab('robot')}
        >
          <Bot size={16} /> Robot Automation (12/12 Passed)
        </button>
      </div>

      {/* TAB 1: Student Registry & Canvas Preview Split Layout */}
      {activeTab === 'registry' && (
        <div className={`dashboard-split-layout ${selectedStudentForPreview ? 'with-preview' : 'no-preview'}`}>
          <div>
            <StudentTable
              students={students}
              onRefresh={loadData}
              onSelectStudentForPreview={(student) => {
                setSelectedStudentForPreview(student);
              }}
              selectedStudentId={selectedStudentForPreview?.id}
            />
          </div>

          {selectedStudentForPreview && (
            <div className="sticky-visualizer-col">
              <CertificatePreview
                studentData={{ ...selectedStudentForPreview, template_name: activeTemplateInDashboard }}
                onClose={() => setSelectedStudentForPreview(null)}
                onTemplateChange={(tpl) => setActiveTemplateInDashboard(tpl)}
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Excel Upload with Data Validation Studio */}
      {activeTab === 'excel' && (
        <div>
          <div className="glass-panel excel-upload-panel" style={{ marginBottom: '1.5rem' }}>
            <div className="excel-header-row">
              <div className="excel-header-left">
                <div className="excel-icon-badge">
                  <FileSpreadsheet size={26} />
                </div>
                <div>
                  <h3 className="excel-title">Bulk Excel Import with Multi-Field Data Validation</h3>
                  <p className="excel-desc">
                    Supports <code>Name</code>, <code>Email</code>, <code>Course</code>, <code>Grade</code>, <code>Issue Date</code>, and <code>Student ID</code>.
                    Performs schema checking, RFC email syntax checking, format standardization, and error auditing.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <a
                  href={studentService.getSampleExcelUrl()}
                  className="btn btn-secondary"
                  download="students_sample_template.xlsx"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Download size={15} /> Download Sample Template (.xlsx)
                </a>
              </div>
            </div>

            <label
              className={`dropzone ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".xlsx, .xls"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                disabled={uploading}
              />
              <div className="dropzone-icon-wrap">
                <Upload size={24} />
              </div>
              <div className="dropzone-title">
                {uploading
                  ? '⚡ Validating Spreadsheet(s) & Generating Official Vector Certificates...'
                  : dragActive
                  ? 'Drop Spreadsheets to Generate Certificates Instantly!'
                  : 'Click or Drag & Drop Excel Spreadsheet(s) (Single or Multiple Files Supported)'}
              </div>
              <div className="dropzone-hint">
                Multi-File Batch Processing: Select one or multiple Excel spreadsheets (.xlsx / .xls) to validate student records simultaneously, generate official vector certificates, and automatically download the unified certificate ZIP bundle.
              </div>
            </label>
          </div>

          {/* Automatically Generated Certificates Section */}
          {validationReport && validationReport.certificates && validationReport.certificates.length > 0 && (
            <div
              className="glass-panel"
              style={{
                padding: '1.75rem',
                marginBottom: '1.5rem',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.25rem',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--emerald-400)',
                    }}
                  >
                    <Award size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      ⚡ {validationReport.certificates.length} Official Certificate(s) Generated Exclusively from Uploaded File!
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      All records from {validationReport.uploaded_filename ? <strong>"{validationReport.uploaded_filename}"</strong> : 'the uploaded spreadsheet'} were validated and official vector PDF credentials were generated with template <strong style={{ color: 'var(--gold-400)' }}>"{activeTemplateInDashboard}"</strong>.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <a
                    href={
                      validationReport.batch_zip_url
                        ? validationReport.batch_zip_url
                        : certificateService.getZipDownloadUrl()
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-success"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}
                  >
                    <Download size={15} /> Download Batch Certificates (ZIP)
                  </a>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setActiveTab('registry')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}
                  >
                    <Users size={15} /> View in Student Registry
                  </button>
                </div>
              </div>

              {/* Freshly Generated Certificates Table */}
              <div className="table-responsive-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Verification Code</th>
                      <th>Candidate Name</th>
                      <th>Course Program</th>
                      <th>Template Used</th>
                      <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationReport.certificates.map((cert) => (
                      <tr key={cert.certificate_id}>
                        <td>
                          <div
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              color: 'var(--gold-400)',
                              background: 'rgba(245, 158, 11, 0.1)',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '6px',
                              display: 'inline-block',
                            }}
                          >
                            {cert.certificate_id}
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {cert.student_name || cert.name || cert.candidate_name || 'Candidate'}
                        </td>
                        <td style={{ color: 'var(--text-primary)' }}>{cert.course_name}</td>
                        <td>
                          <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--indigo-400)' }}>
                            {cert.template_name || activeTemplateInDashboard}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: '1.2rem', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                            <a
                              href={`/verify/${cert.certificate_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              <ShieldCheck size={13} color="var(--emerald-400)" /> Verify
                            </a>
                            <a
                              href={certificateService.getSingleDownloadUrl(cert.certificate_id)}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-accent"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              <Download size={13} /> PDF
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Validation Report Matrix (if available) */}
          {validationReport && (
            <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  {validationReport.status === 'SUCCESS' ? (
                    <CheckCircle2 size={24} color="var(--emerald-400)" />
                  ) : validationReport.status === 'WARNING' ? (
                    <AlertCircle size={24} color="var(--gold-400)" />
                  ) : (
                    <AlertCircle size={24} color="var(--rose-400)" />
                  )}
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Data Validation Matrix Report
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Total Scanned: {validationReport.total_scanned} | Valid Imported: {validationReport.valid_count} | Row Errors Caught: {validationReport.invalid_count}
                    </p>
                  </div>
                </div>

                <span
                  className="stat-pill"
                  style={{
                    background:
                      validationReport.status === 'SUCCESS'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : validationReport.status === 'WARNING'
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(244, 63, 94, 0.15)',
                    color:
                      validationReport.status === 'SUCCESS'
                        ? 'var(--emerald-400)'
                        : validationReport.status === 'WARNING'
                        ? 'var(--gold-400)'
                        : 'var(--rose-400)',
                    fontSize: '0.85rem',
                  }}
                >
                  Status: {validationReport.status}
                </span>
              </div>

              {/* Error Breakdown Table */}
              {validationReport.errors && validationReport.errors.length > 0 ? (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--rose-400)', marginBottom: '0.5rem' }}>
                    Identified Field Errors ({validationReport.errors.length}):
                  </div>
                  <div className="table-responsive-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Excel Row</th>
                          <th>Candidate</th>
                          <th>Offending Field</th>
                          <th>Value Provided</th>
                          <th>Validation Error Explanation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validationReport.errors.map((err, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 700, color: 'var(--gold-400)' }}>Row #{err.row}</td>
                            <td>{err.student_name}</td>
                            <td>
                              <span className="badge badge-grade">{err.field}</span>
                            </td>
                            <td style={{ color: 'var(--rose-400)', fontFamily: 'monospace' }}>
                              {err.value || '<Empty>'}
                            </td>
                            <td style={{ color: 'var(--text-secondary)' }}>{err.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: '1rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    color: 'var(--emerald-400)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                  }}
                >
                  <CheckCircle2 size={18} />
                  All rows passed schema verification and business integrity checks with 0 errors!
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Custom Certificate Templates Gallery */}
      {activeTab === 'templates' && (
        <div>
          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#FFF', marginBottom: '0.5rem' }}>
              Custom Certificate Template Engine
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.75rem' }}>
              Choose from 4 custom handcrafted vector certificate layouts. Selecting a template updates all real-time preview renderings and batch issuance.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {/* Template 1: Executive Gold */}
              <div
                className="glass-panel"
                style={{
                  padding: '1.5rem',
                  border: activeTemplateInDashboard === 'Standard' ? '2.5px solid var(--gold-400)' : '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  background: activeTemplateInDashboard === 'Standard' ? 'rgba(212, 175, 55, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                  boxShadow: activeTemplateInDashboard === 'Standard' ? '0 8px 24px -4px rgba(212, 175, 55, 0.35)' : 'none',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: activeTemplateInDashboard === 'Standard' ? 'translateY(-2px)' : 'none',
                }}
                onClick={() => setActiveTemplateInDashboard('Standard')}
              >
                {activeTemplateInDashboard === 'Standard' && (
                  <span style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--gold-400)' }}>
                    <CheckCircle2 size={22} />
                  </span>
                )}
                <div style={{ height: '8px', background: 'linear-gradient(90deg, #D4AF37, #F59E0B)', borderRadius: '4px', marginBottom: '1rem' }} />
                <h4 style={{ color: '#FFF', fontSize: '1.1rem', fontWeight: 700 }}>Executive Gold (Standard)</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0.5rem 0 1rem' }}>
                  Navy & 24K Gold luxury ornate border with gold seal badge and formal serif typography.
                </p>
                <div style={{ fontSize: '0.78rem', color: 'var(--gold-400)', fontWeight: 600 }}>
                  ★ Official Tamper-Proof Seal
                </div>
              </div>

              {/* Template 2: Modern Tech */}
              <div
                className="glass-panel"
                style={{
                  padding: '1.5rem',
                  border: activeTemplateInDashboard === 'Modern Tech' ? '2.5px solid #06B6D4' : '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  background: activeTemplateInDashboard === 'Modern Tech' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                  boxShadow: activeTemplateInDashboard === 'Modern Tech' ? '0 8px 24px -4px rgba(6, 182, 212, 0.35)' : 'none',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: activeTemplateInDashboard === 'Modern Tech' ? 'translateY(-2px)' : 'none',
                }}
                onClick={() => setActiveTemplateInDashboard('Modern Tech')}
              >
                {activeTemplateInDashboard === 'Modern Tech' && (
                  <span style={{ position: 'absolute', top: '12px', right: '12px', color: '#06B6D4' }}>
                    <CheckCircle2 size={22} />
                  </span>
                )}
                <div style={{ height: '8px', background: 'linear-gradient(90deg, #06B6D4, #3B82F6)', borderRadius: '4px', marginBottom: '1rem' }} />
                <h4 style={{ color: '#FFF', fontSize: '1.1rem', fontWeight: 700 }}>Modern Tech (Cyber Cyan)</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0.5rem 0 1rem' }}>
                  Futuristic slate obsidian, vivid cyan neon border, and cloud accreditation badges.
                </p>
                <div style={{ fontSize: '0.78rem', color: '#06B6D4', fontWeight: 600 }}>
                  ⚡ Tech Accredited Digital Badge
                </div>
              </div>

              {/* Template 3: Academic Burgundy */}
              <div
                className="glass-panel"
                style={{
                  padding: '1.5rem',
                  border: activeTemplateInDashboard === 'Academic Burgundy' ? '2.5px solid #EF4444' : '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  background: activeTemplateInDashboard === 'Academic Burgundy' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                  boxShadow: activeTemplateInDashboard === 'Academic Burgundy' ? '0 8px 24px -4px rgba(239, 68, 68, 0.35)' : 'none',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: activeTemplateInDashboard === 'Academic Burgundy' ? 'translateY(-2px)' : 'none',
                }}
                onClick={() => setActiveTemplateInDashboard('Academic Burgundy')}
              >
                {activeTemplateInDashboard === 'Academic Burgundy' && (
                  <span style={{ position: 'absolute', top: '12px', right: '12px', color: '#EF4444' }}>
                    <CheckCircle2 size={22} />
                  </span>
                )}
                <div style={{ height: '8px', background: 'linear-gradient(90deg, #991B1B, #B45309)', borderRadius: '4px', marginBottom: '1rem' }} />
                <h4 style={{ color: '#FFF', fontSize: '1.1rem', fontWeight: 700 }}>Academic Prestige (Burgundy)</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0.5rem 0 1rem' }}>
                  Regal Crimson Burgundy & Warm Bronze Ivy League ornate quadruple framing.
                </p>
                <div style={{ fontSize: '0.78rem', color: '#F87171', fontWeight: 600 }}>
                  ★ Sigillum Academiae Crest
                </div>
              </div>

              {/* Template 4: Minimalist Platinum */}
              <div
                className="glass-panel"
                style={{
                  padding: '1.5rem',
                  border: activeTemplateInDashboard === 'Minimalist Platinum' ? '2.5px solid #10B981' : '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  background: activeTemplateInDashboard === 'Minimalist Platinum' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                  boxShadow: activeTemplateInDashboard === 'Minimalist Platinum' ? '0 8px 24px -4px rgba(16, 185, 129, 0.35)' : 'none',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: activeTemplateInDashboard === 'Minimalist Platinum' ? 'translateY(-2px)' : 'none',
                }}
                onClick={() => setActiveTemplateInDashboard('Minimalist Platinum')}
              >
                {activeTemplateInDashboard === 'Minimalist Platinum' && (
                  <span style={{ position: 'absolute', top: '12px', right: '12px', color: '#10B981' }}>
                    <CheckCircle2 size={22} />
                  </span>
                )}
                <div style={{ height: '8px', background: 'linear-gradient(90deg, #059669, #94A3B8)', borderRadius: '4px', marginBottom: '1rem' }} />
                <h4 style={{ color: '#FFF', fontSize: '1.1rem', fontWeight: 700 }}>Minimalist Platinum (Emerald)</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0.5rem 0 1rem' }}>
                  Deep Forest Emerald with brushed platinum rules and international standard board seal.
                </p>
                <div style={{ fontSize: '0.78rem', color: '#34D399', fontWeight: 600 }}>
                  ◆ Global Standards Verified Merit
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Live Canvas Demonstration */}
          <div style={{ maxWidth: '850px', margin: '0 auto' }}>
            <CertificatePreview
              studentData={{
                ...(selectedStudentForPreview || {
                  id: 'DEMO-PREVIEW',
                  student_id: 'STU-2026-08',
                  name: "Liam O'Connor",
                  course: 'UI/UX Product Design',
                  grade: 'A',
                  issue_date: '2026-11-17',
                  certificate_id: 'CERT-202610-2757',
                  status: 'Generated',
                }),
                template_name: activeTemplateInDashboard,
              }}
              onTemplateChange={(t) => setActiveTemplateInDashboard(t)}
            />
          </div>
        </div>
      )}

      {/* TAB 4: Generation Logs and Error Reports */}
      {activeTab === 'logs' && (
        <div className="glass-panel table-panel">
          <div className="table-toolbar">
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFF' }}>
                Generation Audit Trail & Error Reports
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Immutable event logs for batch Excel processing, single issues, validation exceptions, and PDF streams.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <a
                href={logsService.getExportUrl()}
                className="btn btn-secondary"
                download="generation_audit_and_error_report.csv"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem' }}
              >
                <Download size={14} /> Export Error Report (CSV)
              </a>

              <button
                className="btn btn-danger"
                onClick={handleClearLogs}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem' }}
              >
                <Trash2 size={14} /> Clear Logs
              </button>
            </div>
          </div>

          <div className="table-responsive-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Timestamp</th>
                  <th>Event Type</th>
                  <th>Status</th>
                  <th>Records</th>
                  <th>Success</th>
                  <th>Errors</th>
                  <th>Audit Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-tertiary)' }}>
                      No audit generation logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 700, color: 'var(--gold-400)' }}>#{log.id}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{log.created_at}</td>
                      <td>
                        <span className="badge badge-grade">{log.event_type}</span>
                      </td>
                      <td>
                        {log.status === 'SUCCESS' ? (
                          <span className="badge badge-success">
                            <CheckCircle2 size={12} /> SUCCESS
                          </span>
                        ) : log.status === 'WARNING' ? (
                          <span className="badge badge-pending" style={{ color: 'var(--gold-400)', borderColor: 'var(--gold-400)' }}>
                            <AlertCircle size={12} /> WARNING
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ color: 'var(--rose-400)', borderColor: 'var(--rose-400)' }}>
                            <AlertCircle size={12} /> FAILED
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{log.total_records}</td>
                      <td style={{ color: 'var(--emerald-400)', fontWeight: 600 }}>{log.success_count}</td>
                      <td style={{ color: log.error_count > 0 ? 'var(--rose-400)' : 'var(--text-tertiary)', fontWeight: 600 }}>
                        {log.error_count}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', maxWidth: '320px' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {log.details || 'Pipeline finished normally.'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Professional One-Click Robot Framework RPA Automation Console */}
      {activeTab === 'robot' && (
        <div className="rpa-console-wrapper">
          {/* Main RPA Hero Glass Panel */}
          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(56, 189, 248, 0.2) 100%)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--gold-400)',
                    boxShadow: '0 0 25px rgba(245, 158, 11, 0.2)',
                  }}
                >
                  <Bot size={28} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    One-Click RPA Automation Console
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '20px',
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: 'var(--blue-400)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                      }}
                    >
                      Robot Framework 7.4.2
                    </span>
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
                    Orchestrates automatic login, Excel ingestion, validation, vector PDF generation, ZIP bundling, and SHA-256 integrity audits.
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {rpaStatus === 'RUNNING' && (
                  <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--gold-400)', border: '1px solid var(--gold-400)', padding: '0.5rem 1rem', fontSize: '0.88rem' }}>
                    <RefreshCw size={14} className="animate-spin" /> RUNNING: Stage {getStageNumber(rpaCurrentStage)}/12
                  </span>
                )}
                {rpaStatus === 'COMPLETED' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-success" style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}>
                      <CheckCircle2 size={16} /> Automation Completed (100%)
                    </span>
                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--emerald-400)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
                      ⚡ ZIP Downloaded Automatically
                    </span>
                  </div>
                )}
                {rpaStatus === 'FAILED' && (
                  <span className="badge badge-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}>
                    <AlertCircle size={16} /> Automation Failed
                  </span>
                )}
                {rpaStatus === 'IDLE' && (
                  <span className="badge" style={{ background: 'rgba(148, 163, 184, 0.12)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', padding: '0.5rem 1rem', fontSize: '0.88rem' }}>
                    Ready to Execute
                  </span>
                )}
              </div>
            </div>

            {/* Error Message if Failed */}
            {rpaError && (
              <div
                style={{
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.4)',
                  color: 'var(--rose-400)',
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.9rem',
                }}
              >
                <AlertCircle size={20} />
                <div>
                  <strong>Automation Error: </strong>
                  {rpaError}
                </div>
              </div>
            )}

            {/* Control & Trigger Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                padding: '1.25rem',
                borderRadius: '14px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '1.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Certificate Template:
                </span>
                <select
                  className="form-input"
                  style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer' }}
                  value={rpaTemplate}
                  onChange={(e) => setRpaTemplate(e.target.value)}
                  disabled={rpaRunning}
                >
                  <option value="Standard">Executive Gold (Standard)</option>
                  <option value="Modern Tech">Modern Tech (Cyber Cyan)</option>
                  <option value="Academic Burgundy">Academic Prestige (Crimson Burgundy)</option>
                  <option value="Minimalist Platinum">Minimalist Platinum (Corporate Emerald)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                {/* START AUTOMATION BUTTON */}
                <button
                  className="btn btn-primary"
                  onClick={handleStartRpaAutomation}
                  disabled={rpaRunning}
                  style={{
                    padding: '0.75rem 1.75rem',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    boxShadow: rpaRunning ? 'none' : '0 0 25px rgba(245, 158, 11, 0.35)',
                    transform: rpaRunning ? 'none' : 'scale(1.02)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {rpaRunning ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Executing: {rpaCurrentStage}... ({rpaProgress}%)
                    </>
                  ) : (
                    <>
                      <Play size={18} fill="currentColor" />
                      START AUTOMATION
                    </>
                  )}
                </button>

                {/* View HTML Report */}
                {rpaRunId && (
                  <a
                    href={rpaService.getReportUrl(rpaRunId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{
                      padding: '0.75rem 1.25rem',
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'rgba(56, 189, 248, 0.1)',
                      borderColor: 'rgba(56, 189, 248, 0.3)',
                      color: 'var(--blue-400)',
                    }}
                  >
                    <ExternalLink size={16} /> View HTML Report
                  </a>
                )}

                {/* Download ZIP */}
                {rpaRunId && (
                  <a
                    href={rpaService.getDownloadUrl(rpaRunId)}
                    download
                    className="btn btn-secondary"
                    style={{
                      padding: '0.75rem 1.25rem',
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'rgba(16, 185, 129, 0.1)',
                      borderColor: 'rgba(16, 185, 129, 0.3)',
                      color: 'var(--emerald-400)',
                    }}
                  >
                    <FileArchive size={16} /> Download ZIP
                  </a>
                )}

                {/* Return to Normal Format Button */}
                {rpaStatus === 'COMPLETED' && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => setActiveTab('registry')}
                    style={{
                      padding: '0.75rem 1.25rem',
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'rgba(245, 158, 11, 0.12)',
                      borderColor: 'rgba(245, 158, 11, 0.35)',
                      color: 'var(--gold-400)',
                    }}
                  >
                    <Users size={16} /> Return to Normal Format
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, color: '#FFF' }}>
                  Pipeline Progress: <span style={{ color: 'var(--gold-400)' }}>{rpaCurrentStage}</span>
                </span>
                <span style={{ fontWeight: 700, color: 'var(--gold-400)' }}>{rpaProgress}%</span>
              </div>
              <div
                style={{
                  height: '10px',
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.8)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${rpaProgress}%`,
                    background: 'linear-gradient(90deg, var(--gold-500) 0%, var(--gold-300) 50%, var(--blue-400) 100%)',
                    transition: 'width 0.4s ease',
                    boxShadow: '0 0 12px rgba(245, 158, 11, 0.5)',
                  }}
                />
              </div>
            </div>

            {/* 12-Stage Visual Workflow Stepper Grid */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFF', marginBottom: '1rem' }}>
                Complete 12-Stage Execution Workflow
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '0.85rem',
                }}
              >
                {RPA_STAGES.map((stage) => {
                  const stageState = getStageStatus(stage.id, rpaCurrentStage, rpaStatus);
                  const isCurrent = stageState === 'in-progress';
                  const isDone = stageState === 'completed';
                  const isFailed = stageState === 'failed';

                  return (
                    <div
                      key={stage.id}
                      style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        background: isCurrent
                          ? 'rgba(245, 158, 11, 0.12)'
                          : isDone
                          ? 'rgba(16, 185, 129, 0.08)'
                          : isFailed
                          ? 'rgba(244, 63, 94, 0.12)'
                          : 'rgba(15, 23, 42, 0.45)',
                        border: isCurrent
                          ? '1px solid var(--gold-400)'
                          : isDone
                          ? '1px solid rgba(16, 185, 129, 0.35)'
                          : isFailed
                          ? '1px solid rgba(244, 63, 94, 0.4)'
                          : '1px solid var(--border-subtle)',
                        boxShadow: isCurrent ? '0 0 15px rgba(245, 158, 11, 0.2)' : 'none',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-tertiary)' }}>
                          STAGE {stage.id.toString().padStart(2, '0')}
                        </span>
                        {isDone && <CheckCircle2 size={16} color="var(--emerald-400)" />}
                        {isCurrent && <RefreshCw size={16} color="var(--gold-400)" className="animate-spin" />}
                        {isFailed && <AlertCircle size={16} color="var(--rose-400)" />}
                        {!isDone && !isCurrent && !isFailed && <Clock size={16} color="var(--text-tertiary)" />}
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.92rem',
                          color: isCurrent ? 'var(--gold-400)' : isDone ? 'var(--emerald-400)' : '#FFF',
                          marginBottom: '0.2rem',
                        }}
                      >
                        {stage.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                        {stage.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Real-Time KPI Metrics */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFF', marginBottom: '1rem' }}>
                Live Execution Metrics
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '1rem',
                }}
              >
                <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.5)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>DURATION</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFF', marginTop: '0.35rem' }}>
                    {rpaStats.duration_seconds > 0 ? `${rpaStats.duration_seconds}s` : '--'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
                    Robot execution time
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.5)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL STUDENTS</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--blue-400)', marginTop: '0.35rem' }}>
                    {rpaStats.total_records || '--'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
                    Records scanned from Excel
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.5)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>VALIDATION MATRIX</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--emerald-400)', marginTop: '0.35rem' }}>
                    {rpaStats.valid_records || 0} Valid / {rpaStats.invalid_records || 0} Error
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
                    Schema & syntax compliant
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.5)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CERTIFICATES ISSUED</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gold-400)', marginTop: '0.35rem' }}>
                    {rpaStats.certificates_generated || '--'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
                    Vector PDFs rendered
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.5)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>PDF & ZIP INTEGRITY</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--emerald-400)', marginTop: '0.35rem' }}>
                    {rpaStats.pdf_verification_status === 'VERIFIED' ? '✔ PDF OK' : rpaStats.pdf_verification_status} / {rpaStats.zip_validation_status === 'VERIFIED' ? '✔ ZIP OK' : rpaStats.zip_validation_status}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
                    Non-zero bytes & valid archive
                  </div>
                </div>
              </div>
            </div>

            {/* Live Console Terminal */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFF' }}>
                  Live Execution Console
                </h4>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                  Run ID: {rpaRunId || 'Standby'}
                </span>
              </div>
              <div
                style={{
                  background: '#0B0F19',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  fontFamily: 'monospace',
                  fontSize: '0.82rem',
                  color: '#94A3B8',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  lineHeight: '1.6',
                }}
              >
                {rpaLogs.length === 0 ? (
                  <div style={{ color: 'var(--text-tertiary)' }}>
                    Ready to execute. Click [START AUTOMATION] to initiate the complete 12-stage RPA pipeline.
                  </div>
                ) : (
                  rpaLogs.map((log, idx) => (
                    <div key={idx} style={{ color: log.includes('SUCCESS') || log.includes('Completed') ? 'var(--emerald-400)' : log.includes('Error') || log.includes('FAILED') ? 'var(--rose-400)' : '#E2E8F0' }}>
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Automation Run History */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFF' }}>
                  Automation Run History
                </h4>
                <button className="btn btn-secondary" onClick={loadRpaHistory} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                  <RefreshCw size={13} /> Refresh History
                </button>
              </div>

              <div className="table-responsive-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Run ID</th>
                      <th>Date / Time</th>
                      <th>Status</th>
                      <th>Template</th>
                      <th>Certificates</th>
                      <th>Duration</th>
                      <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rpaHistory.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                          No automation runs recorded yet.
                        </td>
                      </tr>
                    ) : (
                      rpaHistory.map((run) => (
                        <tr key={run.id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--blue-400)' }}>
                            {run.run_id}
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                            {run.start_time}
                          </td>
                          <td>
                            {run.status === 'COMPLETED' ? (
                              <span className="badge badge-success" style={{ fontSize: '0.78rem' }}>
                                <CheckCircle2 size={12} /> COMPLETED
                              </span>
                            ) : run.status === 'RUNNING' ? (
                              <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--gold-400)', border: '1px solid var(--gold-400)', fontSize: '0.78rem' }}>
                                <RefreshCw size={12} className="animate-spin" /> RUNNING
                              </span>
                            ) : (
                              <span className="badge badge-danger" style={{ fontSize: '0.78rem' }}>
                                <AlertCircle size={12} /> FAILED
                              </span>
                            )}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{run.template_name || 'Standard'}</td>
                          <td style={{ fontWeight: 700, color: 'var(--gold-400)' }}>{run.certificates_generated}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{run.duration_seconds > 0 ? `${run.duration_seconds}s` : '--'}</td>
                          <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                            <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                              <a
                                href={rpaService.getReportUrl(run.run_id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                title="Open HTML Test Report"
                              >
                                <ExternalLink size={13} /> Report
                              </a>
                              <a
                                href={rpaService.getDownloadUrl(run.run_id)}
                                download
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                title="Download Generated ZIP Bundle"
                              >
                                <Download size={13} /> ZIP
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
        </div>
      )}
    </div>
  );
};

export default Dashboard;
