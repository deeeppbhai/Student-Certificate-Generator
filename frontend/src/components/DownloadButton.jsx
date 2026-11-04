import React, { useState } from 'react';
import { Download, FileArchive, Check, Loader2 } from 'lucide-react';
import { certificateService } from '../services/api';

const DownloadButton = ({ mode = 'single', certId = null, label = null }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleClick = async () => {
    setDownloading(true);
    setDownloaded(false);

    try {
      if (mode === 'zip') {
        const url = certificateService.getZipDownloadUrl();
        window.open(url, '_blank');
      } else if (certId) {
        const url = certificateService.getSingleDownloadUrl(certId);
        window.open(url, '_blank');
      }
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      alert('Download error occurred.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      className={`btn ${mode === 'zip' ? 'btn-primary' : 'btn-accent'}`}
      onClick={handleClick}
      disabled={downloading}
    >
      {downloading ? (
        <>
          <Loader2 size={16} className="spin" /> Preparing File...
        </>
      ) : downloaded ? (
        <>
          <Check size={16} /> Downloaded!
        </>
      ) : (
        <>
          {mode === 'zip' ? <FileArchive size={16} /> : <Download size={16} />}
          {label || (mode === 'zip' ? 'Download All as ZIP' : 'Download PDF')}
        </>
      )}
    </button>
  );
};

export default DownloadButton;
