'use client';

import { useEffect, useState, useActionState } from 'react';
import { Pencil, X, Check, LogOut, Mail, Calendar } from 'lucide-react';
import { fetchUser, updateUserName, logOut } from '@/lib/actions';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const [user, setUser] = useState<{ name: string | null; email: string; createdAt: Date } | null>(null);
  const [editing, setEditing] = useState(false);
  const [state, formAction, isPending] = useActionState(updateUserName, undefined);

  useEffect(() => {
    fetchUser().then(setUser);
  }, []);

  useEffect(() => {
    if (state === 'success') {
      setEditing(false);
      fetchUser().then(setUser);
    }
  }, [state]);

  if (!user) {
    return (
      <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans">
        <div className="max-w-md mx-auto min-h-screen flex items-center justify-center">
          <span className="text-neutral-400 dark:text-neutral-600 text-sm">Loading...</span>
        </div>
      </main>
    );
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans">
      <div className="max-w-md mx-auto min-h-screen flex flex-col bg-white dark:bg-neutral-950 shadow-2xl shadow-neutral-200/50 dark:shadow-none border-x border-neutral-100 dark:border-neutral-900">
        <header className="p-6 pt-12 pb-4 border-b border-neutral-100 dark:border-neutral-900">
          <h1 className="text-2xl font-light tracking-tight text-neutral-950 dark:text-neutral-50">Profile</h1>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Avatar / Initials */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
              <span className="text-2xl font-medium text-neutral-600 dark:text-neutral-300">
                {(user.name || user.email)[0].toUpperCase()}
              </span>
            </div>
          </div>

          {/* Name */}
          <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl">
            <label className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
              Name
            </label>
            {editing ? (
              <form action={formAction} className="flex items-center gap-2 mt-1">
                <input
                  name="name"
                  defaultValue={user.name || ''}
                  className="flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-600"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="text-green-600 dark:text-green-400 disabled:opacity-50"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="text-red-500 dark:text-red-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between mt-1">
                <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                  {user.name || 'No name set'}
                </span>
                <button
                  onClick={() => setEditing(true)}
                  className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}
            {state && state !== 'success' && (
              <p className="text-red-500 text-xs mt-1">{state}</p>
            )}
          </div>

          {/* Email */}
          <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl">
            <label className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
              Email
            </label>
            <div className="flex items-center gap-2 mt-1">
              <Mail className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
              <span className="text-neutral-800 dark:text-neutral-200">{user.email}</span>
            </div>
          </div>

          {/* Member Since */}
          <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl">
            <label className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
              Member Since
            </label>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
              <span className="text-neutral-800 dark:text-neutral-200">{memberSince}</span>
            </div>
          </div>

          {/* Logout */}
          <form action={logOut}>
            <button
              type="submit"
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors",
                "bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800",
                "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
              )}
            >
              <LogOut className="w-5 h-5" />
              Log Out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
