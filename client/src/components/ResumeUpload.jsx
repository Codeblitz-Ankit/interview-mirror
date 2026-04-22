import { useState } from 'react';
import API from '../api/axios';

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Select a file first");

    const formData = new FormData();
    formData.append('resume', file);

    setShowPopup(true);
    setIsUploading(true);
    setStatus('Uploading and analyzing...');
    try {
      const res = await API.post('/resume/upload', formData);
      setStatus(`Success! Extracted ${res.data.claimsCount} claims.`);
    } catch (err) {
      setStatus('Upload failed. Ensure it is a valid PDF.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="grid max-w-full gap-2">
        <div>
          <h3 className="text-base font-semibold text-ink-900">Upload Resume</h3>
          <p className="text-xs text-ink-900">Add your PDF resume so interviews can reference your experience.</p>
        </div>

        <form onSubmit={handleUpload} className="grid max-w-full gap-2">
          <label className="grid gap-1">
            <span className="text-xs font-medium text-ink-900">Resume PDF</span>
            <input
              className="block w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-shell-200/90 bg-white/80 px-3 py-2 text-xs text-ink-900 outline-none transition-all duration-300 file:mr-2 file:max-w-[calc(100%-0.5rem)] file:overflow-hidden file:text-ellipsis file:whitespace-nowrap file:rounded-lg file:border-0 file:bg-shell-100 file:px-2 file:py-1.5 file:text-xs file:font-medium file:text-shell-900 hover:file:bg-shell-200 focus:border-focus-400 focus:bg-white focus:ring-2 focus:ring-shell-200/55"
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </label>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-shell-700 px-3 py-2 text-xs font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-shell-900 active:scale-[0.99]"
          >
            Upload PDF
          </button>
        </form>

        {status && !showPopup && (
          <p className="rounded-xl border border-shell-200/80 bg-white/55 px-2 py-1.5 text-xs text-ink-900">
            {status}
          </p>
        )}
      </div>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-300 ${
          showPopup ? 'pointer-events-auto bg-white/38 opacity-100 backdrop-blur-sm' : 'pointer-events-none opacity-0'
        }`}
      >
        <div
          className={`w-full max-w-md min-w-0 rounded-[28px] border border-white/70 bg-white/78 p-6 shadow-[0_24px_60px_rgba(53,44,36,0.14)] backdrop-blur-2xl transition-all duration-300 ${
            showPopup ? 'translate-y-0 scale-100' : 'translate-y-4 scale-[0.98]'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-ink-700">Resume Upload</p>
              <h4 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink-900">
                {isUploading ? 'Analyzing your resume' : 'Upload update'}
              </h4>
            </div>
            {!isUploading && (
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-shell-200/90 bg-white/75 text-ink-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
              >
                ×
              </button>
            )}
          </div>

          <p className="mt-4 text-sm leading-6 text-ink-900">{status}</p>

          {isUploading && (
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-shell-100">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-shell-500" />
            </div>
          )}

          {!isUploading && (
            <button
              type="button"
              onClick={() => setShowPopup(false)}
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-shell-700 px-5 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-shell-900 hover:shadow-[0_18px_30px_rgba(53,44,36,0.16)] active:scale-[0.99]"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default ResumeUpload;