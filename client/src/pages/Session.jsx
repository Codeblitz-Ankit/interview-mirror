import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../api/axios';

const Session = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { questions, config } = location.state || { questions: [], config: {} };

  const [currentIdx, setCurrentIdx] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [starFeedback, setStarFeedback] = useState(null);
  
  // New state to store all answers for the final report
  const [allAnswers, setAllAnswers] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Web Speech Setup (same as before)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const text = Array.from(event.results).map(result => result[0].transcript).join('');
      setTranscript(text);
    };
  }

  const toggleListening = () => {
    if (isListening) {
      recognition.stop();
      setIsListening(false);
      analyzeAnswer();
    } else {
      setTranscript("");
      recognition.start();
      setIsListening(true);
    }
  };

  const analyzeAnswer = async () => {
    try {
      const res = await API.post('/session/analyze-star', {
        question: questions[currentIdx],
        answer: transcript
      });
      setStarFeedback(res.data.analysis);
      
      // Store this specific answer in our list
      const newAnswer = {
        question: questions[currentIdx],
        transcript: transcript,
        starAnalysis: res.data.analysis
      };
      setAllAnswers([...allAnswers, newAnswer]);
    } catch (err) {
      console.error("STAR Analysis failed", err);
    }
  };

  const nextQuestion = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setTranscript("");
      setStarFeedback(null);
    } else {
      // INTERVIEW COMPLETE - SAVE TO DB
      setIsSaving(true);
      try {
        const res = await API.post('/session/save', {
          ...config,
          answers: allAnswers
        });
        
        // Navigate to report page with the new Session ID
        navigate(`/report/${res.data.sessionId}`);
      } catch (err) {
        alert("Failed to save session.");
        setIsSaving(false);
      }
    }
  };

  if (!questions.length) return <div>No session data found.</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Question {currentIdx + 1} of {questions.length}</h2>
      <p style={{ fontSize: '1.2rem' }}>{questions[currentIdx]}</p>

      <button onClick={toggleListening} style={{ padding: '10px 20px', background: isListening ? 'red' : 'green', color: 'white' }}>
        {isListening ? "Stop & Analyze" : "Start Answering"}
      </button>

      <div style={{ margin: '20px 0', border: '1px solid #ddd', padding: '10px' }}>
        <strong>Live Transcript:</strong> {transcript}
      </div>

      {starFeedback && (
        <div style={{ background: '#e1f5fe', padding: '15px' }}>
          <strong>Feedback:</strong> {starFeedback}
          <br />
          <button onClick={nextQuestion} disabled={isSaving} style={{ marginTop: '10px' }}>
            {isSaving ? "Saving Session..." : (currentIdx === questions.length - 1 ? "Finish Interview" : "Next Question")}
          </button>
        </div>
      )}
    </div>
  );
};

export default Session;