import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';

const Report = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        // 1. Trigger the AI to generate the report
        const res = await API.post('/session/report', { sessionId: id });
        setReport(res.data.report);
      } catch (err) {
        console.error("Failed to generate report", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>AI is analyzing your performance... hang tight!</div>;
  if (!report) return <div>Error loading report.</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '20px' }}>← Back to Dashboard</button>
      
      <div style={{ background: '#1a1a1a', color: 'white', padding: '30px', borderRadius: '15px', textAlign: 'center' }}>
        <h2>Interview Performance Report</h2>
        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#4caf50' }}>{report.confidenceScore}%</div>
        <p>Overall Confidence Score</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        <div style={{ background: '#f0f4f8', padding: '20px', borderRadius: '10px' }}>
          <strong>Filler Words Used:</strong>
          <p style={{ fontSize: '1.5rem' }}>{report.fillerCount}</p>
        </div>
        <div style={{ background: '#f0f4f8', padding: '20px', borderRadius: '10px' }}>
          <strong>Best Moment:</strong>
          <p>"{report.bestSentence}"</p>
        </div>
      </div>

      <div style={{ marginTop: '30px', borderLeft: '5px solid #ff9800', paddingLeft: '20px' }}>
        <h3>Biggest Area for Improvement:</h3>
        <p>{report.weakestPoint}</p>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>Top 3 Tips for Next Time:</h3>
        <ul>
          {report.tips.map((tip, index) => (
            <li key={index} style={{ marginBottom: '10px' }}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Report;