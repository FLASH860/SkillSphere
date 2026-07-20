import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getProfile, updateProfile } from '../api/users';
import { setup2FA, enable2FA, disable2FA } from '../api/twofa';
import { uploadToCloudinary } from '../api/upload';
import { setCredentials } from '../store/authSlice';
import DashboardShell from '../components/DashboardShell';

const LEVELS = ['beginner', 'intermediate', 'expert'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS = [
  { key: 'morning', label: 'Morning' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening', label: 'Evening' },
];

export default function EditProfile() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [newLevel, setNewLevel] = useState('intermediate');
  const [availability, setAvailability] = useState(
    DAYS.map((day) => ({ day, slots: [] }))
  );
  const [portfolio, setPortfolio] = useState([]);
  const [resumeUrl, setResumeUrl] = useState('');
  const [certifications, setCertifications] = useState([]);
  const [newCert, setNewCert] = useState({ name: '', issuer: '', year: '' });
  const [experience, setExperience] = useState([]);
  const [newExp, setNewExp] = useState({ title: '', company: '', from: '', to: '', description: '' });
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [setupCode, setSetupCode] = useState('');
  const [twoFAError, setTwoFAError] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);

  useEffect(() => {
    getProfile(user._id).then((res) => {
      setBio(res.profile?.bio || '');
      setHourlyRate(res.profile?.hourlyRate || '');
      setSkills(res.profile?.skills || []);
      setPortfolio(res.profile?.portfolio || []);
      setResumeUrl(res.profile?.resumeUrl || '');
      setCertifications(res.profile?.certifications || []);
      setExperience(res.profile?.experience || []);
      if (res.profile?.availability?.length > 0) {
        setAvailability(
          DAYS.map((day) => {
            const existing = res.profile.availability.find((a) => a.day === day);
            return existing ? existing : { day, slots: [] };
          })
        );
      }
      setTwoFAEnabled(res.user?.twoFactorEnabled || false);
      setLoading(false);
    });
  }, [user._id]);

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setSkills([...skills, { name: newSkill.trim(), level: newLevel }]);
    setNewSkill('');
  };

  const removeSkill = (idx) => {
    setSkills(skills.filter((_, i) => i !== idx));
  };

  const toggleSlot = (day, slotKey) => {
    setAvailability((prev) =>
      prev.map((d) => {
        if (d.day !== day) return d;
        const has = d.slots.includes(slotKey);
        return { ...d, slots: has ? d.slots.filter((s) => s !== slotKey) : [...d.slots, slotKey] };
      })
    );
  };

  const handlePortfolioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploadingPortfolio(true);
    try {
      const url = await uploadToCloudinary(file);
      setPortfolio([...portfolio, { title: file.name.replace(/\.[^/.]+$/, ''), imageUrl: url, link: '' }]);
    } catch (err) {
      setUploadError(err.message || 'Portfolio upload failed');
    } finally {
      setUploadingPortfolio(false);
      e.target.value = '';
    }
  };

  const updatePortfolioItem = (idx, key, value) => {
    const copy = [...portfolio];
    copy[idx] = { ...copy[idx], [key]: value };
    setPortfolio(copy);
  };

  const removePortfolioItem = (idx) => {
    setPortfolio(portfolio.filter((_, i) => i !== idx));
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploadingResume(true);
    try {
      const url = await uploadToCloudinary(file);
      setResumeUrl(url);
    } catch (err) {
      setUploadError(err.message || 'Resume upload failed');
    } finally {
      setUploadingResume(false);
      e.target.value = '';
    }
  };

  const addCertification = () => {
    if (!newCert.name.trim()) return;
    setCertifications([...certifications, { ...newCert, year: Number(newCert.year) || undefined }]);
    setNewCert({ name: '', issuer: '', year: '' });
  };

  const removeCertification = (idx) => {
    setCertifications(certifications.filter((_, i) => i !== idx));
  };

  const addExperience = () => {
    if (!newExp.title.trim() || !newExp.company.trim()) return;
    setExperience([...experience, { ...newExp }]);
    setNewExp({ title: '', company: '', from: '', to: '', description: '' });
  };

  const removeExperience = (idx) => {
    setExperience(experience.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    await updateProfile({
      profile: { bio, hourlyRate: Number(hourlyRate) || 0, skills, availability, portfolio, resumeUrl, certifications, experience },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleStart2FASetup = async () => {
    setTwoFAError('');
    const { qrDataUrl } = await setup2FA();
    setQrDataUrl(qrDataUrl);
  };

  const handleConfirm2FA = async () => {
    setTwoFAError('');
    setTwoFALoading(true);
    try {
      await enable2FA(setupCode);
      setTwoFAEnabled(true);
      setQrDataUrl(null);
      setSetupCode('');
      dispatch(setCredentials({ ...user, twoFactorEnabled: true }));
    } catch (err) {
      setTwoFAError(err.response?.data?.message || 'Invalid code');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    await disable2FA();
    setTwoFAEnabled(false);
    dispatch(setCredentials({ ...user, twoFactorEnabled: false }));
  };

  const inputClass =
    'w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-white focus:outline-none focus:border-amber';
  const labelClass = 'block text-white/70 text-sm mb-1 font-mono';

  if (loading) {
    return (
      <DashboardShell title="Edit Profile">
        <p className="text-white/40 font-mono text-sm">Loading...</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Edit Profile">
      <div className="max-w-2xl space-y-6">
        <div>
          <label className={labelClass}>Bio</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className={inputClass}
            placeholder="Tell clients about yourself..."
          />
        </div>

        <div>
          <label className={labelClass}>Hourly Rate (₹)</label>
          <input
            type="number"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Skills</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {skills.map((s, idx) => (
              <span
                key={idx}
                className="flex items-center gap-2 text-xs font-mono bg-white/10 px-3 py-1.5 rounded text-white/80"
              >
                {s.name} <span className="text-sage">({s.level})</span>
                <button onClick={() => removeSkill(idx)} className="text-white/40 hover:text-red-400">
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSkill()}
              placeholder="e.g. React"
              className={inputClass}
            />
            <select
              value={newLevel}
              onChange={(e) => setNewLevel(e.target.value)}
              className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <button
              onClick={addSkill}
              className="bg-white/10 text-white px-4 py-2 rounded text-sm hover:bg-white/20"
            >
              Add
            </button>
          </div>
        </div>

        {uploadError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2 rounded">
            {uploadError}
          </div>
        )}

        <div>
          <label className={labelClass}>Portfolio</label>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {portfolio.map((p, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                {p.imageUrl && (
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    onClick={() => setLightboxImage(p.imageUrl)}
                    className="w-full h-32 object-cover cursor-pointer hover:opacity-80 transition"
                  />
                )}
                <div className="p-3 space-y-2">
                  <input
                    value={p.title}
                    onChange={(e) => updatePortfolioItem(idx, 'title', e.target.value)}
                    placeholder="Project title"
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm"
                  />

                  <button
                    onClick={() => removePortfolioItem(idx)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <label className="inline-block cursor-pointer bg-white/10 text-white px-4 py-2 rounded text-sm hover:bg-white/20">
            {uploadingPortfolio ? 'Uploading...' : '+ Add portfolio image'}
            <input
              type="file"
              accept="image/*"
              onChange={handlePortfolioUpload}
              disabled={uploadingPortfolio}
              className="hidden"
            />
          </label>
        </div>

        <div>
          <label className={labelClass}>Resume</label>
          {resumeUrl && (
            <a
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="block text-sage text-sm font-mono mb-2 hover:underline truncate"
            >
              {resumeUrl}
            </a>
          )}
          <label className="inline-block cursor-pointer bg-white/10 text-white px-4 py-2 rounded text-sm hover:bg-white/20">
            {uploadingResume ? 'Uploading...' : resumeUrl ? 'Replace resume' : '+ Upload resume'}
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeUpload}
              disabled={uploadingResume}
              className="hidden"
            />
          </label>
        </div>

        <div>
          <label className={labelClass}>Certifications</label>
          <div className="space-y-2 mb-3">
            {certifications.map((c, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-white/5 border border-white/10 rounded px-3 py-2"
              >
                <span className="text-white/80 text-sm">
                  {c.name} {c.issuer && <span className="text-white/40">· {c.issuer}</span>}{' '}
                  {c.year && <span className="text-sage font-mono text-xs">({c.year})</span>}
                </span>
                <button onClick={() => removeCertification(idx)} className="text-white/40 hover:text-red-400">
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newCert.name}
              onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
              placeholder="Certification name"
              className={inputClass}
            />
            <input
              value={newCert.issuer}
              onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
              placeholder="Issuer"
              className={`${inputClass} w-40`}
            />
            <input
              type="number"
              value={newCert.year}
              onChange={(e) => setNewCert({ ...newCert, year: e.target.value })}
              placeholder="Year"
              className={`${inputClass} w-24`}
            />
            <button
              onClick={addCertification}
              className="bg-white/10 text-white px-4 py-2 rounded text-sm hover:bg-white/20"
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <label className={labelClass}>Work Experience</label>
          <div className="space-y-2 mb-3">
            {experience.map((exp, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded px-3 py-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white/90 text-sm font-medium">{exp.title} <span className="text-white/40">@ {exp.company}</span></p>
                    <p className="text-white/40 text-xs font-mono mt-0.5">
                      {exp.from || '—'} to {exp.to || 'Present'}
                    </p>
                    {exp.description && (
                      <p className="text-white/60 text-xs mt-1">{exp.description}</p>
                    )}
                  </div>
                  <button onClick={() => removeExperience(idx)} className="text-white/40 hover:text-red-400 ml-2">
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                value={newExp.title}
                onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
                placeholder="Job title"
                className={inputClass}
              />
              <input
                value={newExp.company}
                onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                placeholder="Company"
                className={inputClass}
              />
            </div>
            <div className="flex gap-2">
              <input
                value={newExp.from}
                onChange={(e) => setNewExp({ ...newExp, from: e.target.value })}
                placeholder="From (e.g. Jan 2023)"
                className={inputClass}
              />
              <input
                value={newExp.to}
                onChange={(e) => setNewExp({ ...newExp, to: e.target.value })}
                placeholder="To (blank = present)"
                className={inputClass}
              />
            </div>
            <textarea
              rows={2}
              value={newExp.description}
              onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
              placeholder="Brief description (optional)"
              className={inputClass}
            />
            <button
              onClick={addExperience}
              className="bg-white/10 text-white px-4 py-2 rounded text-sm hover:bg-white/20"
            >
              Add experience
            </button>
          </div>
        </div>

        <div>
          <label className={labelClass}>Availability</label>
          <div className="border border-white/10 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5">
                  <th className="text-left text-white/40 text-xs font-mono uppercase px-3 py-2">Day</th>
                  {SLOTS.map((s) => (
                    <th key={s.key} className="text-white/40 text-xs font-mono uppercase px-3 py-2">
                      {s.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {availability.map((d) => (
                  <tr key={d.day} className="border-t border-white/10">
                    <td className="px-3 py-2 text-white/70 font-mono text-xs">{d.day}</td>
                    {SLOTS.map((s) => {
                      const active = d.slots.includes(s.key);
                      return (
                        <td key={s.key} className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSlot(d.day, s.key)}
                            className={`w-5 h-5 rounded border transition ${
                              active
                                ? 'bg-sage border-sage'
                                : 'bg-white/5 border-white/20 hover:border-white/40'
                            }`}
                            aria-label={`${d.day} ${s.label}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="bg-amber text-ink font-semibold px-6 py-2 rounded hover:opacity-90 transition"
        >
          Save Profile
        </button>
        {saved && <p className="text-sage text-sm font-mono">Saved ✓</p>}

        <div className="border-t border-white/10 pt-6">
          <h2 className="font-serif text-xl mb-4">Security</h2>

          {twoFAEnabled && !qrDataUrl && (
            <div className="flex items-center justify-between bg-sage/5 border border-sage/30 rounded px-4 py-3">
              <span className="text-sage text-sm font-mono">✓ Two-Factor Authentication is enabled</span>
              <button
                onClick={handleDisable2FA}
                className="text-xs font-mono border border-red-400/50 text-red-400 px-3 py-1 rounded hover:bg-red-400/10"
              >
                Disable
              </button>
            </div>
          )}

          {!twoFAEnabled && !qrDataUrl && (
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded px-4 py-3">
              <span className="text-white/60 text-sm font-mono">Two-Factor Authentication is off</span>
              <button
                onClick={handleStart2FASetup}
                className="text-xs font-mono bg-amber text-ink px-3 py-1 rounded hover:opacity-90"
              >
                Enable 2FA
              </button>
            </div>
          )}

          {qrDataUrl && (
            <div className="bg-white/5 border border-white/10 rounded px-4 py-4 space-y-3">
              <p className="text-white/70 text-sm">
                Scan this QR code with Google Authenticator (or any TOTP app), then enter the 6-digit code below.
              </p>
              <img src={qrDataUrl} alt="2FA QR Code" className="bg-white p-2 rounded w-40 h-40" />
              <div className="flex gap-2">
                <input
                  value={setupCode}
                  onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                  placeholder="000000"
                  className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-center tracking-[0.3em] font-mono w-32"
                />
                <button
                  onClick={handleConfirm2FA}
                  disabled={twoFALoading}
                  className="bg-amber text-ink font-semibold px-4 py-2 rounded text-sm hover:opacity-90 disabled:opacity-50"
                >
                  {twoFALoading ? 'Verifying...' : 'Confirm & Enable'}
                </button>
              </div>
              {twoFAError && <p className="text-red-400 text-xs font-mono">{twoFAError}</p>}
            </div>
          )}
        </div>
      </div>

      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="Portfolio preview"
            className="max-w-full max-h-full rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white text-3xl leading-none"
          >
            ×
          </button>
        </div>
      )}
    </DashboardShell>
  );
}











