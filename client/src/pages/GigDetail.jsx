import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getGigById } from '../api/gigs';
import { createProposal } from '../api/proposals';
import DashboardShell from '../components/DashboardShell';
import ReviewForm from '../components/ReviewForm';
import ReviewsList from '../components/ReviewsList';
import { Link, useNavigate as useNav2 } from 'react-router-dom';
import { createCheckoutSession, getPaymentsForGig, releaseMilestone } from '../api/payments';
import { getRecommendedFreelancers } from '../api/match';
import { getProfile } from '../api/users';
import { useQuery as useQuery2 } from '@tanstack/react-query';
import { updateGigProgress } from '../api/progress';
import { createDispute } from '../api/disputes';
import { uploadToCloudinary } from '../api/upload';
import { createBooking, getBookingsForGig } from '../api/bookings';

export default function GigDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ description: '', bidAmount: '', estimatedDays: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progressDraft, setProgressDraft] = useState(null);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeSuccess, setDisputeSuccess] = useState(false);
  const [disputeEvidence, setDisputeEvidence] = useState([]);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [bookingSlot, setBookingSlot] = useState(null);
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);

  const { data: gig, isLoading } = useQuery({
    queryKey: ['gig', id],
    queryFn: () => getGigById(id),
  });

  const { data: payments, refetch: refetchPayments } = useQuery2({
    queryKey: ['payments', id],
    queryFn: () => getPaymentsForGig(id),
    enabled: !!gig && gig.status === 'in_progress',
  });

  const [payingId, setPayingId] = useState(null);

  const { data: recommended } = useQuery2({
    queryKey: ['match', id],
    queryFn: () => getRecommendedFreelancers(id),
    enabled: !!gig && user?.role === 'client' && gig.status === 'open',
  });

  const isOwnerClientCheck = user?.role === 'client' && user?._id === gig?.client?._id;
  const { data: freelancerProfile } = useQuery2({
    queryKey: ['freelancerAvailability', gig?.assignedFreelancer?._id],
    queryFn: () => getProfile(gig.assignedFreelancer._id),
    enabled: !!gig?.assignedFreelancer?._id && isOwnerClientCheck,
  });

  const progressMutation = useMutation({
    mutationFn: (percent) => updateGigProgress(id, percent),
    onSuccess: (updatedGig) => {
      queryClient.setQueryData(['gig', id], updatedGig);
    },
  });

  const disputeMutation = useMutation({
    mutationFn: () => createDispute({ gig: id, reason: disputeReason, evidenceUrls: disputeEvidence }),
    onSuccess: () => setDisputeSuccess(true),
  });

  const handleEvidenceUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingEvidence(true);
    try {
      const url = await uploadToCloudinary(file);
      setDisputeEvidence((prev) => [...prev, url]);
    } catch (err) {
      alert(err.message || 'Evidence upload failed');
    } finally {
      setUploadingEvidence(false);
      e.target.value = '';
    }
  };

  const { data: gigBookings, refetch: refetchBookings } = useQuery2({
    queryKey: ['bookings', id],
    queryFn: () => getBookingsForGig(id),
    enabled: !!gig && gig.status === 'in_progress',
  });

  const handleRequestSlot = async (day, slot) => {
    try {
      await createBooking({ gig: id, day, slot, message: bookingMessage });
      setBookingSlot(null);
      setBookingMessage('');
      refetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request slot');
    }
  };

  const removeEvidence = (idx) => {
    setDisputeEvidence((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRaiseDispute = () => {
    if (!disputeReason.trim()) return;
    disputeMutation.mutate();
  };

  const handlePayMilestone = async (milestoneId) => {
    setPayingId(milestoneId);
    try {
      const { url } = await createCheckoutSession(id, milestoneId);
      window.location.href = url;
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start payment');
      setPayingId(null);
    }
  };

  const handleRelease = async (milestoneId) => {
    try {
      await releaseMilestone(id, milestoneId);
      refetchPayments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to release payment');
    }
  };

  const getPaymentStatus = (milestoneTitle) =>
    payments?.find((p) => p.milestone === milestoneTitle)?.status;

  const handleApply = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createProposal({
        gig: id,
        description: form.description,
        bidAmount: Number(form.bidAmount),
        estimatedDays: Number(form.estimatedDays),
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit proposal');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardShell title="Gig Detail">
        <p className="text-text-muted font-mono text-sm">Loading...</p>
      </DashboardShell>
    );
  }

  if (!gig) {
    return (
      <DashboardShell title="Gig Detail">
        <p className="text-text-muted font-mono text-sm">Gig not found.</p>
      </DashboardShell>
    );
  }

  const inputClass =
    'w-full bg-surface border border-border rounded px-4 py-2 text-text-primary focus:outline-none focus:border-amber';
  const labelClass = 'block text-text-primary text-sm mb-1 font-mono';
  const isAssignedFreelancer = user?.role === 'freelancer' && user._id === gig.assignedFreelancer?._id;
  const isOwnerClient = user?.role === 'client' && user._id === gig.client?._id;
  const currentProgress = progressDraft !== null ? progressDraft : gig.progressPercent || 0;

  return (
    <DashboardShell title="Gig Detail">
      <div className="max-w-3xl">
        <button
          onClick={() => navigate(-1)}
          className="text-text-muted text-sm font-mono mb-4 hover:text-amber"
        >
          ← back
        </button>

        <h1 className="font-serif text-3xl mb-2">{gig.title}</h1>
        <div className="flex items-center justify-between mb-4">
          <p className="text-text-muted font-mono text-sm">
            posted by {gig.client?.name || 'a client'}
          </p>
          {user?.role === 'freelancer' && gig.client?._id && user._id !== gig.client._id && (
            <Link
              to={`/messages?with=${gig.client._id}&name=${encodeURIComponent(gig.client.name)}`}
              className="text-xs font-mono border border-border px-3 py-1 rounded hover:border-amber hover:text-amber transition"
            >
              Message Client
            </Link>
          )}
          {user?.role === 'client' && gig.status === 'in_progress' && gig.assignedFreelancer && user._id !== gig.assignedFreelancer._id && (
            <Link
              to={`/messages?with=${gig.assignedFreelancer._id}&name=${encodeURIComponent(gig.assignedFreelancer.name)}`}
              className="text-xs font-mono border border-border px-3 py-1 rounded hover:border-amber hover:text-amber transition"
            >
              Message {gig.assignedFreelancer.name}
            </Link>
          )}
          {gig.status === 'in_progress' && (isOwnerClient || isAssignedFreelancer) && (
            <button
              onClick={() => setShowDisputeForm((v) => !v)}
              className="text-xs font-mono border border-red-500/30 text-red-400 px-3 py-1 rounded hover:bg-red-500/10 transition"
            >
              Raise Dispute
            </button>
          )}
        </div>

        {showDisputeForm && (
          <div className="mb-6 border border-red-500/20 bg-red-500/5 rounded-lg p-4">
            {disputeSuccess ? (
              <p className="text-sage text-sm font-mono">
                Dispute submitted. An admin will review it shortly.
              </p>
            ) : (
              <>
                <label className="block text-text-secondary text-sm mb-2 font-mono">
                  What's the issue?
                </label>
                <textarea
                  rows={3}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full bg-surface border border-border rounded px-4 py-2 text-text-primary focus:outline-none focus:border-red-400 mb-3"
                  placeholder="Describe the problem with this gig..."
                />
                <div className="mb-3">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {disputeEvidence.map((url, idx) => (
                      <div key={idx} className="relative">
                        <img src={url} alt="evidence" className="w-16 h-16 object-cover rounded border border-border" />
                        <button
                          type="button"
                          onClick={() => removeEvidence(idx)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-text-primary text-xs w-4 h-4 rounded-full flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="inline-block cursor-pointer text-xs font-mono border border-border px-3 py-1.5 rounded hover:border-red-400 hover:text-red-400 transition">
                    {uploadingEvidence ? 'Uploading...' : '+ Attach evidence'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEvidenceUpload}
                      disabled={uploadingEvidence}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleRaiseDispute}
                    disabled={!disputeReason.trim() || disputeMutation.isPending}
                    className="text-xs font-mono bg-red-500/80 text-text-primary px-4 py-1.5 rounded hover:opacity-90 disabled:opacity-40"
                  >
                    {disputeMutation.isPending ? 'Submitting...' : 'Submit Dispute'}
                  </button>
                  <button
                    onClick={() => setShowDisputeForm(false)}
                    className="text-xs font-mono border border-border px-4 py-1.5 rounded hover:border-border-strong"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        <p className="text-text-secondary mb-4">{gig.description}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {gig.skillsRequired.map((s) => (
            <span key={s} className="text-xs font-mono bg-surface-alt px-2 py-0.5 rounded text-text-secondary">
              {s}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-6 text-sm font-mono mb-6">
          <span className="text-amber text-lg">
            ₹{gig.budget.min.toLocaleString()} – ₹{gig.budget.max.toLocaleString()}
          </span>
          <span className="text-text-muted">
            {gig.location?.remote ? 'Remote' : gig.location?.city || '—'}
          </span>
          <span className="text-sage capitalize">{gig.status}</span>
        </div>

        {isOwnerClient && gig.assignedFreelancer && freelancerProfile?.profile?.availability?.length > 0 && (
          <div className="mb-8 border border-border bg-surface rounded-lg p-4">
            <p className="text-text-secondary text-xs font-mono uppercase mb-3">
              {gig.assignedFreelancer.name}'s Availability
            </p>
            <div className="flex flex-wrap gap-2">
              {freelancerProfile.profile.availability
                .filter((d) => d.slots?.length > 0)
                .flatMap((d) =>
                  d.slots.map((s) => {
                    const existingBooking = gigBookings?.find((b) => b.day === d.day && b.slot === s);
                    const key = `${d.day}-${s}`;
                    return (
                      <div key={key} className="flex items-center gap-2">
                        {gig.status === 'in_progress' && !existingBooking && bookingSlot !== key && (
                          <button
                            onClick={() => setBookingSlot(key)}
                            className="bg-surface border border-border rounded px-3 py-1.5 hover:border-amber transition text-left"
                          >
                            <span className="text-text-secondary text-xs font-mono">{d.day}: </span>
                            <span className="text-sage text-xs font-mono capitalize">{s}</span>
                          </button>
                        )}
                        {existingBooking && (
                          <div className="bg-surface border border-border rounded px-3 py-1.5">
                            <span className="text-text-secondary text-xs font-mono">{d.day}: </span>
                            <span className="text-sage text-xs font-mono capitalize">{s}</span>
                            <span className={`ml-2 text-[10px] font-mono uppercase ${existingBooking.status === 'confirmed' ? 'text-sage' : existingBooking.status === 'declined' ? 'text-red-400' : 'text-amber'}`}>
                              {existingBooking.status}
                            </span>
                          </div>
                        )}
                        {bookingSlot === key && (
                          <div className="border border-amber/30 bg-amber/5 rounded-lg p-3">
                            <input
                              type="text"
                              value={bookingMessage}
                              onChange={(e) => setBookingMessage(e.target.value)}
                              placeholder="Optional note..."
                              className="bg-surface border border-border rounded px-2 py-1 text-text-primary text-xs mr-2 focus:outline-none focus:border-amber"
                            />
                            <button
                              onClick={() => handleRequestSlot(d.day, s)}
                              className="bg-amber text-ink text-xs font-semibold px-3 py-1 rounded hover:opacity-90 mr-1"
                            >
                              Request
                            </button>
                            <button
                              onClick={() => setBookingSlot(null)}
                              className="border border-border text-text-secondary text-xs px-3 py-1 rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              {freelancerProfile.profile.availability.every((d) => !d.slots?.length) && (
                <p className="text-text-muted text-xs font-mono">No availability set yet.</p>
              )}
            </div>
          </div>
        )}

        {gig.status === 'in_progress' && (isAssignedFreelancer || isOwnerClient) && (
          <div className="mb-8 border border-border bg-surface rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary text-xs font-mono uppercase tracking-wide">
                Progress
              </span>
              <div className="flex items-center gap-3">
                <span className="text-amber text-sm font-mono">{currentProgress}%</span>
                {isAssignedFreelancer && (
                  <button
                    onClick={() => progressMutation.mutate(currentProgress)}
                    disabled={progressDraft === null || progressDraft === gig.progressPercent || progressMutation.isPending}
                    className="text-xs font-mono bg-amber text-ink px-3 py-1 rounded hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {progressMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                )}
              </div>
            </div>
            <div className="w-full h-2 bg-surface-alt rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-amber transition-all"
                style={{ width: `${currentProgress}%` }}
              />
            </div>
            {isAssignedFreelancer && (
              <input
                type="range"
                min="0"
                max="100"
                value={currentProgress}
                onChange={(e) => setProgressDraft(Number(e.target.value))}
                className="w-full accent-amber"
              />
            )}
            {!isAssignedFreelancer && (
              <p className="text-text-muted text-xs font-mono">
                Updated by the assigned freelancer
              </p>
            )}
          </div>
        )}

        {user?.role === 'client' && gig.status === 'open' && recommended !== undefined && (
          <div className="mb-8 border border-sage/30 bg-sage/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sage text-xs font-mono uppercase tracking-wide">
                ✦ AI-Powered Matching
              </span>
            </div>
            {recommended.length === 0 && (
              <p className="text-text-muted text-sm font-mono">
                No matching freelancers yet — check back once more freelancers join.
              </p>
            )}
            <div className="space-y-2">
              {recommended.map((f) => (
                <div
                  key={f._id}
                  className="flex items-center justify-between bg-surface border border-border rounded px-4 py-2"
                >
                  <div>
                    <span className="text-text-primary text-sm font-medium">{f.name}</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {f.skills?.slice(0, 4).map((s) => (
                        <span
                          key={s.name}
                          className="text-[10px] font-mono bg-surface-alt px-1.5 py-0.5 rounded text-text-secondary"
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-amber text-sm font-mono">{f.matchScore}% match</span>
                    <p className="text-text-muted text-xs font-mono">★ {f.reputationScore?.toFixed(1) || '0.0'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {gig.milestones?.length > 0 && (
          <div className="mb-8">
            <p className="text-text-secondary text-sm font-mono uppercase mb-2">Milestones</p>
            <div className="space-y-2">
              {gig.milestones.map((m) => {
                const payStatus = getPaymentStatus(m.title);
                return (
                  <div
                    key={m._id}
                    className="flex justify-between items-center bg-surface border border-border rounded px-4 py-2"
                  >
                    <span className="text-text-secondary text-sm">{m.title}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-amber text-sm font-mono">₹{m.amount.toLocaleString()}</span>
                      {user?.role === 'client' && gig.status === 'in_progress' && gig.assignedFreelancer && !payStatus && (
                        <button
                          onClick={() => handlePayMilestone(m._id)}
                          disabled={payingId === m._id}
                          className="text-xs font-mono bg-amber text-ink px-3 py-1 rounded hover:opacity-90 disabled:opacity-50"
                        >
                          {payingId === m._id ? 'Redirecting...' : 'Pay Milestone'}
                        </button>
                      )}
                      {payStatus === 'escrow' && (
                        <>
                          <span className="text-xs font-mono text-sage">In Escrow</span>
                          {user?.role === 'client' && (
                            <button
                              onClick={() => handleRelease(m._id)}
                              className="text-xs font-mono border border-sage text-sage px-3 py-1 rounded hover:bg-sage/10"
                            >
                              Release
                            </button>
                          )}
                        </>
                      )}
                      {payStatus === 'released' && (
                        <span className="text-xs font-mono text-sage">Released ✓</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {user?.role === 'freelancer' && gig.status === 'open' && (
          <div className="border-t border-border pt-6">
            <h2 className="font-serif text-xl mb-4">Submit a Proposal</h2>

            {success ? (
              <div className="bg-sage/10 border border-sage/30 text-sage px-4 py-3 rounded">
                Proposal submitted! The client will review it soon.
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2 rounded">
                    {error}
                  </div>
                )}
                <div>
                  <label className={labelClass}>Cover Letter</label>
                  <textarea
                    required
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className={inputClass}
                    placeholder="Why are you a good fit for this gig?"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Your Bid (₹)</label>
                    <input
                      type="number"
                      required
                      value={form.bidAmount}
                      onChange={(e) => setForm({ ...form, bidAmount: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Estimated Days</label>
                    <input
                      type="number"
                      required
                      value={form.estimatedDays}
                      onChange={(e) => setForm({ ...form, estimatedDays: e.target.value})}
                      className={inputClass}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-amber text-ink font-semibold px-6 py-2 rounded hover:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Proposal'}
                </button>
              </form>
            )}
          </div>
        )}
        {gig.status === 'in_progress' && (user?._id === gig.client?._id || user?._id === gig.assignedFreelancer?._id) && (
          <div className="border-t border-border pt-6 mt-6">
            <ReviewForm
              gigId={gig._id}
              revieweeId={user?._id === gig.client?._id ? gig.assignedFreelancer._id : gig.client?._id}
            />
          </div>
        )}

        <div className="border-t border-border pt-6 mt-6">
          <h2 className="font-serif text-xl mb-4">Reviews</h2>
          <ReviewsList userId={gig.client?._id} />
        </div>
      </div>
    </DashboardShell>
  );
}

























