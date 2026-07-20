import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { initSocket, getSocket } from '../api/socket';
import { getNotifications, markAsRead, markAllAsRead } from '../api/notifications';

export default function NotificationBell() {
  const user = useSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const ref = useRef(null);

  const unreadCount = items.filter((n) => !n.read).length;

  useEffect(() => {
    if (!user?._id) return;
    getNotifications().then(setItems).catch(() => {});

    initSocket(user._id);
    const socket = getSocket();
    const handler = (n) => setItems((prev) => [n, ...prev]);
    socket.on('newNotification', handler);
    return () => socket.off('newNotification', handler);
  }, [user?._id]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleClick = async (n) => {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      markAsRead(n._id).catch(() => {});
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleMarkAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    markAllAsRead().catch(() => {});
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative text-white/70 hover:text-amber transition"
        aria-label="Notifications"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-amber text-ink text-[10px] font-mono font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-ink border border-white/10 rounded shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
            <span className="text-white/80 text-sm font-mono">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAll} className="text-amber text-xs font-mono hover:underline">
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="text-white/40 text-sm p-4 font-mono">No notifications yet</p>
          ) : (
            items.map((n) => (
              <button
                key={n._id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition ${
                  n.read ? 'opacity-50' : ''
                }`}
              >
                <p className="text-sm text-white/90">{n.message}</p>
                <p className="text-xs text-white/40 font-mono mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
