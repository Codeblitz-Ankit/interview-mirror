import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Session() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { questions, config } = location.state || { questions: [], config: {} };

  const [currentIdx, setCurrentIdx] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [starFeedback, setStarFeedback] = useState(null);
  const [allAnswers, setAllAnswers] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!questions || questions.length === 0) {
      navigate('/dashboard');
    }
  }, [questions, navigate]);

  if (recognition) {
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join('');
      setTranscript(text);
    };
  }

  const toggleListening = () => {
    if (!recognition) {
      alert('Your browser does not support Speech Recognition. Please use Chrome.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      analyzeAnswer();
    } else {
      setTranscript('');
      setStarFeedback(null);
      recognition.start();
      setIsListening(true);
    }
  };

  const analyzeAnswer = async () => {
    try {
      setStarFeedback('Analyzing your answer...');

      const res = await API.post('/session/analyze-star', {
        question: questions[currentIdx],
        answer: transcript,
      });

      setStarFeedback(res.data.analysis);

      const newAnswer = {
        question: questions[currentIdx],
        transcript: transcript,
      };

      setAllAnswers((prev) => {
        const updated = [...prev];
        updated[currentIdx] = newAnswer;
        return updated;
      });
    } catch (err) {
      console.error('STAR Analysis failed', err);
      setStarFeedback('Failed to analyze answer. Please try again.');
    }
  };

  const handleNextOrFinish = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setTranscript('');
      setStarFeedback(null);
    } else {
      setIsProcessing(true);
      try {
        const saveRes = await API.post('/session/save', {
          ...config,
          answers: allAnswers,
        });
        const sessionId = saveRes.data.sessionId;

        setStarFeedback(
          'Generating final AI debrief report... This may take up to 15 seconds.'
        );
        await API.post('/session/report', { sessionId });

        navigate(`/report/${sessionId}`);
      } catch (err) {
        console.error(err);
        alert('Failed to finalize session. Check server logs.');
        setIsProcessing(false);
      }
    }
  };

  if (!questions.length) return null;

  const progress = ((currentIdx + 1) / questions.length) * 100;

  const tips = [
    'Use the STAR method: Situation, Task, Action, Result',
    'Back up claims with specific metrics and outcomes',
    'Connect your answer back to the job requirements',
    'Be concise — 90 seconds is ideal for most answers',
  ];

  return (
    <div className="min-h-screen bg-slate-900 overflow-x-hidden">
      <div
        className={`max-w-6xl mx-auto px-4 sm:px-6 py-8 transition-all duration-500 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden h-full">
              <div className="px-6 py-5 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Question {currentIdx + 1} of {questions.length}
                    </span>
                    <span className="h-1 w-24 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {config.role} · {config.level}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h2 className="text-xl font-semibold text-slate-100 mb-6 leading-relaxed">
                  {questions[currentIdx]}
                </h2>

                <div className="mb-6">
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
                    Your Answer
                  </label>
                  <div className="relative">
                    <textarea
                      readOnly
                      value={transcript}
                      placeholder={
                        isListening
                          ? 'Listening...'
                          : 'Click start to begin your answer...'
                      }
                      className="w-full h-40 bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-300 text-sm leading-relaxed resize-none transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-600"
                    />
                    {isListening && (
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                        <span className="text-xs text-rose-400 font-medium">Recording</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={toggleListening}
                  disabled={isProcessing}
                  className={`w-full py-3.5 rounded-lg font-semibold text-sm text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isListening
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-md hover:shadow-lg'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg hover:scale-[1.01]'
                  }`}
                >
                  {isListening ? 'Stop Recording & Analyze' : 'Start Recording'}
                </button>

                {starFeedback && (
                  <div className="mt-6 bg-slate-900 border border-slate-700 rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        AI Feedback
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                      {starFeedback}
                    </p>

                    {!isListening && (
                      <button
                        onClick={handleNextOrFinish}
                        disabled={isProcessing || transcript.length < 10}
                        className="mt-5 w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isProcessing
                          ? 'Processing...'
                          : currentIdx === questions.length - 1
                            ? 'Finish & View Report'
                            : 'Next Question'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden h-full">
              <div className="px-5 py-4 border-b border-slate-700">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Interview Tips
                </span>
              </div>
              <div className="p-5">
                <ul className="space-y-4">
                  {tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-5 h-5 rounded bg-slate-700 flex items-center justify-center mt-0.5">
                        <span className="text-xs text-slate-400 font-medium">{i + 1}</span>
                      </span>
                      <span className="text-sm text-slate-400 leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 pt-5 border-t border-slate-700">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Session Info
                  </span>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Role</span>
                      <span className="text-slate-300 font-medium">{config.role || '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Level</span>
                      <span className="text-slate-300 font-medium">{config.level || '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Persona</span>
                      <span className="text-slate-300 font-medium capitalize">
                        {config.persona || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Progress</span>
                      <span className="text-slate-300 font-medium">
                        {currentIdx + 1} / {questions.length}
                      </span>
                    </div>
                  </div>
                </div>

                {user?.resumeClaims?.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-slate-700">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Resume Context
                    </span>
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                      Your resume has been analyzed. The AI will reference your claims when
                      providing feedback.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}