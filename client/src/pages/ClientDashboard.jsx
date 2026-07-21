import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getMyGigs } from '../api/gigs';
import { getClientStats } from '../api/stats';
import DashboardShell from '../components/DashboardShell';

const COLORS = ['var(--color-amber)', 'var(--color-sage)', 'var(--color-accent-soft)'];

export default function ClientDashboard() {
  const { data: gigs, isLoading } = useQuery({ queryKey: ['myGigs'], queryFn: getMyGigs });
  const { data: stats } = useQuery({ queryKey: ['clientStats'], queryFn: getClientStats });

  const activeCount = gigs?.filter((g) => g.status === 'open' || g.status === 'in_progress').length || 0;

  return (
    <DashboardShell title="Client Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-amber rounded-lg p-5 text-ink">
          <p className="text-xs font-mono uppercase opacity-70">Active Gigs</p>
          <p className="text-3xl font-serif mt-2">{activeCount}</p>
        </div>
        <div className="bg-surface border border-border-strong rounded-lg p-5">
          <p className="text-text-muted text-xs font-mono uppercase">Total Gigs Posted</p>
          <p className="text-3xl font-serif mt-2 text-amber">{gigs?.length || 0}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-5">
          <p className="text-text-muted text-xs font-mono uppercase">Total Spent</p>
          <p className="text-3xl font-mono mt-2">₹0</p>
        </div>
      </div>

      {stats && (stats.statusBreakdown?.length > 0 || stats.gigsPerMonth?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {stats.statusBreakdown?.length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-5">
              <p className="text-text-secondary text-xs font-mono uppercase mb-3">Gig Status Breakdown</p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={stats.statusBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {stats.statusBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {stats.gigsPerMonth?.length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-5">
              <p className="text-text-secondary text-xs font-mono uppercase mb-3">Gigs Posted Per Month</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.gigsPerMonth}>
                  <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={12} />
                  <YAxis stroke="var(--color-text-secondary)" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }} cursor={{ fill: 'rgba(147, 112, 219, 0.12)' }} />
                  <Bar dataKey="gigs" fill="var(--color-amber)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl">Your Gigs</h2>
        <Link
          to="/client/post-gig"
          className="bg-amber text-ink text-sm font-semibold px-4 py-1.5 rounded hover:opacity-90"
        >
          + Post New Gig
        </Link>
      </div>

      {isLoading && <p className="text-text-muted font-mono text-sm">Loading...</p>}

      {!isLoading && gigs?.length === 0 && (
        <div className="border border-dashed border-border rounded-lg p-10 text-center text-text-muted">
          You haven't posted any gigs yet.
        </div>
      )}

      <div className="space-y-3">
        {gigs?.map((gig) => (
          <div
            key={gig._id}
            className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-serif text-lg">{gig.title}</p>
              <p className="text-text-muted text-xs font-mono">
                ₹{gig.budget.min.toLocaleString()} – ₹{gig.budget.max.toLocaleString()} ·{' '}
                <span className="capitalize text-sage">{gig.status}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to={`/gigs/${gig._id}`}
                className="text-sm border border-border px-3 py-1.5 rounded hover:border-amber hover:text-amber transition"
              >
                View Gig
              </Link>
              {gig.status === 'open' && (
                <Link
                  to={`/client/gigs/${gig._id}/edit`}
                  className="text-sm border border-border px-3 py-1.5 rounded hover:border-amber hover:text-amber transition"
                >
                  Edit
                </Link>
              )}
              <Link
                to={`/client/gigs/${gig._id}/proposals`}
                className="text-sm border border-border px-3 py-1.5 rounded hover:border-amber hover:text-amber transition"
              >
                View Proposals
              </Link>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}



