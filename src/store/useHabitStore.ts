import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface Habit {
  id: string;
  name: string;
  completedDates: Record<string, boolean>; // 'YYYY-MM-DD': true
  notes: Record<string, string>; // 'YYYY-MM-DD': "Felt great"
  createdAt: string;
}

interface HabitState {
  habits: Habit[];
  apiKey: string | null;
  modelName: string;
  addHabit: (name: string) => void;
  removeHabit: (id: string) => void;
  toggleHabit: (id: string, date: string) => void;
  addNote: (id: string, date: string, note: string) => void;
  renameHabit: (id: string, newName: string) => void;
  reorderHabits: (fromIndex: number, toIndex: number) => void;
  setApiKey: (key: string) => void;
  setModelName: (name: string) => void;
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set) => ({
      habits: [],
      apiKey: null,
      modelName: 'gemini-1.5-flash',
      addHabit: (name) =>
        set((state) => ({
          habits: [
            ...state.habits,
            {
              id: uuidv4(),
              name,
              completedDates: {},
              notes: {},
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      removeHabit: (id) =>
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
        })),
      toggleHabit: (id, date) =>
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id === id) {
              const newCompleted = { ...h.completedDates };
              if (newCompleted[date]) {
                delete newCompleted[date];
              } else {
                newCompleted[date] = true;
              }
              return { ...h, completedDates: newCompleted };
            }
            return h;
          }),
        })),
      addNote: (id, date, note) =>
        set((state) => ({
          habits: state.habits.map((h) => {
             if (h.id === id) {
                 const newNotes = { ...h.notes };
                 if (note.trim() === '') {
                     delete newNotes[date];
                 } else {
                     newNotes[date] = note;
                 }
                 return { ...h, notes: newNotes };
             }
             return h;
          }),
        })),
      renameHabit: (id, newName) =>
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, name: newName } : h
          ),
        })),
      reorderHabits: (fromIndex, toIndex) =>
        set((state) => {
          const newHabits = [...state.habits];
          const [movedHabit] = newHabits.splice(fromIndex, 1);
          newHabits.splice(toIndex, 0, movedHabit);
          return { habits: newHabits };
        }),
      setApiKey: (key) => set({ apiKey: key }),
      setModelName: (name) => set({ modelName: name }),
    }),
    {
      name: 'mini-habits-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
