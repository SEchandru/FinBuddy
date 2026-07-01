import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaEnvelope, FaLock, FaArrowRight } from 'react-icons/fa';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (!user.isOnboarded) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900 via-slate-950 to-black p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
        {/* Decorative ambient lights */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl"></div>

        <div className="relative z-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
            FinBuddy
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Secure login to your personal wealth dashboard
          </p>
        </div>

        {error && (
          <div className="relative z-10 mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative z-10 mt-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Email Address
            </label>
            <div className="relative mt-2 flex items-center">
              <FaEnvelope className="absolute left-3 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-3 pr-4 pl-10 text-white placeholder-slate-600 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Password
            </label>
            <div className="relative mt-2 flex items-center">
              <FaLock className="absolute left-3 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-3 pr-4 pl-10 text-white placeholder-slate-600 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 py-3 font-semibold text-white transition-all hover:opacity-95 active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                Sign In <FaArrowRight className="text-xs" />
              </>
            )}
          </button>
        </form>

        <p className="relative z-10 mt-8 text-center text-sm text-slate-500">
          New to FinBuddy?{' '}
          <Link to="/register" className="font-semibold text-blue-400 hover:text-blue-300">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
