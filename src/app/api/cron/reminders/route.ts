import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/gowa';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { phone: { not: null } },
    include: {
      habits: {
        where: { reminderTime: { not: null } },
        include: { reminderLogs: true },
      },
    },
  });

  let sent = 0;
  const errors: string[] = [];

  for (const user of users) {
    const tz = user.timezone || 'Asia/Jakarta';
    const now = new Date();
    const userTime = now.toLocaleTimeString('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const userDate = now.toLocaleDateString('en-CA', { timeZone: tz }); // YYYY-MM-DD

    for (const habit of user.habits) {
      if (habit.reminderTime !== userTime) continue;

      const alreadySent = habit.reminderLogs.some(
        (log) => log.date === userDate
      );
      if (alreadySent) continue;

      try {
        const name = user.name || 'there';
        await sendWhatsAppMessage(
          user.phone!,
          `⏰ Hey ${name}! Time to: ${habit.name}`
        );

        await prisma.reminderLog.create({
          data: {
            habitId: habit.id,
            date: userDate,
          },
        });

        sent++;
      } catch (err: any) {
        errors.push(`habit ${habit.id}: ${err.message}`);
      }
    }
  }

  return NextResponse.json({ sent, errors });
}
