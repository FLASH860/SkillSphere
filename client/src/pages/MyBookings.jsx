import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getMyBookings, updateBookingStatus } from '../api/bookings';
import DashboardShell from '../components/DashboardShell';

export default function MyBookings() {
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: getMyBookings,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateBookingStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myBookings'] }),
  });

  const statusColor = {
    pending: 'text-amber',
    confirmed: 'text-sage',
    declined: 'text-red-400',
  };

  return (
    <DashboardShell title="My Bookings">
      {isLoading && <p className="text-text-muted font-mono text-sm">Loading...</p>}
      {!isLoading && bookings?.length === 0 && (
        <div className="border border-dashed border-border rounded-lg p-10 text-center text-text-muted">
          No booking requests yet.
        </div>
      )}
      <div className="space-y-4 max-w-2xl">
        {bookings?.map((b) => (
          <div key={b._id} className="bg-surface border border-border rounded-lg p-5">
            <div className="flex justify-between items-start mb-2">
              <div>
                <Link to={`/gigs/${b.gig?._id}`} className="font-serif text-lg hover:text-amber transition">
                  {b.gig?.title}
                </Link>
                <p className="text-text-muted text-xs font-mono">
                  {b.client?.name} · {b.client?.email}
                </p>
              </div>
              <span className={`text-xs font-mono uppercase ${statusColor[b.status]}`}>
                {b.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm font-mono mb-3">
              <span className="text-amber">{b.day}</span>
              <span className="text-text-secondary capitalize">{b.slot}</span>
            </div>
            {b.message && <p className="text-text-secondary text-sm mb-3">{b.message}</p>}
            {b.status === 'pending' && (
              <div className="flex gap-3">
                <button
                  onClick={() => statusMutation.mutate({ id: b._id, status: 'confirmed' })}
                  className="bg-sage text-ink text-sm font-semibold px-4 py-1.5 rounded hover:opacity-90"
                >
                  Confirm
                </button>
                <button
                  onClick={() => statusMutation.mutate({ id: b._id, status: 'declined' })}
                  className="border border-border text-text-secondary text-sm px-4 py-1.5 rounded hover:border-red-400 hover:text-red-400"
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}

