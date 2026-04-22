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
      const res = await API.post('/session/questions', config);

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
  const ghostButtonClassName =
    'inline-flex items-center justify-center rounded-2xl border border-white/65 bg-white/60 px-4 py-2.5 text-sm font-medium text-ink-700 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/80 hover:text-ink-900 hover:shadow-[0_14px_24px_rgba(53,44,36,0.08)] active:scale-[0.99]';

  return (
    <div className="relative h-screen bg-gradient-to-br from-[#fbf9f6] via-[#f7f4ef] to-[#f3efe8]">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(168,144,121,0.1),transparent_62%)]" />

      <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col px-4 py-3 sm:px-6">
        <header className="flex shrink-0 flex-row items-start justify-between gap-4 border-b border-white/70 pb-2">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-ink-700">AI Interview Practice</p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-[-0.04em] text-ink-900 sm:text-3xl lg:text-4xl">
              Interview Mirror
            </h1>
            <p className="mt-0.5 max-w-xl text-sm text-ink-900">
              Welcome back, {user?.name}. Shape your mock interview flow.
            </p>
          </div>
          <button onClick={logout} className={ghostButtonClassName}>
            Logout
          </button>
        </header>

        <div className="mt-2 grid shrink-0 grid-cols-3 gap-2 rounded-2xl border border-shell-200/80 bg-white/45 p-2 backdrop-blur-md">
          <div>
            <p className="text-xs font-medium text-ink-700">Resume-aware</p>
            <p className="text-[11px] text-ink-900">Gap analysis folded into session.</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-700">Targeted prompts</p>
            <p className="text-[11px] text-ink-900">Aligned to company and level.</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-700">Flexible tone</p>
            <p className="text-[11px] text-ink-900">Persona changes style.</p>
          </div>
        </div>

        <main className="mt-2 flex flex-1 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
          <section className={`${cardClassName} min-w-0`}>
            <div className="flex flex-col gap-1 border-b border-shell-200/70 pb-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink-700">Interview Design</p>
              <h2 className="text-base font-semibold text-ink-900">Setup Mock Interview</h2>
              <p className="text-xs text-ink-900">Define role, company context, and interviewer style.</p>
            </div>

            <form id="interview-config-form" onSubmit={startInterview} className="mt-2 grid gap-2">
              <div>
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
              <div>
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClassName}>Seniority</label>
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
                <div>
                  <label className={labelClassName}>Persona</label>
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
            </form>
          </section>

          <section className="flex flex-col gap-3">
            <div className={`${cardClassName} relative min-w-0 flex-1`}>
              <div className="absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(244,238,230,0.8),transparent)]" />
              <div className="relative h-full">
                <ResumeUpload />
                {user?.resumeClaims?.length > 0 && (
                  <p className="mt-2 rounded-xl border border-emerald-200/70 bg-white/60 px-2 py-1.5 text-xs text-emerald-700">
                    Resume detected. AI will perform gap analysis.
                  </p>
                )}
              </div>
            </div>

            <div className={`${cardClassName} min-w-0`}>
              <div className="flex flex-col rounded-[20px] border border-white/70 bg-[linear-gradient(160deg,rgba(112,91,73,0.95),rgba(53,44,36,0.92))] p-3 text-white shadow-[0_18px_34px_rgba(53,44,36,0.16)]">
                <h3 className="text-base font-semibold">Start Interview Session</h3>
                <p className="mt-0.5 text-xs leading-4 text-white/90">
                  Generate interview questions and enter the live mock session.
                </p>
                <button
                  type="submit"
                  form="interview-config-form"
                  disabled={loading}
                  className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-white px-3 py-2.5 text-xs font-semibold text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-shell-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-white/60 disabled:text-black/70 disabled:shadow-none disabled:hover:translate-y-0"
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