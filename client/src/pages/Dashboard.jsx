import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import ResumeUpload from '../components/ResumeUpload';
import heroImage from '../assets/interviewPhoto.jpg';

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
      console.error('Failed to start interview session:', err);

      const errorMessage =
        err.response?.data?.error ||
        (err.request
          ? 'Backend is unreachable. Start the server and verify MongoDB/Gemini configuration.'
          : 'Failed to start session.');

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const cardClassName =
    'w-full max-w-full rounded-[28px] border border-white/60 bg-white/52 p-5 shadow-[0_20px_50px_rgba(53,44,36,0.08)] backdrop-blur-xl transition-all duration-300 md:p-6';
  const fieldClassName =
    'w-full rounded-2xl border border-shell-200/90 bg-white/75 px-4 py-3.5 text-[15px] text-ink-900 outline-none transition-all duration-300 placeholder:text-ink-500 focus:border-focus-400 focus:bg-white focus:ring-4 focus:ring-shell-200/55';
  const labelClassName = 'text-sm font-medium tracking-[0.01em] text-ink-900';
  const primaryButtonClassName =
    'inline-flex items-center justify-center rounded-2xl bg-shell-700 px-5 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-shell-900 hover:shadow-[0_18px_30px_rgba(53,44,36,0.16)] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-shell-300 disabled:shadow-none disabled:hover:translate-y-0';
  const ghostButtonClassName =
    'inline-flex items-center justify-center rounded-2xl border border-white/65 bg-white/60 px-4 py-2.5 text-sm font-medium text-ink-700 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/80 hover:text-ink-900 hover:shadow-[0_14px_24px_rgba(53,44,36,0.08)] active:scale-[0.99]';

  return (
    <div className="relative min-h-screen bg-white">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(250,248,244,0.28),rgba(250,248,244,0.2)_38%,rgba(255,255,255,0.12))]" />
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(168,144,121,0.14),transparent_62%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.14))]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-4 sm:px-5 lg:px-6 lg:py-5">
        <header className="flex flex-col gap-5 border-b border-white/70 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-ink-700">AI Interview Practice</p>
            <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-ink-900 sm:text-5xl lg:text-6xl">
              Interview Mirror
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-ink-900 sm:text-lg">
              Welcome back, {user?.name}. Shape a focused mock interview flow with resume context,
              role targeting, and polished practice sessions.
            </p>
          </div>
          <button onClick={logout} className={ghostButtonClassName}>
            Logout
          </button>
        </header>

        <main className="mt-5 grid w-full max-w-full flex-1 items-start gap-5 xl:grid-cols-[minmax(0,1.14fr)_minmax(0,0.86fr)]">
          <section className={`${cardClassName} min-w-0`}>
            <div className="flex flex-col gap-3 border-b border-shell-200/70 pb-6">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-ink-700">Interview Design</p>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink-900 sm:text-[2rem]">
                Setup Mock Interview
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-ink-900 sm:text-base">
                Define the role, company context, and interviewer style to generate a realistic,
                tailored interview session.
              </p>
            </div>

            <form id="interview-config-form" onSubmit={startInterview} className="mt-5 grid gap-4">
              <div className="grid gap-2.5">
                <label className={labelClassName}>Job Role</label>
                <input
                  className={fieldClassName}
                  type="text"
                  placeholder="e.g. Frontend Developer"
                  value={config.role}
                  onChange={(e) => setConfig({...config, role: e.target.value})}
                  required
                />
              </div>

              <div className="grid gap-2.5">
                <label className={labelClassName}>Target Company</label>
                <input
                  className={fieldClassName}
                  type="text"
                  placeholder="e.g. Google, Meta, Startup"
                  value={config.company}
                  onChange={(e) => setConfig({...config, company: e.target.value})}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2.5">
                  <label className={labelClassName}>Seniority Level</label>
                  <select
                    className={fieldClassName}
                    value={config.level}
                    onChange={(e) => setConfig({...config, level: e.target.value})}
                  >
                    <option value="Junior">Junior</option>
                    <option value="Mid">Mid-Level</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>

                <div className="grid gap-2.5">
                  <label className={labelClassName}>Interviewer Persona</label>
                  <select
                    className={fieldClassName}
                    value={config.persona}
                    onChange={(e) => setConfig({...config, persona: e.target.value})}
                  >
                    <option value="friendly">Friendly</option>
                    <option value="aggressive">Aggressive</option>
                    <option value="silent">Silent</option>
                  </select>
                </div>
              </div>

              <div className="mt-1 grid gap-3 rounded-3xl border border-shell-200/80 bg-white/45 p-4 backdrop-blur-md sm:grid-cols-3">
                <div>
                  <p className="text-sm font-medium text-ink-700">Resume-aware</p>
                  <p className="mt-1 text-sm text-ink-900">Gap analysis can be folded into the session.</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-ink-700">Targeted prompts</p>
                  <p className="mt-1 text-sm text-ink-900">Questions align to your selected company and level.</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-ink-700">Flexible tone</p>
                  <p className="mt-1 text-sm text-ink-900">Persona changes the way the interviewer responds.</p>
                </div>
              </div>
            </form>
          </section>

          <section className="grid min-w-0 max-w-full content-start gap-5">
            <div className={`${cardClassName} relative min-w-0 overflow-hidden`}>
              <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(244,238,230,0.8),transparent)]" />
              <div className="relative h-full">
                <ResumeUpload />
                {user?.resumeClaims?.length > 0 && (
                  <p className="mt-4 rounded-2xl border border-emerald-200/70 bg-white/60 px-4 py-3 text-sm text-emerald-700 backdrop-blur-sm">
                    Resume detected. AI will perform gap analysis during your session.
                  </p>
                )}
              </div>
            </div>

            <div className={`${cardClassName} min-w-0 overflow-hidden`}>
              <div className="relative flex flex-col rounded-[26px] border border-white/70 bg-[linear-gradient(160deg,rgba(112,91,73,0.95),rgba(53,44,36,0.92))] p-5 text-white shadow-[0_18px_34px_rgba(53,44,36,0.16)]">
                <div>
                  <h3 className="text-2xl font-semibold tracking-[-0.03em]">Start Interview Session</h3>
                  <p className="mt-2 text-sm leading-6 text-white/90">
                    Generate your interview questions and move directly into the live mock session.
                  </p>
                </div>
                <button
                  type="submit"
                  form="interview-config-form"
                  disabled={loading}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-shell-50 hover:shadow-[0_18px_30px_rgba(53,44,36,0.16)] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-white/60 disabled:text-black/70 disabled:shadow-none disabled:hover:translate-y-0"
                >
                  {loading ? 'Consulting Gemini...' : 'Start Interview Session'}
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
