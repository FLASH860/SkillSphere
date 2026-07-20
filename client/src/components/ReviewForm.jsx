import { useState } from 'react';
import { createReview } from '../api/reviews';
import StarRating from './StarRating';

export default function ReviewForm({ gigId, revieweeId, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a star rating');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await createReview({ gig: gigId, reviewee: revieweeId, rating, comment });
      setDone(true);
      onSubmitted?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="bg-sage/10 border border-sage/30 text-sage px-4 py-3 rounded">
        Review submitted. Thanks for the feedback!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white/5 border border-white/10 rounded-lg p-5">
      <p className="font-serif text-lg text-white">Leave a Review</p>
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2 rounded">
          {error}
        </div>
      )}
      <StarRating value={rating} onChange={setRating} />
      <textarea
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional comment..."
        className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-white focus:outline-none focus:border-amber"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-amber text-ink font-semibold px-5 py-1.5 rounded hover:opacity-90 transition disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
