'use client';

import { useEffect, useState, useCallback } from 'react';
import { format, addDays, subDays, isToday, startOfDay } from 'date-fns';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useHabitStore } from '@/store/useHabitStore';
import { cn } from '@/lib/utils';
import { ClientOnly } from '@/components/ClientOnly';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useSwipe } from '@/hooks/useSwipe';

export default function Home() {
  const { habits, toggleHabit, addNote, syncHabits } = useHabitStore();
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [transitioning, setTransitioning] = useState(false);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const displayDate = format(selectedDate, 'EEEE, MMMM do');
  const isCurrentDay = isToday(selectedDate);

  const goToPrevDay = useCallback(() => {
    setTransitioning(true);
    setSelectedDate((d) => subDays(d, 1));
  }, []);

  const goToNextDay = useCallback(() => {
    setSelectedDate((d) => {
      const next = addDays(d, 1);
      if (next > startOfDay(new Date())) return d;
      setTransitioning(true);
      return next;
    });
  }, []);

  const goToToday = useCallback(() => {
    setTransitioning(true);
    setSelectedDate(startOfDay(new Date()));
  }, []);

  // Clear transition after animation
  useEffect(() => {
    if (!transitioning) return;
    const t = setTimeout(() => setTransitioning(false), 200);
    return () => clearTimeout(t);
  }, [transitioning, selectedDate]);

  const swipeRef = useSwipe<HTMLDivElement>({
    onSwipeLeft: goToNextDay,
    onSwipeRight: goToPrevDay,
  });

  useEffect(() => {
    syncHabits();
  }, [syncHabits]);

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans selection:bg-neutral-200 dark:selection:bg-neutral-800">
      <div
        ref={swipeRef}
        className="max-w-md mx-auto min-h-screen flex flex-col relative bg-white dark:bg-neutral-950 shadow-2xl shadow-neutral-200/50 dark:shadow-none border-x border-neutral-100 dark:border-neutral-900"
      >

        {/* Header */}
        <header className="p-6 pt-12 pb-4 flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevDay}
                className="p-1.5 -ml-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Previous day"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-neutral-950 dark:text-neutral-50 truncate">
                {displayDate}
              </h1>
              <button
                onClick={goToNextDay}
                disabled={isCurrentDay}
                className={cn(
                  "p-1.5 rounded-full transition-colors",
                  isCurrentDay
                    ? "text-neutral-200 dark:text-neutral-700 cursor-not-allowed"
                    : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                )}
                aria-label="Next day"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-neutral-400 dark:text-neutral-500 text-sm font-medium tracking-wide uppercase">
                {isCurrentDay ? 'Daily Goals' : 'Past Day'}
              </p>
              {!isCurrentDay && (
                <button
                  onClick={goToToday}
                  className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  Today
                </button>
              )}
            </div>
          </div>
          <ThemeToggle />
        </header>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-1">
          <ClientOnly>
            <div
              className={cn(
                "transition-opacity duration-200",
                transitioning ? "opacity-0" : "opacity-100"
              )}
            >
              {habits.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 space-y-4 opacity-50">
                  <p className="text-sm">No habits yet. Go to Manage to add one.</p>
                </div>
              ) : (
                habits.map((habit) => {
                  const isCompleted = !!habit.completedDates[dateStr];
                  const currentNote = habit.notes?.[dateStr] || '';

                  return (
                    <div
                      key={habit.id}
                      className="group flex items-start justify-between py-4"
                    >
                      <div className="flex-1 flex flex-col pr-4">
                          <span
                            className={cn(
                              "text-lg transition-all duration-300 font-normal truncate select-none cursor-pointer",
                              isCompleted ? "text-neutral-300 dark:text-neutral-600 line-through decoration-neutral-300 dark:decoration-neutral-600 decoration-1" : "text-neutral-800 dark:text-neutral-200"
                            )}
                            onClick={() => toggleHabit(habit.id, dateStr)}
                          >
                            {habit.name}
                          </span>

                          {/* Inline Note Input */}
                          {isCompleted && (
                              <div className="mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                  <input
                                      type="text"
                                      placeholder="Add context..."
                                      className="w-full bg-transparent text-xs text-neutral-500 dark:text-neutral-400 placeholder:text-neutral-200 dark:placeholder:text-neutral-700 focus:outline-none focus:placeholder:text-neutral-300 dark:focus:placeholder:text-neutral-500 transition-colors"
                                      defaultValue={currentNote}
                                      key={`${habit.id}-${dateStr}`}
                                      onClick={(e) => e.stopPropagation()}
                                      onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                              e.currentTarget.blur();
                                          }
                                      }}
                                      onBlur={(e) => addNote(habit.id, dateStr, e.target.value)}
                                  />
                              </div>
                          )}
                      </div>

                      <button
                        onClick={() => toggleHabit(habit.id, dateStr)}
                        className={cn(
                          "w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-700 flex items-center justify-center transition-all duration-200 shrink-0 mt-0.5",
                          isCompleted ? "bg-neutral-900 dark:bg-neutral-100 border-neutral-900 dark:border-neutral-100 text-white dark:text-neutral-900" : "bg-transparent hover:border-neutral-400 dark:hover:border-neutral-500"
                        )}
                      >
                        {isCompleted && <Check className="w-4 h-4" strokeWidth={3} />}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </ClientOnly>
        </div>

      </div>
    </main>
  );
}
