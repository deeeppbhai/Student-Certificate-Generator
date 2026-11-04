import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for token attachment
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('scg_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  login: async (email, password) => {
    sessionStorage.removeItem('scg_manual_logout');
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.access_token) {
      localStorage.setItem('scg_token', res.data.access_token);
      localStorage.setItem('scg_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  autoLogin: async () => {
    sessionStorage.removeItem('scg_manual_logout');
    try {
      const res = await api.post('/auth/auto-login');
      if (res.data?.access_token) {
        localStorage.setItem('scg_token', res.data.access_token);
        localStorage.setItem('scg_user', JSON.stringify(res.data.user));
        return res.data;
      }
    } catch (err) {
      // Fallback: try standard login with default admin credentials
      try {
        const res2 = await api.post('/auth/login', { email: 'admin@scg.edu', password: 'admin123' });
        if (res2.data?.access_token) {
          localStorage.setItem('scg_token', res2.data.access_token);
          localStorage.setItem('scg_user', JSON.stringify(res2.data.user));
          return res2.data;
        }
      } catch (err2) {
        // Offline demo fallback session
        const demoAdmin = {
          id: 1,
          full_name: 'System Administrator',
          email: 'admin@scg.edu',
          role: 'admin'
        };
        localStorage.setItem('scg_token', 'demo_admin_jwt_session');
        localStorage.setItem('scg_user', JSON.stringify(demoAdmin));
        return { access_token: 'demo_admin_jwt_session', user: demoAdmin };
      }
    }
  },

  getProfile: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('scg_token');
    localStorage.removeItem('scg_user');
    sessionStorage.setItem('scg_manual_logout', 'true');
  },

  clearManualLogout: () => {
    sessionStorage.removeItem('scg_manual_logout');
  },

  isManualLogout: () => {
    return sessionStorage.getItem('scg_manual_logout') === 'true';
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('scg_user');
    return user ? JSON.parse(user) : null;
  },
};

export const studentService = {
  getAll: async () => {
    const res = await api.get('/students');
    return res.data;
  },

  create: async (studentData) => {
    const res = await api.post('/students', studentData);
    return res.data;
  },

  uploadExcel: async (files, template = 'Standard') => {
    const formData = new FormData();
    const fileList = Array.isArray(files)
      ? files
      : files instanceof FileList
      ? Array.from(files)
      : [files];

    fileList.forEach((f) => {
      formData.append('files', f);
    });
    if (fileList.length === 1) {
      formData.append('file', fileList[0]);
    }

    const res = await api.post(`/students/upload-excel?template=${encodeURIComponent(template)}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  getSampleExcelUrl: () => {
    return `${API_BASE_URL}/students/sample-excel`;
  },

  autoImportLocalExcel: async () => {
    const res = await api.post('/students/auto-import-local-excel');
    return res.data;
  },

  delete: async (studentId) => {
    const res = await api.delete(`/students/${studentId}`);
    return res.data;
  },

  clearAll: async () => {
    const res = await api.post('/students/clear-all');
    return res.data;
  },
};

export const certificateService = {
  getAll: async () => {
    const res = await api.get('/certificates');
    return res.data;
  },

  generate: async (studentIds = [], templateName = 'Standard', extraParams = {}) => {
    const payload = {
      student_ids: studentIds.length > 0 ? studentIds : null,
      template_name: templateName,
      ...extraParams,
    };
    const res = await api.post('/certificates/generate', payload);
    return res.data;
  },

  autoProcessExcel: async (file, template = 'Standard') => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/certificates/auto-process-excel?template=${encodeURIComponent(template)}`, formData, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  getSingleDownloadUrl: (certId, disposition = 'attachment') => {
    return `${API_BASE_URL}/download/${certId}?disposition=${disposition}`;
  },

  getZipDownloadUrl: () => {
    return `${API_BASE_URL}/download/all-zip`;
  },

  downloadSelectedZip: async (certIds) => {
    const res = await api.post(
      '/download/selected-zip',
      { certificate_ids: certIds },
      { responseType: 'blob' }
    );
    return res.data;
  },

  downloadZipFromUrl: async (zipUrl, filename = 'certificates.zip') => {
    try {
      const response = await fetch(zipUrl);
      if (!response.ok) throw new Error('Failed to fetch ZIP archive');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
    } catch (err) {
      console.warn('Direct blob download fallback:', err);
      const link = document.createElement('a');
      link.href = zipUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },
};

export const logsService = {
  getAll: async (limit = 50, eventType = null, status = null) => {
    const params = { limit };
    if (eventType) params.event_type = eventType;
    if (status) params.status = status;
    const res = await api.get('/logs', { params });
    return res.data;
  },

  getStats: async () => {
    const res = await api.get('/logs/stats');
    return res.data;
  },

  getExportUrl: () => {
    return `${API_BASE_URL}/logs/export`;
  },

  clear: async () => {
    const res = await api.delete('/logs');
    return res.data;
  },
};

export const verifyService = {
  verify: async (certId) => {
    const res = await api.get(`/certificates/verify/${encodeURIComponent(certId)}`);
    return res.data;
  },
};

export const rpaService = {
  start: async (templateName = 'Standard', excelPath = null) => {
    const res = await api.post('/rpa/start', { template_name: templateName, excel_path: excelPath });
    return res.data;
  },

  getStatus: async (runId) => {
    const res = await api.get(`/rpa/status/${runId}`);
    return res.data;
  },

  getHistory: async (limit = 20) => {
    const res = await api.get('/rpa/history', { params: { limit } });
    return res.data;
  },

  getReportUrl: (runId) => {
    return `${API_BASE_URL}/rpa/report/${runId}`;
  },

  getDownloadUrl: (runId) => {
    return `${API_BASE_URL}/rpa/download/${runId}`;
  },
};

export default api;
