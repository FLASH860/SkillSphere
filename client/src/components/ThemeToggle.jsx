import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '../store/themeSlice';

export default function ThemeToggle() {
  const mode = useSelector((s) => s.theme.mode);
  const dispatch = useDispatch();
  const isDark = mode === 'dark';

  return (
    <button
      type="button"
      onClick={() => dispatch(toggleTheme())}
      className="w-full flex items-center justify-center gap-2 border border-white/20 rounded px-3 py-1.5 text-sm font-mono hover:border-white hover:bg-white/10 transition text-white/80"
    >
      <span>{isDark ? '🌙' : '☀️'}</span>
      <span>{isDark ? 'Dark mode' : 'Light mode'}</span>
    </button>
  );
}
