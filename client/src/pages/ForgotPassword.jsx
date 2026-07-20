import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-md">
        <h1 className="font-serif text-4xl text-white mb-2">SkillSphere</h1>
        <p className="text-white/50 font-mono text-sm mb-8">reset your password</p>

        {sent ? (
          <div className="bg-sage/10 border border-sage/30 text-sage text-sm px-4 py-3 rounded">
            If an account exists for <span className="font-mono">{email}</span>, a reset link has
            been sent. Check your inbox.
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2 rounded mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-1 font-mono">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-white focus:outline-none focus:border-amber"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber text-ink font-semibold py-2 rounded hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}

        <p className="text-white/50 text-sm mt-6 text-center">
          <Link to="/login" className="text-amber hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
