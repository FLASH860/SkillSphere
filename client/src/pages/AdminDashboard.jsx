import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import {
  getAdminStats,
  getAdminUsers,
  toggleSuspendUser,
  verifyFreelancer,
  getAdminGigs,
  getPendingGigs,
  approveGig,
  rejectGig,
  getAdminSettings,
  updateAdminSettings,
} from '../api/admin';
import { getAllDisputes, updateDisputeStatus } from '../api/disputes';

export default function AdminDashboard() {
  const [tab, setTab] = useState('users');
  const [viewingReason, setViewingReason] = useState(null);
  const [confirmingToggle, setConfirmingToggle] = useState(false);
  const qc = useQueryClient();

  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: getAdminStats });
  const { data: users } = useQuery({ queryKey: ['admin-users'], queryFn: () => getAdminUsers() });
  const { data: gigs } = useQuery({ queryKey: ['admin-gigs'], queryFn: getAdminGigs, enabled: tab === 'gigs' });
  const { data: disputes } = useQuery({ queryKey: ['admin-disputes'], queryFn: getAllDisputes, enabled: tab === 'disputes' });
  const { data: pendingGigs } = useQuery({ queryKey: ['admin-pending-gigs'], queryFn: getPendingGigs, enabled: tab === 'approvals' });
  const { data: settings } = useQuery({ queryKey: ['admin-settings'], queryFn: getAdminSettings });

  const handleSuspend = async (id) => {
    await toggleSuspendUser(id);
    qc.invalidateQueries({ queryKey: ['admin-users'] });
    qc.invalidateQueries({ queryKey: ['admin-stats'] });
  };

  const handleVerify = async (userId) => {
    await verifyFreelancer(userId);
    qc.invalidateQueries({ queryKey: ['admin-users'] });
  };

  const handleDisputeStatus = async (id, status) => {
    await updateDisputeStatus(id, { status });
    qc.invalidateQueries({ queryKey: ['admin-disputes'] });
    qc.invalidateQueries({ queryKey: ['admin-stats'] });
  };

  const handleApproveGig = async (id) => {
    await approveGig(id);
    qc.invalidateQueries({ queryKey: ['admin-pending-gigs'] });
    qc.invalidateQueries({ queryKey: ['admin-gigs'] });
  };

  const handleRejectGig = async (id) => {
    await rejectGig(id);
    qc.invalidateQueries({ queryKey: ['admin-pending-gigs'] });
    qc.invalidateQueries({ queryKey: ['admin-gigs'] });
  };

  const handleToggleApproval = async () => {
    await updateAdminSettings({ manualGigApprovalEnabled: !settings?.manualGigApprovalEnabled });
    qc.invalidateQueries({ queryKey: ['admin-settings'] });
    setConfirmingToggle(false);
  };

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? '—' },
    { label: 'Active Freelancers', value: stats?.activeFreelancers ?? '—' },
    { label: 'Platform Revenue', value: `₹${(stats?.platformRevenue ?? 0).toLocaleString()}`, amber: true },
    { label: 'Open Disputes', value: stats?.openDisputes ?? 0 },
  ];

  const statusColor = {
    open: 'text-red-400 border-red-400/50',
    reviewing: 'text-amber border-amber/50',
    resolved: 'text-sage border-sage/50',
  };

  return (
    <DashboardShell title="Admin Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((c) => (
          <div key={c.label} className="bg-surface border border-border rounded-lg p-5">
            <p className="text-text-muted text-xs font-mono uppercase">{c.label}</p>
            <p className={`text-3xl font-serif mt-2 ${c.amber ? 'text-amber' : ''}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between bg-surface border border-border rounded-lg px-5 py-4 mb-8">
        <div>
          <p className="text-text-primary text-sm font-medium">Manual Gig Approval</p>
          <p className="text-text-muted text-xs font-mono mt-0.5">
            {settings?.manualGigApprovalEnabled
              ? 'New gigs require admin approval before going live'
              : 'New gigs go live immediately (approval off)'}
          </p>
        </div>
        <button
          onClick={() => setConfirmingToggle(true)}
          className={`relative w-12 h-6 rounded-full transition ${
            settings?.manualGigApprovalEnabled ? 'bg-sage' : 'bg-surface-alt'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
              settings?.manualGigApprovalEnabled ? 'left-6' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      <div className="flex gap-4 border-b border-border mb-6">
        <button
          onClick={() => setTab('users')}
          className={`pb-2 text-sm font-mono ${tab === 'users' ? 'text-amber border-b-2 border-amber' : 'text-text-muted'}`}
        >
          Users
        </button>
        <button
          onClick={() => setTab('gigs')}
          className={`pb-2 text-sm font-mono ${tab === 'gigs' ? 'text-amber border-b-2 border-amber' : 'text-text-muted'}`}
        >
          Gigs
        </button>
        <button
          onClick={() => setTab('approvals')}
          className={`pb-2 text-sm font-mono flex items-center gap-2 ${tab === 'approvals' ? 'text-amber border-b-2 border-amber' : 'text-text-muted'}`}
        >
          Approvals
          {pendingGigs?.length > 0 && (
            <span className="bg-amber text-ink text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
              {pendingGigs.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('disputes')}
          className={`pb-2 text-sm font-mono ${tab === 'disputes' ? 'text-amber border-b-2 border-amber' : 'text-text-muted'}`}
        >
          Disputes
        </button>
      </div>

      {tab === 'users' && (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface text-text-muted text-xs font-mono uppercase">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u._id} className="border-t border-border">
                  <td className="px-4 py-3 text-text-primary">{u.name}</td>
                  <td className="px-4 py-3 text-text-secondary font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-3 capitalize text-text-secondary">{u.role}</td>
                  <td className="px-4 py-3">
                    <span className={u.isSuspended ? 'text-red-400' : 'text-sage'}>
                      {u.isSuspended ? 'Suspended' : 'Active'}
                    </span>
                    {u.isVerified && <span className="text-sage ml-2">✓ Verified</span>}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {u.role === 'freelancer' && !u.isVerified && (
                      <button
                        onClick={() => handleVerify(u._id)}
                        className="text-xs font-mono border border-sage text-sage px-3 py-1 rounded hover:bg-sage/10"
                      >
                        Verify
                      </button>
                    )}
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleSuspend(u._id)}
                        className={`text-xs font-mono border px-3 py-1 rounded ${
                          u.isSuspended
                            ? 'border-sage text-sage hover:bg-sage/10'
                            : 'border-red-400/50 text-red-400 hover:bg-red-400/10'
                        }`}
                      >
                        {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!users?.length && (
            <p className="text-text-muted text-sm p-6 text-center">No users found.</p>
          )}
        </div>
      )}

      {tab === 'gigs' && (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface text-text-muted text-xs font-mono uppercase">
              <tr>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3">Budget</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {gigs?.map((g) => (
                <tr key={g._id} className="border-t border-border">
                  <td className="px-4 py-3 text-text-primary">{g.title}</td>
                  <td className="px-4 py-3 text-text-secondary">{g.client?.name || '—'}</td>
                  <td className="px-4 py-3 text-amber font-mono">
                    ₹{g.budget?.min?.toLocaleString()} – ₹{g.budget?.max?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 capitalize text-sage">{g.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!gigs?.length && (
            <p className="text-text-muted text-sm p-6 text-center">No gigs found.</p>
          )}
        </div>
      )}

      {tab === 'approvals' && (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface text-text-muted text-xs font-mono uppercase">
              <tr>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3">Budget</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingGigs?.map((g) => (
                <tr key={g._id} className="border-t border-border">
                  <td className="px-4 py-3 text-text-primary">{g.title}</td>
                  <td className="px-4 py-3 text-text-secondary">{g.client?.name || '—'}</td>
                  <td className="px-4 py-3 text-amber font-mono">
                    ₹{g.budget?.min?.toLocaleString()} – ₹{g.budget?.max?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => handleApproveGig(g._id)}
                      className="text-xs font-mono border border-sage text-sage px-3 py-1 rounded hover:bg-sage/10"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectGig(g._id)}
                      className="text-xs font-mono border border-red-400/50 text-red-400 px-3 py-1 rounded hover:bg-red-400/10"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!pendingGigs?.length && (
            <p className="text-text-muted text-sm p-6 text-center">No gigs awaiting approval.</p>
          )}
        </div>
      )}

      {tab === 'disputes' && (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface text-text-muted text-xs font-mono uppercase">
              <tr>
                <th className="text-left px-4 py-3">Gig</th>
                <th className="text-left px-4 py-3">Raised By</th>
                <th className="text-left px-4 py-3">Reason</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {disputes?.map((d) => (
                <tr key={d._id} className="border-t border-border align-top">
                  <td className="px-4 py-3 text-text-primary">{d.gig?.title || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs font-mono">{d.raisedBy?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setViewingReason(d)}
                      className="text-xs font-mono border border-border px-3 py-1 rounded hover:border-amber hover:text-amber transition"
                    >
                      View
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-mono border px-2 py-0.5 rounded capitalize ${statusColor[d.status] || ''}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    {d.status !== 'reviewing' && (
                      <button
                        onClick={() => handleDisputeStatus(d._id, 'reviewing')}
                        className="text-xs font-mono border border-amber/50 text-amber px-3 py-1 rounded hover:bg-amber/10"
                      >
                        Mark Reviewing
                      </button>
                    )}
                    {d.status !== 'resolved' && (
                      <button
                        onClick={() => handleDisputeStatus(d._id, 'resolved')}
                        className="text-xs font-mono border border-sage text-sage px-3 py-1 rounded hover:bg-sage/10"
                      >
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!disputes?.length && (
            <p className="text-text-muted text-sm p-6 text-center">No disputes filed.</p>
          )}
        </div>
      )}

      {viewingReason && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6"
          onClick={() => setViewingReason(null)}
        >
          <div
            className="bg-ink border border-border rounded-lg p-6 max-w-lg w-full max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg">Dispute Reason</h3>
              <button
                onClick={() => setViewingReason(null)}
                className="text-text-muted hover:text-text-primary text-xl leading-none"
              >
                ×
              </button>
            </div>
            <p className="text-text-secondary text-xs font-mono mb-3">
              {viewingReason.gig?.title} — raised by {viewingReason.raisedBy?.name}
            </p>
            <p className="text-text-primary text-sm whitespace-pre-wrap mb-4">{viewingReason.reason}</p>
            {viewingReason.evidenceUrls?.length > 0 && (
              <div>
                <p className="text-text-muted text-xs font-mono uppercase mb-2">Evidence</p>
                <div className="flex flex-wrap gap-2">
                  {viewingReason.evidenceUrls.map((url, idx) => (
                    <a key={idx} href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt="evidence" className="w-20 h-20 object-cover rounded border border-border hover:border-amber transition" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {confirmingToggle && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6"
          onClick={() => setConfirmingToggle(false)}
        >
          <div
            className="bg-ink border border-border rounded-lg p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-lg mb-3">
              {settings?.manualGigApprovalEnabled ? 'Disable' : 'Enable'} manual gig approval?
            </h3>
            <p className="text-text-secondary text-sm mb-6">
              {settings?.manualGigApprovalEnabled
                ? 'New gigs will go live immediately without admin review.'
                : 'New gigs will require your approval before appearing in the marketplace.'}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmingToggle(false)}
                className="text-xs font-mono border border-border px-4 py-2 rounded hover:border-border-strong"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleApproval}
                className="text-xs font-mono bg-amber text-ink px-4 py-2 rounded hover:opacity-90"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}


