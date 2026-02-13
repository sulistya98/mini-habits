'use client';

import { useState, useEffect, useRef } from 'react';
import { useHabitStore, ChatMessage } from '@/store/useHabitStore';
import { ClientOnly } from '@/components/ClientOnly';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Loader2,
  X,
  Check,
  ArrowLeft,
  Plus,
  Key,
  Send,
  Trash2,
  MessageSquare,
} from 'lucide-react';

function timeAgo(date: Date) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function GeneratePage() {
  const {
    habits,
    addHabit,
    syncHabits,
    apiKey,
    setApiKey,
    modelName,
    setModelName,
    activeConversationId,
    chatMessages,
    conversations,
    addChatMessage,
    clearChat,
    syncConversations,
    loadConversation,
    startNewConversation,
    removeConversation,
    persistMessages,
  } = useHabitStore();

  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [tempModel, setTempModel] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    syncHabits();
    syncConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Send greeting when starting a new conversation with empty messages
  useEffect(() => {
    if (activeConversationId && chatMessages.length === 0 && !isSending) {
      const greeting: ChatMessage = {
        role: 'assistant',
        content: "Hi! I'm your mini habits coach. What goal would you like to build tiny, failproof daily habits for?",
      };
      addChatMessage(greeting);
      setTimeout(() => persistMessages(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    if (!apiKey) {
      setTempKey('');
      setTempModel(modelName || 'gemini-2.0-flash');
      setShowSettings(true);
      return;
    }

    setInput('');
    setError(null);

    const userMsg: ChatMessage = { role: 'user', content: text };
    addChatMessage(userMsg);

    setIsSending(true);

    try {
      const allMessages = [...chatMessages, userMsg];
      // Only send role + content to API (strip habits)
      const apiMessages = allMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/generate-habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          modelName,
          messages: apiMessages,
          existingHabits: habits.map((h) => h.name),
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.message,
        habits: data.habits || null,
      };
      addChatMessage(assistantMsg);

      // Persist after AI response
      setTimeout(() => persistMessages(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleAddHabit = async (name: string) => {
    try {
      await addHabit(name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add habit');
    }
  };

  const isHabitAdded = (name: string) => {
    const lower = name.trim().toLowerCase();
    return habits.some((h) => h.name.trim().toLowerCase() === lower);
  };

  const handleNewConversation = async () => {
    if (!apiKey) {
      setTempKey('');
      setTempModel(modelName || 'gemini-2.0-flash');
      setShowSettings(true);
      return;
    }
    await startNewConversation();
  };

  const handleBack = () => {
    clearChat();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(null);
    await removeConversation(id);
  };

  const saveKey = () => {
    if (tempKey.trim()) setApiKey(tempKey.trim());
    if (tempModel.trim()) setModelName(tempModel.trim());
    setShowSettings(false);
  };

  // --- Chat View ---
  if (activeConversationId) {
    const currentConvo = conversations.find((c) => c.id === activeConversationId);
    const title = currentConvo?.title || 'Chat';
    const displayTitle = title === 'New Conversation' ? 'New Chat' : title;

    return (
      <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans">
        <div className="max-w-md mx-auto min-h-screen flex flex-col bg-white dark:bg-neutral-950 shadow-2xl shadow-neutral-200/50 dark:shadow-none border-x border-neutral-100 dark:border-neutral-900 relative">
          {/* Header */}
          <header className="p-4 pt-12 pb-3 border-b border-neutral-100 dark:border-neutral-900 flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-1.5 -ml-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="flex-1 text-sm font-medium truncate">{displayTitle}</h1>
            <button
              onClick={() => {
                setTempKey(apiKey || '');
                setTempModel(modelName || 'gemini-2.0-flash');
                setShowSettings(true);
              }}
              className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-400 dark:text-neutral-500"
            >
              <Key className="w-4 h-4" />
            </button>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-36">
            {chatMessages.map((msg, i) => (
              <div key={i}>
                {/* Message bubble */}
                <div
                  className={cn(
                    'max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
                    msg.role === 'user'
                      ? 'ml-auto bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-br-md'
                      : 'mr-auto bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-bl-md'
                  )}
                >
                  {msg.content}
                </div>

                {/* Habit proposal cards */}
                {msg.habits && msg.habits.length > 0 && (
                  <div className="mt-2 mr-auto max-w-[85%] space-y-2">
                    {msg.habits.map((habit, j) => {
                      const added = isHabitAdded(habit.name);
                      return (
                        <div
                          key={j}
                          className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 bg-white dark:bg-neutral-900"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                {habit.name}
                              </p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                {habit.why}
                              </p>
                            </div>
                            <button
                              onClick={() => !added && handleAddHabit(habit.name)}
                              disabled={added}
                              className={cn(
                                'flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                                added
                                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-default'
                                  : 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200'
                              )}
                            >
                              {added ? (
                                <span className="flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Added
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Plus className="w-3 h-3" /> Add
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {isSending && (
              <div className="mr-auto max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-md bg-neutral-100 dark:bg-neutral-800">
                <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
              </div>
            )}

            {error && (
              <div className="mr-auto max-w-[85%] px-4 py-2.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                  <button onClick={() => setError(null)}>
                    <X size={12} className="text-red-400" />
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="absolute bottom-16 left-0 right-0 border-t border-neutral-100 dark:border-neutral-900 bg-white dark:bg-neutral-950 p-3">
            <div className="max-w-md mx-auto flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 text-sm bg-neutral-100 dark:bg-neutral-800 rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                disabled={isSending}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isSending}
                className="p-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Settings Modal */}
          {showSettings && <SettingsModal {...{ tempKey, setTempKey, tempModel, setTempModel, saveKey, setShowSettings }} />}
        </div>
      </main>
    );
  }

  // --- List View ---
  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans">
      <div className="max-w-md mx-auto min-h-screen flex flex-col bg-white dark:bg-neutral-950 shadow-2xl shadow-neutral-200/50 dark:shadow-none border-x border-neutral-100 dark:border-neutral-900 relative">
        <header className="p-6 pt-12 pb-4 border-b border-neutral-100 dark:border-neutral-900 flex items-center justify-between">
          <h1 className="text-2xl font-light tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Generate
          </h1>
          <button
            onClick={() => {
              setTempKey(apiKey || '');
              setTempModel(modelName || 'gemini-2.0-flash');
              setShowSettings(true);
            }}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
            title="API Key Settings"
          >
            <Key className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 pb-24">
          <ClientOnly>
            {/* New Conversation button */}
            <button
              onClick={handleNewConversation}
              className="w-full py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Conversation
            </button>

            {/* Conversation list */}
            {conversations.length > 0 ? (
              <div className="space-y-2 mt-2">
                {conversations.map((convo) => (
                  <div
                    key={convo.id}
                    className="group flex items-center border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                  >
                    <button
                      onClick={() => loadConversation(convo.id)}
                      className="flex-1 p-4 text-left min-w-0"
                    >
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {convo.title === 'New Conversation' ? 'New Chat' : convo.title}
                      </p>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                        {timeAgo(convo.updatedAt)}
                      </p>
                    </button>

                    {deletingId === convo.id ? (
                      <div className="flex items-center gap-1 pr-3">
                        <button
                          onClick={() => handleDelete(convo.id)}
                          className="p-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(convo.id)}
                        className="p-2 mr-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 dark:text-neutral-500 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-700 mb-3" />
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  No conversations yet
                </p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                  Start a conversation to get personalized mini habits
                </p>
              </div>
            )}

            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 text-center pt-2">
              Powered by Google Gemini. Your API key is stored locally.
            </p>
          </ClientOnly>
        </div>

        {/* Settings Modal */}
        {showSettings && <SettingsModal {...{ tempKey, setTempKey, tempModel, setTempModel, saveKey, setShowSettings }} />}
      </div>
    </main>
  );
}

function SettingsModal({
  tempKey,
  setTempKey,
  tempModel,
  setTempModel,
  saveKey,
  setShowSettings,
}: {
  tempKey: string;
  setTempKey: (v: string) => void;
  tempModel: string;
  setTempModel: (v: string) => void;
  saveKey: () => void;
  setShowSettings: (v: boolean) => void;
}) {
  return (
    <div className="absolute inset-0 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 rounded-2xl w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-neutral-900 dark:text-neutral-100">API Settings</h3>
          <button onClick={() => setShowSettings(false)}>
            <X size={18} className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300" />
          </button>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Enter your Google Gemini API Key. It&apos;s stored locally on your device.
        </p>
        <input
          type="password"
          placeholder="Paste Gemini API Key..."
          className="w-full p-2 text-sm bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-md focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100 text-neutral-900 dark:text-neutral-100"
          value={tempKey}
          onChange={(e) => setTempKey(e.target.value)}
        />
        <div className="pt-2">
          <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">Model Name (Optional)</label>
          <input
            type="text"
            placeholder="e.g. gemini-2.0-flash"
            className="w-full p-2 text-sm bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-md focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-300 dark:placeholder:text-neutral-600"
            value={tempModel}
            onChange={(e) => setTempModel(e.target.value)}
          />
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
            Try: gemini-2.0-flash, gemini-2.5-flash, or gemini-1.5-pro
          </p>
        </div>
        <button
          onClick={saveKey}
          className="w-full py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium rounded-md hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors mt-2"
        >
          Save & Continue
        </button>
        <div className="text-[10px] text-neutral-400 dark:text-neutral-500 text-center">
          <a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline hover:text-neutral-600 dark:hover:text-neutral-300">Get a free key here</a>
        </div>
      </div>
    </div>
  );
}
