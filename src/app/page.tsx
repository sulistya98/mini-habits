'use client';

import { useEffect } from 'react';
import { format } from 'date-fns';
import { Check } from 'lucide-react';
import { useHabitStore } from '@/store/useHabitStore';
import { cn } from '@/lib/utils';
import { ClientOnly } from '@/components/ClientOnly';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  const { habits, toggleHabit, addNote, syncHabits } = useHabitStore();
  const today = format(new Date(), 'yyyy-MM-dd');
  const displayDate = format(new Date(), 'EEEE, MMMM do');

  useEffect(() => {
      syncHabits();
  }, [syncHabits]);

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans selection:bg-neutral-200 dark:selection:bg-neutral-800">
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative bg-white dark:bg-neutral-950 shadow-2xl shadow-neutral-200/50 dark:shadow-none border-x border-neutral-100 dark:border-neutral-900">
        
        {/* Header */}
        <header className="p-6 pt-12 pb-4 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-neutral-950 dark:text-neutral-50">{displayDate}</h1>
            <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1 font-medium tracking-wide uppercase">Daily Goals</p>
          </div>
          <ThemeToggle />
        </header>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-1">
          <ClientOnly>
            {habits.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 space-y-4 opacity-50">
                <p className="text-sm">No habits yet. Go to Manage to add one.</p>
              </div>
            ) : (
              habits.map((habit) => {
                const isCompleted = !!habit.completedDates[today];
                const currentNote = habit.notes?.[today] || '';

                return (
                  <div
                    key={habit.id}
                    className="group flex items-start justify-between py-4 group"
                  >
                    <div className="flex-1 flex flex-col pr-4">
                        <span 
                          className={cn(
                            "text-lg transition-all duration-300 font-normal truncate select-none cursor-pointer",
                            isCompleted ? "text-neutral-300 dark:text-neutral-600 line-through decoration-neutral-300 dark:decoration-neutral-600 decoration-1" : "text-neutral-800 dark:text-neutral-200"
                          )}
                          onClick={() => toggleHabit(habit.id, today)}
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
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.currentTarget.blur();
                                        }
                                    }}
                                    onBlur={(e) => addNote(habit.id, today, e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                    
                    <button
                      onClick={() => toggleHabit(habit.id, today)}
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
          </ClientOnly>
        </div>

      </div>
    </main>
  );
}