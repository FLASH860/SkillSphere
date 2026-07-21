import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getGigById, updateGig } from '../api/gigs';
import DashboardShell from '../components/DashboardShell';

export default function EditGig() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState({
    title: '',
    description: '',
    skillsRequired: '',
    budgetMin: '',
    budgetMax: '',
    city: '',
    state: '',
    remote: false,
  });
  const [milestones, setMilestones] = useState([{ title: '', amount: '' }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    getGigById(id).then((gig) => {
      setForm({
        title: gig.title || '',
        description: gig.description || '',
        skillsRequired: (gig.skillsRequired || []).join(', '),
        budgetMin: gig.budget?.min ?? '',
        budgetMax: gig.budget?.max ?? '',
        city: gig.location?.city || '',
        state: gig.location?.state || '',
        remote: gig.location?.remote || false,
      });
      setMilestones(
        gig.milestones?.length > 0
          ? gig.milestones.map((m) => ({ title: m.title, amount: m.amount }))
          : [{ title: '', amount: '' }]
      );
      setFetching(false);
    });
  }, [id]);

  const updateMilestone = (i, key, value) => {
    const copy = [...milestones];
    copy[i][key] = value;
    setMilestones(copy);
  };

  const addMilestone = () => setMilestones([...milestones, { title: '', amount: '' }]);
  const removeMilestone = (i) => setMilestones(milestones.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await updateGig(id, {
        title: form.title,
        description: form.description,
        skillsRequired: form.skillsRequired.split(',').map((s) => s.trim()).filter(Boolean),
        budget: { min: Number(form.budgetMin), max: Number(form.budgetMax) },
        milestones: milestones
          .filter((m) => m.title && m.amount)
          .map((m) => ({ title: m.title, amount: Number(m.amount) })),
        location: { city: form.city, state: form.state, remote: form.remote },
      });
      navigate('/client');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update gig');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-surface border border-border rounded px-4 py-2 text-text-primary focus:outline-none focus:border-amber';
  const labelClass = 'block text-text-primary text-sm mb-1 font-mono';

  if (fetching) {
    return (
      <DashboardShell title="Edit Gig">
        <div className="max-w-2xl">
          <p className="text-text-muted font-mono text-sm">Loading...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Edit Gig">
      <div className="max-w-2xl">
        <h1 className="font-serif text-3xl mb-1">Edit Gig</h1>
        <p className="text-text-secondary font-mono text-sm mb-8">update the details of your gig</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClass}>Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Skills Required (comma-separated)</label>
            <input
              required
              value={form.skillsRequired}
              onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Budget Min (₹)</label>
              <input
                type="number"
                required
                value={form.budgetMin}
                onChange={(e) => setForm({ ...form, budgetMin: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Budget Max (₹)</label>
              <input
                type="number"
                required
                value={form.budgetMax}
                onChange={(e) => setForm({ ...form, budgetMax: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>City</label>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>State</label>
              <input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-text-secondary text-sm font-mono">
            <input
              type="checkbox"
              checked={form.remote}
              onChange={(e) => setForm({ ...form, remote: e.target.checked })}
            />
            Remote OK
          </label>

          <div>
            <label className={labelClass}>Milestones</label>
            <div className="space-y-2">
              {milestones.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    placeholder="Milestone title"
                    value={m.title}
                    onChange={(e) => updateMilestone(i, 'title', e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="number"
                    placeholder="₹ amount"
                    value={m.amount}
                    onChange={(e) => updateMilestone(i, 'amount', e.target.value)}
                    className={`${inputClass} w-40`}
                  />
                  {milestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMilestone(i)}
                      className="text-red-400 px-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addMilestone}
              className="mt-2 text-amber text-sm font-mono hover:underline"
            >
              + Add milestone
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber text-ink font-semibold py-2 rounded hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </DashboardShell>
  );
}









