import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { confirmPayment } from '../api/payments';
import DashboardShell from '../components/DashboardShell';

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const gigId = searchParams.get('gigId');
  const milestoneId = searchParams.get('milestoneId');
  const sessionId = searchParams.get('session_id');

  const [confirming, setConfirming] = useState(status === 'success');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'success' && sessionId && gigId && milestoneId) {
      confirmPayment(sessionId, gigId, milestoneId)
        .then(() => setConfirmed(true))
        .catch((err) => setError(err.response?.data?.message || 'Failed to confirm payment'))
        .finally(() => setConfirming(false));
    }
  }, [status, sessionId, gigId, milestoneId]);

  return (
    <DashboardShell title="Payment">
      <div className="max-w-md mx-auto text-center py-16">
        {status === 'cancelled' && (
          <>
            <p className="text-white/70 text-lg mb-2">Payment cancelled.</p>
            <p className="text-white/40 text-sm font-mono mb-6">No charge was made.</p>
          </>
        )}

        {status === 'success' && confirming && (
          <p className="text-white/70 text-lg">Confirming payment...</p>
        )}

        {status === 'success' && !confirming && confirmed && (
          <>
            <p className="text-sage text-lg mb-2">Payment successful</p>
            <p className="text-white/40 text-sm font-mono mb-6">
              Funds are held in escrow until you release them to the freelancer.
            </p>
          </>
        )}

        {error && (
          <p className="text-red-400 text-sm font-mono mb-6">{error}</p>
        )}

        {gigId && (
          <Link
            to={`/gigs/${gigId}`}
            className="inline-block bg-amber text-ink font-semibold px-6 py-2 rounded hover:opacity-90 transition"
          >
            Back to Gig
          </Link>
        )}
      </div>
    </DashboardShell>
  );
}
