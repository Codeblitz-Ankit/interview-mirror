import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Session() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Extract state from Dashboard routing
  const { questions, config } = location.state || { questions: [], config: {} };

  const [currentIdx, setCurrentIdx] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [starFeedback, setStarFeedback] = useState(null);
  
  const [allAnswers, setAllAnswers] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false); // Handles both save and report generation

  // Web Speech API Setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  useEffect(() => {
    if (!questions || questions.length === 0) {
      navigate('/dashboard'); // Kick them out if they bypassed the setup
    }
  }, [questions, navigate]);

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
    if (!recognition) {
      alert("Your browser does not support Speech Recognition. Please use Chrome.");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      analyzeAnswer(); // Trigger analysis when they stop talking
    } else {
      setTranscript("");
      setStarFeedback(null);
      recognition.start();
      setIsListening(true);
    }
  };

  const analyzeAnswer = async () => {
    try {
      setStarFeedback("Analyzing your answer...");
      
      const res = await API.post('/session/analyze-star', {
        question: questions[currentIdx],
        answer: transcript
      });
      
      setStarFeedback(res.data.analysis);
      
      const newAnswer = {
        question: questions[currentIdx],
        transcript: transcript
      };

      // FIX: Safely update the exact index so we don't duplicate answers if they re-record
      setAllAnswers(prev => {
        const updated = [...prev];
        updated[currentIdx] = newAnswer;
        return updated;
      });

    } catch (err) {
      console.error("STAR Analysis failed", err);
      setStarFeedback("Failed to analyze answer. Please try again.");
    }
  };

  const handleNextOrFinish = async () => {
    if (currentIdx < questions.length - 1) {
      // Move to next question
      setCurrentIdx(currentIdx + 1);
      setTranscript("");
      setStarFeedback(null);
    } else {
      // FIX: Complete End-of-Interview Flow
      setIsProcessing(true);
      try {
        // 1. Save the raw session to DB
        const saveRes = await API.post('/session/save', {
          ...config,
          answers: allAnswers
        });
        const sessionId = saveRes.data.sessionId;

        // 2. Generate the full AI debrief report (This was missing!)
        setStarFeedback("Generating final AI debrief report... This may take up to 15 seconds.");
        await API.post('/session/report', { sessionId });

        // 3. Navigate to the results page
        navigate(`/report/${sessionId}`);
      } catch (err) {
        console.error(err);
        alert("Failed to finalize session. Check server logs.");
        setIsProcessing(false);
      }
    }
  };

  if (!questions.length) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl bg-white shadow rounded-lg p-8">
        
        {/* Header Indicator */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
            Question {currentIdx + 1} of {questions.length}
          </span>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {user?.resumeClaims?.length > 0 ? 'Context: Resume Uploaded' : 'Context: General'}
          </span>
        </div>

        {/* The Question */}
        <h2 className="text-2xl font-bold text-gray-900 mb-8 leading-relaxed">
          {questions[currentIdx]}
        </h2>

        {/* Live Transcript Area */}
        <div className="mb-8 relative">
          <div className="w-full h-48 p-4 bg-gray-50 border border-gray-200 rounded-lg overflow-y-auto text-gray-700 font-medium leading-relaxed">
            {transcript || (isListening ? "Listening..." : "Click start to begin your answer...")}
          </div>
          
          {isListening && (
            <span className="absolute top-2 right-2 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center mb-8">
          <button 
            onClick={toggleListening}
            disabled={isProcessing}
            className={`px-8 py-4 rounded-full font-bold text-white transition-all shadow-md ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-blue-600 hover:bg-blue-700'
            } disabled:opacity-50`}
          >
            {isListening ? 'Stop Recording & Analyze' : 'Start Recording'}
          </button>
        </div>

        {/* Instant STAR Feedback */}
        {starFeedback && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mt-4 animate-fade-in-up">
            <h3 className="text-sm font-bold text-blue-800 uppercase mb-2">Live AI Feedback</h3>
            <p className="text-gray-800 whitespace-pre-wrap">{starFeedback}</p>
            
            {!isListening && (
              <button 
                onClick={handleNextOrFinish} 
                disabled={isProcessing || transcript.length < 10}
                className="mt-6 w-full py-3 bg-gray-900 text-white rounded-md font-semibold hover:bg-black transition-colors disabled:bg-gray-400"
              >
                {isProcessing 
                  ? "Processing..." 
                  : (currentIdx === questions.length - 1 ? "Finish Interview & Get Report" : "Next Question")
                }
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}