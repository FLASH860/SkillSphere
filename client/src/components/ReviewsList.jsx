import { useQuery } from '@tanstack/react-query';
import { getReviewsForUser } from '../api/reviews';
import StarRating from './StarRating';

export default function ReviewsList({ userId }) {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', userId],
    queryFn: () => getReviewsForUser(userId),
    enabled: !!userId,
  });

  if (isLoading) return <p className="text-white/40 font-mono text-sm">Loading reviews...</p>;
  if (!reviews || reviews.length === 0) {
    return <p className="text-white/40 font-mono text-sm">No reviews yet.</p>;
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r._id} className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="font-serif text-white">{r.reviewer?.name}</p>
            <StarRating value={r.rating} readOnly />
          </div>
          {r.gig?.title && <p className="text-white/40 text-xs font-mono mb-2">re: {r.gig.title}</p>}
          {r.comment && <p className="text-white/70 text-sm">{r.comment}</p>}
        </div>
      ))}
    </div>
  );
}
