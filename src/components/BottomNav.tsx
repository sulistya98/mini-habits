'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, SlidersHorizontal, Sparkles, CalendarDays, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Today', icon: CheckSquare },
    { href: '/manage', label: 'Manage', icon: SlidersHorizontal },
    { href: '/generate', label: 'Generate', icon: Sparkles },
    { href: '/history', label: 'History', icon: CalendarDays },
    { href: '/profile', label: 'Profile', icon: UserCircle },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 safe-area-pb z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200",
                isActive ? "text-neutral-900 dark:text-neutral-50" : "text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive && "stroke-2")} />
              <span className="text-[10px] font-medium tracking-wide uppercase">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
