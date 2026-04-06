import { useState } from 'react';
import API from '../api/axios';

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Select a file first");

    const formData = new FormData();
    formData.append('resume', file);

    setStatus('Uploading and analyzing...');
    try {
      const res = await API.post('/resume/upload', formData);
      setStatus(`Success! Extracted ${res.data.claimsCount} claims.`);
    } catch (err) {
      setStatus('Upload failed. Ensure it is a valid PDF.');
    }
  };

  return (
    <div style={{ border: '2px dashed #ccc', padding: '20px', borderRadius: '10px', marginTop: '20px' }}>
      <h4>Step 0: Upload Your Resume for Gap Analysis</h4>
      <form onSubmit={handleUpload}>
        <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} />
        <button type="submit" style={{ marginLeft: '10px' }}>Upload PDF</button>
      </form>
      {status && <p style={{ fontSize: '0.9rem', color: '#007bff' }}>{status}</p>}
    </div>
  );
};

export default ResumeUpload;