import { create } from 'zustand';
import { fetchHabits, createHabit, deleteHabit, updateHabitName, toggleHabitLog, updateHabitNote, reorderHabits as reorderHabitsAction, updateHabitReminderTime, fetchConversations, fetchConversation, createConversation, saveConversationMessages, deleteConversation } from '@/lib/actions';

export interface Habit {
  id: string;
  name: string;
  reminderTime?: string | null;
  completedDates: Record<string, boolean>; // 'YYYY-MM-DD': true
  notes?: Record<string, string>; // 'YYYY-MM-DD': "Note text"
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  habits?: { name: string; why: string }[] | null;
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: Date;
}

interface HabitStore {
  habits: Habit[];
  apiKey: string | null;
  modelName: string | null;
  isLoading: boolean;

  // Chat state
  activeConversationId: string | null;
  chatMessages: ChatMessage[];
  conversations: ConversationSummary[];

  // Actions
  syncHabits: () => Promise<void>;
  setApiKey: (key: string) => void;
  setModelName: (name: string) => void;
  addHabit: (name: string) => Promise<void>;
  removeHabit: (id: string) => Promise<void>;
  renameHabit: (id: string, newName: string) => Promise<void>;
  toggleHabit: (id: string, date: string) => Promise<void>;
  addNote: (id: string, date: string, note: string) => Promise<void>;
  reorderHabits: (fromIndex: number, toIndex: number) => void;
  setReminderTime: (id: string, time: string | null) => Promise<void>;

  // Chat actions
  setActiveConversation: (id: string | null, messages?: ChatMessage[]) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setChatMessages: (msgs: ChatMessage[]) => void;
  clearChat: () => void;
  syncConversations: () => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  startNewConversation: () => Promise<string>;
  removeConversation: (id: string) => Promise<void>;
  persistMessages: () => Promise<void>;
}

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],
  apiKey: typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : null,
  modelName: typeof window !== 'undefined' ? localStorage.getItem('gemini_model_name') : null,
  isLoading: true,

  // Chat state
  activeConversationId: null,
  chatMessages: [],
  conversations: [],

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

  // Chat actions

  setActiveConversation: (id, messages) => {
    set({
      activeConversationId: id,
      chatMessages: messages || [],
    });
  },

  addChatMessage: (msg) => {
    set((state) => ({
      chatMessages: [...state.chatMessages, msg],
    }));
  },

  setChatMessages: (msgs) => {
    set({ chatMessages: msgs });
  },

  clearChat: () => {
    set({ activeConversationId: null, chatMessages: [] });
  },

  syncConversations: async () => {
    try {
      const convos = await fetchConversations();
      set({ conversations: convos });
    } catch (e) {
      console.error("Failed to sync conversations", e);
    }
  },

  loadConversation: async (id) => {
    try {
      const convo = await fetchConversation(id);
      set({
        activeConversationId: id,
        chatMessages: (convo.messages as unknown as ChatMessage[]) || [],
      });
    } catch (e) {
      console.error("Failed to load conversation", e);
    }
  },

  startNewConversation: async () => {
    const convo = await createConversation('New Conversation');
    set({
      activeConversationId: convo.id,
      chatMessages: [],
    });
    await get().syncConversations();
    return convo.id;
  },

  removeConversation: async (id) => {
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      ...(state.activeConversationId === id
        ? { activeConversationId: null, chatMessages: [] }
        : {}),
    }));
    await deleteConversation(id);
  },

  persistMessages: async () => {
    const { activeConversationId, chatMessages } = get();
    if (!activeConversationId) return;
    try {
      await saveConversationMessages(activeConversationId, chatMessages);
      await get().syncConversations();
    } catch (e) {
      console.error("Failed to persist messages", e);
    }
  },
}));
