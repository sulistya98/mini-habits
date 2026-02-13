'use server';

import { signIn, signOut } from '../../auth';
import { AuthError } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/gowa';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { auth } from '../../auth';
import { revalidatePath } from 'next/cache';

function isRedirectError(error: any) {
  return error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT');
}

// --- Auth Actions ---

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export async function registerUser(prevState: string | undefined, formData: FormData) {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
  });
  
  const data = Object.fromEntries(formData);
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    return 'Invalid data. Password must be at least 6 characters.';
  }

  const { email, password, name } = parsed.data;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return 'User already exists.';
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
      },
    });
    
    // Auto login
    await signIn('credentials', { email, password });
    
  } catch (error) {
    if (isRedirectError(error)) {
        throw error;
    }
    
    console.error("Registration error:", (error as Error)?.message);
    
    if (error instanceof AuthError) {
        return "Authentication failed during auto-login.";
    }
    
    return 'Failed to create user. Check server logs.';
  }
}

// --- Profile Actions ---

export async function fetchUser() {
  const session = await auth();
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { name: true, email: true, phone: true, phoneVerified: true, timezone: true, createdAt: true },
  });
  return user;
}

export async function updateUserName(prevState: string | undefined, formData: FormData) {
  const schema = z.object({
    name: z.string().min(1, 'Name is required').max(50, 'Name is too long'),
  });

  const parsed = schema.safeParse({ name: formData.get('name') });
  if (!parsed.success) {
    return parsed.error.issues[0].message;
  }

  const session = await auth();
  if (!session?.user?.email) return 'Unauthorized';

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { name: parsed.data.name },
    });
    revalidatePath('/profile');
    return 'success';
  } catch {
    return 'Failed to update name.';
  }
}

export async function updateUserPhone(prevState: string | undefined, formData: FormData) {
  const raw = (formData.get('phone') as string || '').trim();

  if (raw && !/^\d{10,15}$/.test(raw)) {
    return 'Phone must be 10-15 digits (e.g., 6289685028129).';
  }

  const session = await auth();
  if (!session?.user?.email) return 'Unauthorized';

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { phone: raw || null, phoneVerified: false, phoneOtp: null, phoneOtpExpiry: null },
    });
    revalidatePath('/profile');
    return 'success';
  } catch {
    return 'Failed to update phone.';
  }
}

export async function sendPhoneOtp() {
  const session = await auth();
  if (!session?.user?.email) return 'Unauthorized';

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { phone: true, phoneVerified: true },
  });

  if (!user?.phone) return 'No phone number set.';
  if (user.phoneVerified) return 'Phone already verified.';

  const otp = crypto.randomInt(100000, 999999).toString();
  const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await prisma.user.update({
    where: { email: session.user.email },
    data: { phoneOtp: otp, phoneOtpExpiry: expiry },
  });

  try {
    await sendWhatsAppMessage(user.phone, `Your Mini Habits verification code is: ${otp}`);
    return 'sent';
  } catch {
    return 'Failed to send OTP. Check your WhatsApp number.';
  }
}

export async function verifyPhoneOtp(prevState: string | undefined, formData: FormData) {
  const code = (formData.get('otp') as string || '').trim();

  if (!/^\d{6}$/.test(code)) {
    return 'Enter the 6-digit code.';
  }

  const session = await auth();
  if (!session?.user?.email) return 'Unauthorized';

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { phoneOtp: true, phoneOtpExpiry: true },
  });

  if (!user?.phoneOtp || !user.phoneOtpExpiry) {
    return 'No verification code pending. Send a new one.';
  }

  if (new Date() > user.phoneOtpExpiry) {
    return 'Code expired. Send a new one.';
  }

  if (user.phoneOtp !== code) {
    return 'Incorrect code.';
  }

  await prisma.user.update({
    where: { email: session.user.email },
    data: { phoneVerified: true, phoneOtp: null, phoneOtpExpiry: null },
  });

  revalidatePath('/profile');
  return 'verified';
}

import { ALLOWED_TIMEZONES } from '@/lib/timezones';

export async function updateUserTimezone(prevState: string | undefined, formData: FormData) {
  const tz = (formData.get('timezone') as string || '').trim();

  if (!ALLOWED_TIMEZONES.includes(tz)) {
    return 'Invalid timezone.';
  }

  const session = await auth();
  if (!session?.user?.email) return 'Unauthorized';

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { timezone: tz },
    });
    revalidatePath('/profile');
    return 'success';
  } catch {
    return 'Failed to update timezone.';
  }
}

export async function logOut() {
  await signOut({ redirectTo: '/login' });
}

// --- Data Actions ---

async function getUserId() {
    const session = await auth();
    if (!session?.user?.email) throw new Error('Unauthorized');
    // We need the ID, let's fetch it or store it in session. 
    // For now, fetch by email (cached by Prisma usually)
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    return user?.id;
}

export async function fetchHabits() {
    const userId = await getUserId();
    if (!userId) return [];

    const habits = await prisma.habit.findMany({
        where: { userId },
        include: { logs: true },
        orderBy: { order: 'asc' }
    });

    // Transform to store format
    return habits.map((h: any) => ({
        id: h.id,
        name: h.name,
        reminderTime: h.reminderTime,
        completedDates: h.logs.reduce((acc: any, log: any) => ({ ...acc, [log.date]: true }), {} as Record<string, boolean>),
        notes: h.logs.reduce((acc: any, log: any) => log.note ? ({ ...acc, [log.date]: log.note }) : acc, {} as Record<string, string>)
    }));
}

export async function createHabit(name: string) {
    const userId = await getUserId();
    if (!userId) throw new Error('Unauthorized');

    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 100) throw new Error('Habit name must be 1-100 characters.');

    const maxOrder = await prisma.habit.aggregate({
        where: { userId },
        _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    await prisma.habit.create({
        data: { name: trimmed, userId, order: nextOrder }
    });
    revalidatePath('/');
}

export async function deleteHabit(id: string) {
    const userId = await getUserId();
    if (!userId) throw new Error('Unauthorized');

    await prisma.habit.deleteMany({
        where: { id, userId } // Ensure ownership
    });
    revalidatePath('/');
}

export async function updateHabitName(id: string, name: string) {
    const userId = await getUserId();
    if (!userId) throw new Error('Unauthorized');

    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 100) throw new Error('Habit name must be 1-100 characters.');

    await prisma.habit.updateMany({
        where: { id, userId },
        data: { name: trimmed }
    });
    revalidatePath('/');
}

export async function toggleHabitLog(habitId: string, date: string) {
    const userId = await getUserId();
    if (!userId) throw new Error('Unauthorized');

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid date format.');

    // Check if habit belongs to user
    const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
    if (!habit) throw new Error('Habit not found');

    const existingLog = await prisma.habitLog.findUnique({
        where: { habitId_date: { habitId, date } }
    });

    if (existingLog) {
        await prisma.habitLog.delete({
            where: { habitId_date: { habitId, date } }
        });
    } else {
        await prisma.habitLog.create({
            data: { habitId, date }
        });
    }
    revalidatePath('/');
}

export async function updateHabitNote(habitId: string, date: string, note: string) {
    const userId = await getUserId();
    if (!userId) throw new Error('Unauthorized');

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid date format.');
    if (note.length > 500) throw new Error('Note is too long.');

    // Check if habit belongs to user
    const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
    if (!habit) throw new Error('Habit not found');

    await prisma.habitLog.upsert({
        where: { habitId_date: { habitId, date } },
        update: { note },
        create: { habitId, date, note }
    });
    revalidatePath('/');
}

export async function reorderHabits(orderedIds: string[]) {
    const userId = await getUserId();
    if (!userId) throw new Error('Unauthorized');

    if (!orderedIds.length || orderedIds.length > 100) throw new Error('Invalid habit list.');

    await prisma.$transaction(
        orderedIds.map((id, index) =>
            prisma.habit.updateMany({
                where: { id, userId },
                data: { order: index },
            })
        )
    );
    revalidatePath('/');
}

export async function updateHabitReminderTime(habitId: string, reminderTime: string | null) {
    const userId = await getUserId();
    if (!userId) throw new Error('Unauthorized');

    if (reminderTime && !/^\d{2}:\d{2}$/.test(reminderTime)) {
        throw new Error('Invalid time format. Use HH:mm.');
    }

    await prisma.habit.updateMany({
        where: { id: habitId, userId },
        data: { reminderTime },
    });
    revalidatePath('/manage');
}

// --- Conversation Actions ---

export async function createConversation(title: string) {
    const userId = await getUserId();
    if (!userId) throw new Error('Unauthorized');

    const trimmed = title.trim() || 'New Conversation';
    if (trimmed.length > 200) throw new Error('Title too long.');

    const conversation = await prisma.conversation.create({
        data: { title: trimmed, messages: [], userId },
        select: { id: true, title: true },
    });
    return conversation;
}

export async function fetchConversations() {
    const userId = await getUserId();
    if (!userId) return [];

    return prisma.conversation.findMany({
        where: { userId },
        select: { id: true, title: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 50,
    });
}

export async function fetchConversation(id: string) {
    const userId = await getUserId();
    if (!userId) throw new Error('Unauthorized');

    const conversation = await prisma.conversation.findFirst({
        where: { id, userId },
    });
    if (!conversation) throw new Error('Conversation not found');
    return conversation;
}

export async function saveConversationMessages(id: string, messages: unknown[]) {
    const userId = await getUserId();
    if (!userId) throw new Error('Unauthorized');

    if (messages.length > 200) throw new Error('Too many messages.');

    const conversation = await prisma.conversation.findFirst({
        where: { id, userId },
        select: { title: true },
    });
    if (!conversation) throw new Error('Conversation not found');

    const firstUserMsg = messages.find(
        (m) => typeof m === 'object' && m !== null && 'role' in m && (m as { role: string }).role === 'user'
    ) as { role: string; content: string } | undefined;
    const shouldUpdateTitle = conversation.title === 'New Conversation' && firstUserMsg?.content;
    const newTitle = shouldUpdateTitle
        ? firstUserMsg.content.slice(0, 100)
        : undefined;

    await prisma.conversation.update({
        where: { id },
        data: {
            messages: messages as Parameters<typeof prisma.conversation.update>[0]['data']['messages'],
            ...(newTitle ? { title: newTitle } : {}),
        },
    });
}

export async function deleteConversation(id: string) {
    const userId = await getUserId();
    if (!userId) throw new Error('Unauthorized');

    await prisma.conversation.deleteMany({
        where: { id, userId },
    });
}
