'use client';

import { useState } from 'react';
import { Trash2, ArrowUp, ArrowDown, Plus, Pencil, X, Check } from 'lucide-react';
import { useHabitStore, Habit } from '@/store/useHabitStore';
import { ClientOnly } from '@/components/ClientOnly';
import { cn } from '@/lib/utils';

export default function ManagePage() {
  const { habits, addHabit, removeHabit, renameHabit, reorderHabits } = useHabitStore();
  const [newHabitName, setNewHabitName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHabitName.trim()) {
      addHabit(newHabitName.trim());
      setNewHabitName('');
    }
  };

  const startEditing = (habit: Habit) => {
    setEditingId(habit.id);
    setEditName(habit.name);
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      renameHabit(editingId, editName.trim());
      setEditingId(null);
      setEditName('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const moveHabit = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      reorderHabits(index, index - 1);
    } else if (direction === 'down' && index < habits.length - 1) {
      reorderHabits(index, index + 1);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      <div className="max-w-md mx-auto min-h-screen flex flex-col bg-white shadow-2xl shadow-neutral-200/50">
        
        <header className="p-6 pt-12 pb-4 border-b border-neutral-100">
          <h1 className="text-2xl font-light tracking-tight text-neutral-950">Manage Habits</h1>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          
          {/* Add New */}
          <form onSubmit={handleAdd} className="flex gap-2 mb-8">
            <input
              type="text"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="Add new habit..."
              className="flex-1 bg-neutral-100 rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-neutral-200 transition-all"
            />
            <button
              type="submit"
              disabled={!newHabitName.trim()}
              className="p-2 bg-neutral-900 text-white rounded-lg disabled:opacity-50 hover:bg-neutral-800 transition-colors"
            >
              <Plus className="w-6 h-6" />
            </button>
          </form>

          {/* List */}
          <ClientOnly>
            <div className="space-y-3">
              {habits.map((habit, index) => (
                <div key={habit.id} className="flex items-center gap-3 p-3 bg-white border border-neutral-100 rounded-xl shadow-sm">
                  
                  {/* Reorder Controls */}
                  <div className="flex flex-col gap-1 text-neutral-300">
                    <button 
                      onClick={() => moveHabit(index, 'up')}
                      disabled={index === 0}
                      className="hover:text-neutral-600 disabled:opacity-20"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => moveHabit(index, 'down')}
                      disabled={index === habits.length - 1}
                      className="hover:text-neutral-600 disabled:opacity-20"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {editingId === habit.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 bg-neutral-50 border border-neutral-200 rounded px-2 py-1 text-sm outline-none"
                          autoFocus
                        />
                        <button onClick={saveEdit} className="text-green-600"><Check className="w-4 h-4" /></button>
                        <button onClick={cancelEdit} className="text-red-500"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <span className="block truncate text-neutral-700 font-medium">{habit.name}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {editingId !== habit.id && (
                      <>
                        <button 
                          onClick={() => startEditing(habit)}
                          className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm('Are you sure you want to delete this habit?')) {
                              removeHabit(habit.id);
                            }
                          }}
                          className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                </div>
              ))}
              
              {habits.length === 0 && (
                <div className="text-center text-neutral-400 text-sm py-8">
                  No habits found. Add one above.
                </div>
              )}
            </div>
          </ClientOnly>

        </div>
      </div>
    </main>
  );
}
