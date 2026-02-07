'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, SlidersHorizontal, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Today', icon: CheckSquare },
    { href: '/manage', label: 'Manage', icon: SlidersHorizontal },
    { href: '/history', label: 'History', icon: CalendarDays },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 safe-area-pb z-50">
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
                isActive ? "text-neutral-900" : "text-neutral-400 hover:text-neutral-600"
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
