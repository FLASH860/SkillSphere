import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProposalsForGig, updateProposalStatus, counterProposal } from '../api/proposals';
import DashboardShell from '../components/DashboardShell';

export default function GigProposals() {
  const { gigId } = useParams();
  const queryClient = useQueryClient();
  const [counterFormId, setCounterFormId] = useState(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterDays, setCounterDays] = useState('');
  const [counterMessage, setCounterMessage] = useState('');

  const { data: proposals, isLoading } = useQuery({
    queryKey: ['proposals', gigId],
    queryFn: () => getProposalsForGig(gigId),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateProposalStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proposals', gigId] }),
  });

  const counterMutation = useMutation({
    mutationFn: ({ id, data }) => counterProposal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals', gigId] });
      setCounterFormId(null);
      setCounterAmount('');
      setCounterDays('');
      setCounterMessage('');
    },
  });

  const statusColor = {
    pending: 'text-text-secondary',
    accepted: 'text-sage',
    rejected: 'text-red-400',
    negotiating: 'text-amber',
  };

  const openCounterForm = (p) => {
    const last = p.offers[p.offers.length - 1];
    setCounterFormId(p._id);
    setCounterAmount(last.amount);
    setCounterDays(last.estimatedDays);
    setCounterMessage('');
  };

  const submitCounter = (id) => {
    if (!counterAmount || !counterDays) return;
    counterMutation.mutate({
      id,
      data: { amount: Number(counterAmount), estimatedDays: Number(counterDays), message: counterMessage },
    });
  };

  return (
    <DashboardShell title="Gig Proposals">
      {isLoading && <p className="text-text-muted font-mono text-sm">Loading...</p>}
      {!isLoading && proposals?.length === 0 && (
        <div className="border border-dashed border-border rounded-lg p-10 text-center text-text-muted">
          No proposals yet.
        </div>
      )}
      <div className="space-y-4 max-w-3xl">
        {proposals?.map((p) => {
          const lastOffer = p.offers?.[p.offers.length - 1];
          const clientsTurn = p.status === 'negotiating' && lastOffer?.by === 'freelancer';
          const waitingOnFreelancer = p.status === 'negotiating' && lastOffer?.by === 'client';

          return (
            <div key={p._id} className="bg-surface border border-border rounded-lg p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-serif text-lg">{p.freelancer?.name}</p>
                  <p className="text-text-muted text-xs font-mono">{p.freelancer?.email}</p>
                </div>
                <span className={`text-xs font-mono uppercase ${statusColor[p.status]}`}>
                  {p.status}
                </span>
              </div>
              <p className="text-text-secondary text-sm mb-3">{p.description}</p>

              {p.offers?.length > 1 && (
                <div className="mb-4 border border-border rounded-lg divide-y divide-white/10 overflow-hidden">
                  {p.offers.map((o, idx) => (
                    <div key={idx} className="px-3 py-2 flex items-center justify-between text-xs font-mono">
                      <span className="text-text-secondary capitalize">{o.by} offered</span>
                      <span className="text-amber">₹{o.amount.toLocaleString()} · {o.estimatedDays}d</span>
                    </div>
                  ))}
                </div>
              )}

              {p.offers?.length <= 1 && (
                <div className="flex items-center gap-6 text-sm font-mono mb-4">
                  <span className="text-amber">₹{p.bidAmount.toLocaleString()}</span>
                  <span className="text-text-muted">{p.estimatedDays} days</span>
                </div>
              )}

              {(p.status === 'pending' || clientsTurn) && counterFormId !== p._id && (
                <div className="flex gap-3">
                  <button
                    onClick={() => statusMutation.mutate({ id: p._id, status: 'accepted' })}
                    className="bg-sage text-ink text-sm font-semibold px-4 py-1.5 rounded hover:opacity-90"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => openCounterForm(p)}
                    className="border border-amber/40 text-amber text-sm px-4 py-1.5 rounded hover:bg-amber/10"
                  >
                    Counter
                  </button>
                  <button
                    onClick={() => statusMutation.mutate({ id: p._id, status: 'rejected' })}
                    className="border border-border text-text-secondary text-sm px-4 py-1.5 rounded hover:border-red-400 hover:text-red-400"
                  >
                    Reject
                  </button>
                </div>
              )}

              {waitingOnFreelancer && (
                <p className="text-text-muted text-xs font-mono">Waiting on freelancer's response to your counter-offer.</p>
              )}

              {counterFormId === p._id && (
                <div className="mt-3 border border-amber/20 bg-amber/5 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-text-secondary text-xs font-mono mb-1">Counter Amount (₹)</label>
                      <input
                        type="number"
                        value={counterAmount}
                        onChange={(e) => setCounterAmount(e.target.value)}
                        className="w-full bg-surface border border-border rounded px-3 py-1.5 text-text-primary text-sm focus:outline-none focus:border-amber"
                      />
                    </div>
                    <div>
                      <label className="block text-text-secondary text-xs font-mono mb-1">Estimated Days</label>
                      <input
                        type="number"
                        value={counterDays}
                        onChange={(e) => setCounterDays(e.target.value)}
                        className="w-full bg-surface border border-border rounded px-3 py-1.5 text-text-primary text-sm focus:outline-none focus:border-amber"
                      />
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={counterMessage}
                    onChange={(e) => setCounterMessage(e.target.value)}
                    placeholder="Optional message..."
                    className="w-full bg-surface border border-border rounded px-3 py-1.5 text-text-primary text-sm mb-3 focus:outline-none focus:border-amber"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => submitCounter(p._id)}
                      disabled={counterMutation.isPending}
                      className="bg-amber text-ink text-xs font-semibold px-4 py-1.5 rounded hover:opacity-90 disabled:opacity-50"
                    >
                      {counterMutation.isPending ? 'Sending...' : 'Send Counter'}
                    </button>
                    <button
                      onClick={() => setCounterFormId(null)}
                      className="border border-border text-text-secondary text-xs px-4 py-1.5 rounded hover:border-border-strong"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}

