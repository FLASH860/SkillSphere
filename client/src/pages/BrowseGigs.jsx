import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getGigs } from '../api/gigs';
import DashboardShell from '../components/DashboardShell';
import { Link } from 'react-router-dom';

export default function BrowseGigs() {
  const [filters, setFilters] = useState({ skill: '', minBudget: '', maxBudget: '', city: '', minRating: '' });

  const { data: gigs, isLoading } = useQuery({
    queryKey: ['gigs', filters],
    queryFn: () =>
      getGigs({
        skill: filters.skill || undefined,
        minBudget: filters.minBudget || undefined,
        maxBudget: filters.maxBudget || undefined,
        city: filters.city || undefined,
        minRating: filters.minRating || undefined,
      }),
  });

  const inputClass =
    'bg-surface border border-border rounded px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-amber';

  return (
    <DashboardShell title="Browse Gigs">
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          placeholder="Skill (e.g. React)"
          value={filters.skill}
          onChange={(e) => setFilters({ ...filters, skill: e.target.value })}
          className={inputClass}
        />
        <input
          type="number"
          placeholder="Min budget"
          value={filters.minBudget}
          onChange={(e) => setFilters({ ...filters, minBudget: e.target.value })}
          className={`${inputClass} w-32`}
        />
        <input
          type="number"
          placeholder="Max budget"
          value={filters.maxBudget}
          onChange={(e) => setFilters({ ...filters, maxBudget: e.target.value })}
          className={`${inputClass} w-32`}
        />
        <input
          placeholder="City"
          value={filters.city}
          onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          className={inputClass}
        />
        <select
          value={filters.minRating}
          onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
          className={inputClass}
        >
          <option value="">Any client rating</option>
          <option value="4">4+ stars</option>
          <option value="3">3+ stars</option>
        </select>
      </div>

      {isLoading && <p className="text-text-muted font-mono text-sm">Loading gigs...</p>}

      {!isLoading && gigs?.length === 0 && (
        <div className="border border-dashed border-border rounded-lg p-10 text-center text-text-muted">
          No gigs match your filters yet.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gigs?.map((gig) => (
          <Link
            to={`/gigs/${gig._id}`}
            key={gig._id}
            className="bg-surface border border-border rounded-lg p-5 hover:border-amber transition block"
          >
            <h3 className="font-serif text-lg text-text-primary mb-1">{gig.title}</h3>
            <p className="text-text-secondary text-sm line-clamp-2 mb-3">{gig.description}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {gig.skillsRequired.map((s) => (
                <span
                  key={s}
                  className="text-xs font-mono bg-surface-alt px-2 py-0.5 rounded text-text-secondary"
                >
                  {s}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm font-mono">
              <span className="text-amber">
                ₹{gig.budget.min.toLocaleString()} – ₹{gig.budget.max.toLocaleString()}
              </span>
              <span className="text-text-muted">
                {gig.location?.remote ? 'Remote' : gig.location?.city || '—'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}

