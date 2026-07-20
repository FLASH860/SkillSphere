import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer} from 'recharts';
import { getFreelancerStats } from '../api/stats';
import { getAssignedGigs } from '../api/gigs';
import { getReviewAnalytics } from '../api/reviews';
import DashboardShell from '../components/DashboardShell';
const COLORS = ['#E8A33D', '#6B8F71', '#5B6478', '#8B5CF6'];
export default function FreelancerDashboard() {
  const user = useSelector((s) => s.auth.user);
  const { data: stats, isLoading } = useQuery({ queryKey: ['freelancerStats'], queryFn:getFreelancerStats });
  const { data: assignedGigs, isLoading: gigsLoading } = useQuery({ queryKey: ['assignedGigs'], queryFn: getAssignedGigs });
  const { data: reviewStats } = useQuery({
    queryKey: ['reviewAnalytics', user?._id],
    queryFn: () => getReviewAnalytics(user._id),
    enabled: !!user?._id,
  });
  const totalEarnings = stats?.earnings?.reduce((sum, e) => sum + e.amount, 0) || 0;
  return (
    <DashboardShell title="Freelancer Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-5">
          <p className="text-white/40 text-xs font-mono uppercase">Total Proposals</p>
          <p className="text-3xl font-serif mt-2">{stats?.totalProposals || 0}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-5">
          <p className="text-white/40 text-xs font-mono uppercase">Total Earnings</p>
          <p className="text-3xl font-serif mt-2 text-sage">₹{totalEarnings.toLocaleString()}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-5">
          <p className="text-white/40 text-xs font-mono uppercase">Reputation Score</p>
          <p className="text-3xl font-serif mt-2 text-amber">
            {reviewStats?.totalReviews > 0 ? `${reviewStats.weightedScore} ★` : '—'}
          </p>
          {reviewStats?.totalReviews > 0 && (
            <p className="text-white/30 text-xs font-mono mt-1">
              from {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-lg p-5">
          <p className="text-white/40 text-xs font-mono uppercase">Profile Views</p>
          <p className="text-3xl font-serif mt-2">{stats?.profileViews ?? 0}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-5">
          <p className="text-white/40 text-xs font-mono uppercase">Job Success Rate</p>
          <p className="text-3xl font-serif mt-2 text-sage">
            {stats?.jobSuccessRate !== null && stats?.jobSuccessRate !== undefined ? `${stats.jobSuccessRate}%` : '—'}
          </p>
          {stats?.decidedCount > 0 && (
            <p className="text-white/30 text-xs font-mono mt-1">
              from {stats.decidedCount} decided proposal{stats.decidedCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      <div className="mb-8">
        <p className="text-white/50 text-xs font-mono uppercase mb-3">Active Gigs</p>
        {gigsLoading && <p className="text-white/40 text-sm font-mono">Loading...</p>}
        {!gigsLoading && (!assignedGigs || assignedGigs.length === 0) && (
          <div className="border border-dashed border-white/15 rounded-lg p-6 text-center text-white/40 text-sm">
            No active gigs yet. Once a client accepts your proposal, it'll show up here.
          </div>
        )}
        {!gigsLoading && assignedGigs?.length > 0 && (
          <div className="space-y-2">
            {assignedGigs.map((g) => (
              <Link
                key={g._id}
                to={`/gigs/${g._id}`}
                className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3 hover:border-amber/40 transition"
              >
                <div>
                  <p className="text-white/90 text-sm font-medium">{g.title}</p>
                  <p className="text-white/40 text-xs font-mono mt-0.5">
                    Client: {g.client?.name || '—'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sage text-xs font-mono capitalize">{g.status}</span>
                  {typeof g.progressPercent === 'number' && (
                    <p className="text-amber text-xs font-mono mt-0.5">{g.progressPercent}% done</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {!isLoading && stats && (stats.statusBreakdown?.length > 0 || stats.earnings?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {stats.statusBreakdown?.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-5">
              <p className="text-white/50 text-xs font-mono uppercase mb-3">Proposal Status</p>
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
                  <Tooltip contentStyle={{ background: '#14192B', border: '1px solid #ffffff20' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {stats.earnings?.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-5">
              <p className="text-white/50 text-xs font-mono uppercase mb-3">Earnings byGig</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.earnings}>
                  <XAxis dataKey="name" stroke="#ffffff60" fontSize={11} />
                  <YAxis stroke="#ffffff60" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#14192B', border: '1px solid #ffffff20' }} />
                  <Bar dataKey="amount" fill="#6B8F71" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {reviewStats?.totalReviews > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/50 text-xs font-mono uppercase">Rating Distribution</p>
            <p className="text-white/40 text-xs font-mono">
              raw avg {reviewStats.rawAverage} · weighted {reviewStats.weightedScore}
            </p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={reviewStats.distribution}>
              <XAxis dataKey="name" stroke="#ffffff60" fontSize={12} />
              <YAxis stroke="#ffffff60" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#14192B', border: '1px solid #ffffff20' }} />
              <Bar dataKey="count" fill="#E8A33D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {!isLoading && (!stats || (stats.totalProposals === 0)) && (
        <div className="border border-dashed border-white/15 rounded-lg p-10 text-center text-white/40">
          Apply to gigs to see your stats here.
        </div>
      )}
    </DashboardShell>
  );
}

