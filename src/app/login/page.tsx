'use client';

import { useActionState } from 'react';
import { authenticate } from '@/lib/actions';
import { ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-950">
      <div className="w-full max-w-sm bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-xl shadow-neutral-200/50 dark:shadow-none border border-neutral-100 dark:border-neutral-800">
        <div className="mb-8 text-center">
            <h1 className="text-2xl font-light tracking-tight text-neutral-900 dark:text-white">Mini Habits</h1>
            <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-2">Sign in to track your progress</p>
        </div>

        <form action={dispatch} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1" htmlFor="email">
              Email
            </label>
            <input
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100 transition-colors"
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1" htmlFor="password">
              Password
            </label>
            <input
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100 transition-colors"
              id="password"
              type="password"
              name="password"
              placeholder="••••••"
              required
              minLength={6}
            />
          </div>
          
          <div className="pt-2">
            <button
                className="w-full flex items-center justify-center gap-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all disabled:opacity-70"
                aria-disabled={isPending}
            >
                {isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
          
          {errorMessage && (
            <div className="text-red-500 text-xs text-center animate-in fade-in slide-in-from-top-1">
              {errorMessage}
            </div>
          )}
        </form>
        
        <div className="mt-6 text-center text-xs text-neutral-400">
            Don't have an account?{' '}
            <Link href="/register" className="text-neutral-900 dark:text-neutral-200 font-medium hover:underline">
                Sign up
            </Link>
        </div>
      </div>
    </main>
  );
}
