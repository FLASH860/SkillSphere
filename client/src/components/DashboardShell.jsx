import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { logout } from '../store/authSlice';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

export default function DashboardShell({ title, children }) {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

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
    <div className="h-screen bg-ink text-text-primary flex overflow-hidden">
      <aside className="w-56 shrink-0 h-screen bg-sidebar p-4 flex flex-col">
        <div className="mb-8 px-2 shrink-0 flex items-start justify-between">
          <div>
            <h1 className="font-serif text-xl text-white">SkillSphere</h1>
            <p className="text-white/50 font-mono text-[10px] uppercase tracking-wide mt-1">{title}</p>
          </div>
          <NotificationBell />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto min-h-0">
          {links.map((l) => {
            const active = location.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={
                  active
                    ? 'block text-sm font-mono px-3 py-2 rounded bg-white/15 text-white font-semibold border-l-2 border-white'
                    : 'block text-sm font-mono px-3 py-2 rounded text-white/60 hover:text-white hover:bg-white/10 transition border-l-2 border-transparent'
                }
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-white/15 space-y-3 shrink-0">
          <div className="px-2">
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-2 px-2">
            <span className="text-white/70 text-sm font-mono truncate">{user?.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-sm border border-white/20 px-3 py-1.5 rounded hover:border-white hover:bg-white/10 transition text-white/80"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto p-6 min-h-0">{children}</main>
    </div>
  );
}





