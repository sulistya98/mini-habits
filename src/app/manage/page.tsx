'use client';

import { useState, useEffect } from 'react';
import { Trash2, Plus, Pencil, X, Check, GripVertical } from 'lucide-react';
import { useHabitStore, Habit } from '@/store/useHabitStore';
import { ClientOnly } from '@/components/ClientOnly';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableHabitItem({
  habit,
  editingId,
  editName,
  setEditName,
  startEditing,
  saveEdit,
  cancelEdit,
  removeHabit,
}: {
  habit: Habit;
  editingId: string | null;
  editName: string;
  setEditName: (name: string) => void;
  startEditing: (habit: Habit) => void;
  saveEdit: () => void;
  cancelEdit: () => void;
  removeHabit: (id: string) => Promise<void>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl shadow-sm dark:shadow-none ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="touch-none text-neutral-300 dark:text-neutral-600 hover:text-neutral-500 dark:hover:text-neutral-400 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {editingId === habit.id ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded px-2 py-1 text-sm outline-none"
              autoFocus
            />
            <button onClick={saveEdit} className="text-green-600 dark:text-green-400"><Check className="w-4 h-4" /></button>
            <button onClick={cancelEdit} className="text-red-500 dark:text-red-400"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <span className="block truncate text-neutral-700 dark:text-neutral-200 font-medium">{habit.name}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {editingId !== habit.id && (
          <>
            <button
              onClick={() => startEditing(habit)}
              className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this habit?')) {
                  removeHabit(habit.id);
                }
              }}
              className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ManagePage() {
  const { habits, addHabit, removeHabit, renameHabit, reorderHabits, syncHabits } = useHabitStore();
  const [newHabitName, setNewHabitName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    syncHabits();
  }, [syncHabits]);

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = habits.findIndex((h) => h.id === active.id);
      const newIndex = habits.findIndex((h) => h.id === over.id);
      reorderHabits(oldIndex, newIndex);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans">
      <div className="max-w-md mx-auto min-h-screen flex flex-col bg-white dark:bg-neutral-950 shadow-2xl shadow-neutral-200/50 dark:shadow-none border-x border-neutral-100 dark:border-neutral-900">

        <header className="p-6 pt-12 pb-4 border-b border-neutral-100 dark:border-neutral-900">
          <h1 className="text-2xl font-light tracking-tight text-neutral-950 dark:text-neutral-50">Manage Habits</h1>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">

          {/* Add New */}
          <form onSubmit={handleAdd} className="flex gap-2 mb-8">
            <input
              type="text"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="Add new habit..."
              className="flex-1 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-neutral-200 dark:focus:ring-neutral-700 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-all"
            />
            <button
              type="submit"
              disabled={!newHabitName.trim()}
              className="p-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg disabled:opacity-50 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              <Plus className="w-6 h-6" />
            </button>
          </form>

          {/* List */}
          <ClientOnly>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={habits.map((h) => h.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {habits.map((habit) => (
                    <SortableHabitItem
                      key={habit.id}
                      habit={habit}
                      editingId={editingId}
                      editName={editName}
                      setEditName={setEditName}
                      startEditing={startEditing}
                      saveEdit={saveEdit}
                      cancelEdit={cancelEdit}
                      removeHabit={removeHabit}
                    />
                  ))}

                  {habits.length === 0 && (
                    <div className="text-center text-neutral-400 dark:text-neutral-600 text-sm py-8">
                      No habits found. Add one above.
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </ClientOnly>

        </div>
      </div>
    </main>
  );
}
