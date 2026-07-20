import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '../api/axios';
import { setCredentials } from '../store/authSlice';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [needs2FA, setNeeds2FA] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = needs2FA ? { ...form, twoFactorCode } : form;
      const { data } = await api.post('/auth/login', payload);

      if (data.twoFactorRequired) {
        setNeeds2FA(true);
        setLoading(false);
        return;
      }

      dispatch(setCredentials(data));
      navigate(`/${data.role}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-md">
        <h1 className="font-serif text-4xl text-white mb-2">SkillSphere</h1>
        <p className="text-white/50 font-mono text-sm mb-8">sign in to your account</p>
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!needs2FA && (
            <>
              <div>
                <label className="block text-white/70 text-sm mb-1 font-mono">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-white focus:outline-none focus:border-amber"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-1 font-mono">Password</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-white focus:outline-none focus:border-amber"
                />
                <div className="text-right mt-1">
                  <Link to="/forgot-password" className="text-amber text-xs hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>
            </>
          )}

          {needs2FA && (
            <div>
              <label className="block text-white/70 text-sm mb-1 font-mono">
                Enter your 6-digit authenticator code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-white text-center tracking-[0.5em] font-mono focus:outline-none focus:border-amber"
                placeholder="000000"
              />
              
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber text-ink font-semibold py-2 rounded hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Signing in...' : needs2FA ? 'Verify Code' : 'Sign In'}
          </button>
        </form>
        {!needs2FA && (
          <p className="text-white/50 text-sm mt-6 text-center">
            No account?{' '}
            <Link to="/register" className="text-amber hover:underline">
              Register
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}



