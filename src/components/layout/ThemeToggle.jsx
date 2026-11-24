// src/components/layout/ThemeToggle.jsx
// Lightweight button to toggle between Light and Dark mode with Lucide icons

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle Theme"
      className={`p-2 rounded-xl bg-surface border border-white/10 text-muted hover:text-white transition-all active:scale-95 ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? (
        <Sun size={17} className="text-amber-400 stroke-[2.2]" />
      ) : (
        <Moon size={17} className="text-teal stroke-[2.2]" />
      )}
    </button>
  );
}
