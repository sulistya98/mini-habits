'use server';

import { signIn } from '../../auth';
import { AuthError } from 'next-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { auth } from '../../auth';
import { revalidatePath } from 'next/cache';

// --- Auth Actions ---

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
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
    if (existingUser) return 'User already exists.';

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
      },
    });
  } catch (error) {
    return 'Failed to create user.';
  }
  
  // Auto login after register
  try {
      await signIn('credentials', { email, password });
  } catch (error) {
      if (error instanceof AuthError) throw error;
      // redirect happens here
  }
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
        orderBy: { createdAt: 'desc' }
    });

    // Transform to store format
    return habits.map((h: any) => ({
        id: h.id,
        name: h.name,
        completedDates: h.logs.reduce((acc: any, log: any) => ({ ...acc, [log.date]: true }), {} as Record<string, boolean>),
        notes: h.logs.reduce((acc: any, log: any) => log.note ? ({ ...acc, [log.date]: log.note }) : acc, {} as Record<string, string>)
    }));
}

export async function createHabit(name: string) {
    const userId = await getUserId();
    if (!userId) throw new Error('Unauthorized');

    await prisma.habit.create({
        data: { name, userId }
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

    await prisma.habit.updateMany({
        where: { id, userId },
        data: { name }
    });
    revalidatePath('/');
}

export async function toggleHabitLog(habitId: string, date: string) {
    const userId = await getUserId();
    if (!userId) throw new Error('Unauthorized');
    
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
