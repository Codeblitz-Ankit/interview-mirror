import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import heroImage from '../../../interviewPhoto.jpg';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/auth/login', formData);
      login(res.data, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(250,248,244,0.94),rgba(255,255,255,0.88))]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10 sm:px-6">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr_minmax(0,440px)]">
          <div className="hidden max-w-xl lg:block">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-ink-500">Practice with polish</p>
            <h1 className="mt-4 text-5xl font-bold tracking-[-0.04em] text-ink-900">
              Prepare for interviews with a calmer, sharper workflow.
            </h1>
            <p className="mt-5 text-lg leading-8 text-ink-700">
              Build targeted mock sessions, upload your resume for context, and keep the experience
              structured from sign-in to final report.
            </p>
          </div>

          <div className="rounded-[30px] border border-white/60 bg-white/72 p-6 shadow-[0_24px_60px_rgba(53,44,36,0.12)] backdrop-blur-2xl sm:p-8">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-ink-900">Login to Interview Mirror</h2>
            <p className="mt-3 text-sm leading-6 text-ink-700">
              Sign in to continue your interview preparation.
            </p>
            {error && (
              <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
                {error}
              </p>
            )}
            <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
              <input
                className="w-full rounded-2xl border border-shell-200/90 bg-white/80 px-4 py-3.5 text-sm text-ink-900 outline-none transition-all duration-300 placeholder:text-ink-500 focus:border-focus-400 focus:bg-white focus:ring-4 focus:ring-shell-200/55"
                type="email"
                placeholder="Email"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
              <input
                className="w-full rounded-2xl border border-shell-200/90 bg-white/80 px-4 py-3.5 text-sm text-ink-900 outline-none transition-all duration-300 placeholder:text-ink-500 focus:border-focus-400 focus:bg-white focus:ring-4 focus:ring-shell-200/55"
                type="password"
                placeholder="Password"
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-shell-700 px-5 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-shell-900 hover:shadow-[0_18px_30px_rgba(53,44,36,0.16)] active:scale-[0.99]"
              >
                Login
              </button>
            </form>
            <p className="mt-6 text-sm text-ink-700">
              Need an account?{' '}
              <Link className="font-medium text-shell-700 transition-colors duration-200 hover:text-shell-900" to="/register">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
