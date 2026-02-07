'use client';

import { format } from 'date-fns';
import { Check } from 'lucide-react';
import { useHabitStore } from '@/store/useHabitStore';
import { cn } from '@/lib/utils';
import { ClientOnly } from '@/components/ClientOnly';

export default function Home() {
  const { habits, toggleHabit, addNote } = useHabitStore();
  const today = format(new Date(), 'yyyy-MM-dd');
  const displayDate = format(new Date(), 'EEEE, MMMM do');

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-neutral-200">
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative bg-white shadow-2xl shadow-neutral-200/50">
        
        {/* Header */}
        <header className="p-6 pt-12 pb-4">
          <h1 className="text-3xl font-light tracking-tight text-neutral-950">{displayDate}</h1>
          <p className="text-neutral-400 text-sm mt-1 font-medium tracking-wide uppercase">Daily Goals</p>
        </header>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-1">
          <ClientOnly>
            {habits.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-neutral-400 space-y-4 opacity-50">
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
                            isCompleted ? "text-neutral-300 line-through decoration-neutral-300 decoration-1" : "text-neutral-800"
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
                                    className="w-full bg-transparent text-xs text-neutral-500 placeholder:text-neutral-200 focus:outline-none focus:placeholder:text-neutral-300 transition-colors"
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
                        "w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center transition-all duration-200 shrink-0 mt-0.5",
                        isCompleted ? "bg-neutral-900 border-neutral-900 text-white" : "bg-transparent hover:border-neutral-400"
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