import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

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
      // 1. Fetch questions from Gemini via your backend
      const res = await API.post('/session/questions', config);
      
      // 2. Navigate to the Session page, passing the questions and config via State
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
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Welcome, {user?.name}</h1>
        <button onClick={logout} style={{ background: '#ff4444', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>Logout</button>
      </header>

      <div style={{ marginTop: '30px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
        <h3>Start New Mock Interview</h3>
        <form onSubmit={startInterview} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <label>
            Job Role:
            <input type="text" value={config.role} onChange={(e) => setConfig({...config, role: e.target.value})} required />
          </label>
          <label>
            Target Company:
            <input type="text" value={config.company} onChange={(e) => setConfig({...config, company: e.target.value})} required />
          </label>
          <label>
            Seniority Level:
            <select value={config.level} onChange={(e) => setConfig({...config, level: e.target.value})}>
              <option value="Junior">Junior</option>
              <option value="Mid">Mid-Level</option>
              <option value="Senior">Senior</option>
            </select>
          </label>
          <label>
            Interviewer Persona:
            <select value={config.persona} onChange={(e) => setConfig({...config, persona: e.target.value})}>
              <option value="friendly">Friendly (Encouraging)</option>
              <option value="aggressive">Aggressive (Pressure Cooker)</option>
              <option value="silent">Silent (Minimal Feedback)</option>
            </select>
          </label>
          <button type="submit" disabled={loading} style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
            {loading ? 'Generating Interview...' : 'Start Session'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;