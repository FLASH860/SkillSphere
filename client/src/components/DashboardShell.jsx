import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { logout } from '../store/authSlice';
import NotificationBell from './NotificationBell';

export default function DashboardShell({ title, children }) {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navLinks = {
    client: [
      { to: '/client', label: 'Dashboard' },
      { to: '/client/post-gig', label: 'Post a Gig' },
    ],
    freelancer: [
      { to: '/freelancer', label: 'Dashboard' },
      { to: '/gigs', label: 'Browse Gigs' },
      { to: '/freelancer/proposals', label: 'My Proposals' },
      { to: '/freelancer/bookings', label: 'My Bookings' },
    ],
    admin: [{ to: '/admin', label: 'Dashboard' }],
  };

  const links = [...(navLinks[user?.role] || []), { to: '/messages', label: 'Messages' }, { to: '/profile', label: 'Edit Profile' }];

  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div>
            <h1 className="font-serif text-2xl">SkillSphere</h1>
            <p className="text-white/40 font-mono text-xs uppercase tracking-wide">{title}</p>
          </div>
          <nav className="flex items-center gap-4">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-sm text-white/60 hover:text-amber transition font-mono"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <span className="text-white/70 text-sm font-mono">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm border border-white/20 px-3 py-1 rounded hover:border-amber hover:text-amber transition"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}

