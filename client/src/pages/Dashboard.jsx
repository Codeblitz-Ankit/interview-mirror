import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import ResumeUpload from '../components/ResumeUpload';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    role: 'Frontend Developer',
    company: 'Google',
    level: 'Mid',
    persona: 'friendly'
  });

  const startInterview = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Fetch questions from Gemini via backend
      const res = await API.post('/session/questions', config);
      
      // 2. Navigate to the Session page
      navigate('/session', { 
        state: { 
          questions: res.data.questions, 
          config: config 
        } 
      });
    } catch (err) {
      alert('Failed to start session. Check if backend/Gemini API is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Interview Mirror</h1>
          <p style={{ margin: 0, color: '#666' }}>Welcome back, {user?.name}</p>
        </div>
        <button 
          onClick={logout} 
          style={{ background: '#ff4444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </header>

      {/* STEP 1: RESUME UPLOAD SECTION */}
      <section style={{ marginTop: '30px' }}>
        <ResumeUpload />
        {user?.resumeClaims?.length > 0 && (
          <p style={{ color: 'green', fontSize: '0.85rem', marginTop: '5px' }}>
            ✓ Resume detected. AI will perform Gap Analysis during your session.
          </p>
        )}
      </section>

      {/* STEP 2: INTERVIEW CONFIGURATION */}
      <div style={{ marginTop: '30px', border: '1px solid #ccc', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginTop: 0 }}>Setup Mock Interview</h3>
        <form onSubmit={startInterview} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontWeight: 'bold' }}>Job Role</label>
            <input 
              type="text" 
              placeholder="e.g. Frontend Developer"
              value={config.role} 
              onChange={(e) => setConfig({...config, role: e.target.value})} 
              required 
              style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontWeight: 'bold' }}>Target Company</label>
            <input 
              type="text" 
              placeholder="e.g. Google, Meta, Startup"
              value={config.company} 
              onChange={(e) => setConfig({...config, company: e.target.value})} 
              required 
              style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontWeight: 'bold' }}>Seniority Level</label>
              <select 
                value={config.level} 
                onChange={(e) => setConfig({...config, level: e.target.value})}
                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
              >
                <option value="Junior">Junior</option>
                <option value="Mid">Mid-Level</option>
                <option value="Senior">Senior</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontWeight: 'bold' }}>Interviewer Persona</label>
              <select 
                value={config.persona} 
                onChange={(e) => setConfig({...config, persona: e.target.value})}
                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
              >
                <option value="friendly">Friendly</option>
                <option value="aggressive">Aggressive</option>
                <option value="silent">Silent</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
              marginTop: '10px',
              padding: '12px', 
              background: loading ? '#ccc' : '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Consulting Gemini...' : 'Start Interview Session'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;