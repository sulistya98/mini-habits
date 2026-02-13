'use client';

import { useEffect, useState, useActionState } from 'react';
import { Pencil, X, Check, LogOut, Mail, Calendar, Phone, Globe, ShieldCheck, ShieldAlert } from 'lucide-react';
import { fetchUser, updateUserName, updateUserPhone, updateUserTimezone, sendPhoneOtp, verifyPhoneOtp, logOut } from '@/lib/actions';
import { ALLOWED_TIMEZONES } from '@/lib/timezones';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const [user, setUser] = useState<{ name: string | null; email: string; phone: string | null; phoneVerified: boolean; timezone: string | null; createdAt: Date } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingTimezone, setEditingTimezone] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(updateUserName, undefined);
  const [phoneState, phoneAction, phonePending] = useActionState(updateUserPhone, undefined);
  const [otpState, otpAction, otpPending] = useActionState(verifyPhoneOtp, undefined);
  const [tzState, tzAction, tzPending] = useActionState(updateUserTimezone, undefined);

  useEffect(() => {
    fetchUser().then(setUser);
  }, []);

  useEffect(() => {
    if (state === 'success') {
      setEditing(false);
      fetchUser().then(setUser);
    }
  }, [state]);

  useEffect(() => {
    if (phoneState === 'success') {
      setEditingPhone(false);
      setVerifying(false);
      setOtpMessage(null);
      fetchUser().then(setUser);
    }
  }, [phoneState]);

  useEffect(() => {
    if (otpState === 'verified') {
      setVerifying(false);
      setOtpMessage(null);
      fetchUser().then(setUser);
    }
  }, [otpState]);

  useEffect(() => {
    if (tzState === 'success') {
      setEditingTimezone(false);
      fetchUser().then(setUser);
    }
  }, [tzState]);

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

          {/* Phone */}
          <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl">
            <label className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
              WhatsApp Number
            </label>
            {editingPhone ? (
              <form action={phoneAction} className="flex items-center gap-2 mt-1">
                <input
                  name="phone"
                  defaultValue={user.phone || ''}
                  placeholder="6289685028129"
                  className="flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-600"
                  autoFocus
                />
                <button type="submit" disabled={phonePending} className="text-green-600 dark:text-green-400 disabled:opacity-50">
                  <Check className="w-5 h-5" />
                </button>
                <button type="button" onClick={() => setEditingPhone(false)} className="text-red-500 dark:text-red-400">
                  <X className="w-5 h-5" />
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                  <span className="text-neutral-800 dark:text-neutral-200">
                    {user.phone || 'Not set'}
                  </span>
                  {user.phone && (
                    user.phoneVerified ? (
                      <ShieldCheck className="w-4 h-4 text-green-500" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-amber-500" />
                    )
                  )}
                </div>
                <button
                  onClick={() => setEditingPhone(true)}
                  className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}
            {phoneState && phoneState !== 'success' && (
              <p className="text-red-500 text-xs mt-1">{phoneState}</p>
            )}

            {/* Verification flow */}
            {user.phone && !user.phoneVerified && !editingPhone && (
              <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                {!verifying ? (
                  <button
                    onClick={async () => {
                      setOtpSending(true);
                      setOtpMessage(null);
                      const result = await sendPhoneOtp();
                      setOtpSending(false);
                      if (result === 'sent') {
                        setVerifying(true);
                      } else {
                        setOtpMessage(result);
                      }
                    }}
                    disabled={otpSending}
                    className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-50"
                  >
                    {otpSending ? 'Sending code...' : 'Verify this number'}
                  </button>
                ) : (
                  <form action={otpAction} className="flex items-center gap-2">
                    <input
                      name="otp"
                      placeholder="6-digit code"
                      maxLength={6}
                      className="w-28 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-600 text-center tracking-widest"
                      autoFocus
                    />
                    <button type="submit" disabled={otpPending} className="text-green-600 dark:text-green-400 text-xs font-medium disabled:opacity-50">
                      Verify
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setOtpSending(true);
                        const result = await sendPhoneOtp();
                        setOtpSending(false);
                        setOtpMessage(result === 'sent' ? 'New code sent!' : result);
                      }}
                      disabled={otpSending}
                      className="text-neutral-400 dark:text-neutral-500 text-xs hover:underline disabled:opacity-50"
                    >
                      Resend
                    </button>
                  </form>
                )}
                {otpState && otpState !== 'verified' && (
                  <p className="text-red-500 text-xs mt-1">{otpState}</p>
                )}
                {otpMessage && (
                  <p className={cn("text-xs mt-1", otpMessage === 'New code sent!' ? 'text-green-500' : 'text-red-500')}>{otpMessage}</p>
                )}
              </div>
            )}
          </div>

          {/* Timezone */}
          <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl">
            <label className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
              Timezone
            </label>
            {editingTimezone ? (
              <form action={tzAction} className="flex items-center gap-2 mt-1">
                <select
                  name="timezone"
                  defaultValue={user.timezone || 'Asia/Jakarta'}
                  className="flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-600"
                >
                  {ALLOWED_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
                <button type="submit" disabled={tzPending} className="text-green-600 dark:text-green-400 disabled:opacity-50">
                  <Check className="w-5 h-5" />
                </button>
                <button type="button" onClick={() => setEditingTimezone(false)} className="text-red-500 dark:text-red-400">
                  <X className="w-5 h-5" />
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                  <span className="text-neutral-800 dark:text-neutral-200">
                    {user.timezone || 'Asia/Jakarta'}
                  </span>
                </div>
                <button
                  onClick={() => setEditingTimezone(true)}
                  className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}
            {tzState && tzState !== 'success' && (
              <p className="text-red-500 text-xs mt-1">{tzState}</p>
            )}
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
