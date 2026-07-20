import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '../api/axios';
import { setCredentials } from '../store/authSlice';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'client' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [justRegistered, setJustRegistered] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      dispatch(setCredentials(data));
      setJustRegistered(true);
      setTimeout(() => navigate(`/${data.role}`), 1600);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-md">
        <h1 className="font-serif text-4xl text-white mb-2">SkillSphere</h1>
        <p className="text-white/50 font-mono text-sm mb-8">create your account</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        {justRegistered && (
          <div className="bg-sage/10 border border-sage/30 text-sage text-sm px-4 py-2 rounded mb-4">
            Account created! We sent a verification link to your email.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-1 font-mono">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-white focus:outline-none focus:border-amber"
            />
          </div>
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
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-white focus:outline-none focus:border-amber"
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-1 font-mono">I am a</label>
            <div className="grid grid-cols-2 gap-3">
              {['client', 'freelancer'].map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setForm({ ...form, role: r })}
                  className={`py-2 rounded border capitalize transition ${
                    form.role === r
                      ? 'bg-amber text-ink border-amber font-semibold'
                      : 'border-white/10 text-white/70 hover:border-white/30'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber text-ink font-semibold py-2 rounded hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-white/50 text-sm mt-6 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-amber hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}


