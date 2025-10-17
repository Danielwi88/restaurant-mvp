import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

type Props = {
  className?: string;
  tone?: 'auto' | 'light' | 'dark';
};

export default function ThemeToggle({ className, tone = 'auto' }: Props) {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const effective = theme === 'system' ? systemTheme : theme;
  const isDark = effective === 'dark';

  const title = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  const next = isDark ? 'light' : 'dark';

  const toneClass =
    tone === 'auto'
      ? ''
      : tone === 'dark'
      ? 'text-white'
      : 'text-zinc-900';

  return (
    <button
      type='button'
      aria-label={title}
      title={title}
      onClick={() => setTheme(next)}
      className={
        `relative grid place-items-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 ` +
        (className ?? '') +
        ' ' +
        toneClass
      }
    >
      <Sun
        className={`size-5 sm:size-6 transition-transform duration-300 ${
          isDark ? '-rotate-90 opacity-0' : 'rotate-0 opacity-100'
        }`}
      />
      <Moon
        className={`absolute size-5 sm:size-6 transition-transform duration-300 ${
          isDark ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'
        }`}
      />
    </button>
  );
}

