import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    api
      .get(`/auth/verify-email/${token}`)
      .then(({ data }) => {
        setStatus('success');
        setMessage(data.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="font-serif text-4xl text-white mb-6">SkillSphere</h1>

        {status === 'verifying' && (
          <p className="text-white/60 font-mono text-sm">Verifying your email...</p>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 rounded-full bg-sage/20 border border-sage flex items-center justify-center mx-auto mb-4">
              <span className="text-sage text-2xl">✓</span>
            </div>
            <p className="text-white mb-1">{message}</p>
            <p className="text-white/50 text-sm mb-6">Your account is now verified.</p>
            <Link
              to="/"
              className="inline-block bg-amber text-ink font-semibold py-2 px-6 rounded hover:opacity-90 transition"
            >
              Go to Dashboard
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-red-400 text-2xl">✕</span>
            </div>
            <p className="text-red-400 mb-1">{message}</p>
            <p className="text-white/50 text-sm mb-6">
              This link may have expired. Sign in and request a new one from your profile.
            </p>
            <Link
              to="/login"
              className="inline-block bg-amber text-ink font-semibold py-2 px-6 rounded hover:opacity-90 transition"
            >
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}


