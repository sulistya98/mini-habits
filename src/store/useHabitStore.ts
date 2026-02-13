import { create } from 'zustand';
import { fetchHabits, createHabit, deleteHabit, updateHabitName, toggleHabitLog, updateHabitNote, reorderHabits as reorderHabitsAction, updateHabitReminderTime } from '@/lib/actions';

export interface Habit {
  id: string;
  name: string;
  reminderTime?: string | null;
  completedDates: Record<string, boolean>; // 'YYYY-MM-DD': true
  notes?: Record<string, string>; // 'YYYY-MM-DD': "Note text"
}

interface HabitStore {
  habits: Habit[];
  apiKey: string | null;
  modelName: string | null;
  isLoading: boolean;
  
  // Actions
  syncHabits: () => Promise<void>;
  setApiKey: (key: string) => void;
  setModelName: (name: string) => void;
  addHabit: (name: string) => Promise<void>;
  removeHabit: (id: string) => Promise<void>;
  renameHabit: (id: string, newName: string) => Promise<void>;
  toggleHabit: (id: string, date: string) => Promise<void>;
  addNote: (id: string, date: string, note: string) => Promise<void>;
  reorderHabits: (fromIndex: number, toIndex: number) => void; // Keeping local for now
  setReminderTime: (id: string, time: string | null) => Promise<void>;
}

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],
  apiKey: typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : null,
  modelName: typeof window !== 'undefined' ? localStorage.getItem('gemini_model_name') : null,
  isLoading: true,

  syncHabits: async () => {
      set({ isLoading: true });
      try {
          const habits = await fetchHabits();
          set({ habits, isLoading: false });
      } catch (e) {
          console.error("Failed to sync habits", e);
          set({ isLoading: false });
      }
  },

  setApiKey: (key) => {
    localStorage.setItem('gemini_api_key', key);
    set({ apiKey: key });
  },

  setModelName: (name) => {
    localStorage.setItem('gemini_model_name', name);
    set({ modelName: name });
  },

  addHabit: async (name) => {
    // Optimistic update could be tricky without ID, but let's wait for server for simplicity or generate temp ID
    // Choosing wait-for-server for simplicity of IDs
    await createHabit(name);
    await get().syncHabits(); 
  },

  removeHabit: async (id) => {
    set((state) => ({ habits: state.habits.filter((h) => h.id !== id) })); // Optimistic
    await deleteHabit(id);
    await get().syncHabits(); // Re-sync to ensure consistency
  },

  renameHabit: async (id, newName) => {
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? { ...h, name: newName } : h)),
    }));
    await updateHabitName(id, newName);
  },

  toggleHabit: async (id, date) => {
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
    }));
    await toggleHabitLog(id, date);
  },

  addNote: async (id, date, note) => {
    set((state) => ({
      habits: state.habits.map((h) => {
        if (h.id === id) {
           const newNotes = { ...(h.notes || {}) };
           if (note) newNotes[date] = note;
           else delete newNotes[date];
           return { ...h, notes: newNotes };
        }
        return h;
      }),
    }));
    await updateHabitNote(id, date, note);
  },

  reorderHabits: (fromIndex, toIndex) => {
    set((state) => {
      const newHabits = [...state.habits];
      const [moved] = newHabits.splice(fromIndex, 1);
      newHabits.splice(toIndex, 0, moved);
      return { habits: newHabits };
    });
    const orderedIds = get().habits.map((h) => h.id);
    reorderHabitsAction(orderedIds);
  },

  setReminderTime: async (id, time) => {
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id ? { ...h, reminderTime: time } : h
      ),
    }));
    await updateHabitReminderTime(id, time);
  },
}));