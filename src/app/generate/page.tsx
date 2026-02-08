'use client';

import { useState, useEffect } from 'react';
import { useHabitStore } from '@/store/useHabitStore';
import { ClientOnly } from '@/components/ClientOnly';
import { cn } from '@/lib/utils';
import { Sparkles, Loader2, X, Check, ArrowLeft, Plus, Key } from 'lucide-react';

interface GeneratedHabit {
  name: string;
  why: string;
}

export default function GeneratePage() {
  const { addHabit, apiKey, setApiKey, modelName, setModelName } = useHabitStore();

  const [goal, setGoal] = useState('');
  const [context, setContext] = useState('');
  const [habits, setHabits] = useState<GeneratedHabit[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addedCount, setAddedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // API key modal state
  const [showSettings, setShowSettings] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [tempModel, setTempModel] = useState('');
  const [pendingGenerate, setPendingGenerate] = useState(false);

  useEffect(() => {
    if (pendingGenerate && apiKey) {
      setPendingGenerate(false);
      handleGenerate();
    }
  }, [apiKey, pendingGenerate]);

  const handleGenerate = async () => {
    if (!goal.trim()) return;

    if (!apiKey) {
      setTempKey('');
      setTempModel(modelName || 'gemini-1.5-flash');
      setShowSettings(true);
      setPendingGenerate(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setHabits([]);
    setAddedCount(null);

    try {
      const res = await fetch('/api/generate-habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, modelName, goal: goal.trim(), context: context.trim() || undefined }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setHabits(data.habits);
      setSelected(new Set(data.habits.map((_: GeneratedHabit, i: number) => i)));
    } catch (err: any) {
      setError(err.message || 'Failed to generate habits');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSelect = (index: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleAddSelected = async () => {
    const toAdd = habits.filter((_, i) => selected.has(i));
    if (toAdd.length === 0) return;

    setIsAdding(true);
    try {
      for (const habit of toAdd) {
        await addHabit(habit.name);
      }
      setAddedCount(toAdd.length);
      setHabits([]);
      setSelected(new Set());
    } catch (err: any) {
      setError(err.message || 'Failed to add habits');
    } finally {
      setIsAdding(false);
    }
  };

  const resetForm = () => {
    setGoal('');
    setContext('');
    setHabits([]);
    setSelected(new Set());
    setError(null);
    setAddedCount(null);
  };

  const saveKey = () => {
    setApiKey(tempKey);
    setModelName(tempModel);
    setShowSettings(false);
  };

  const selectedCount = selected.size;
  const hasResults = habits.length > 0;

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans">
      <div className="max-w-md mx-auto min-h-screen flex flex-col bg-white dark:bg-neutral-950 shadow-2xl shadow-neutral-200/50 dark:shadow-none border-x border-neutral-100 dark:border-neutral-900 relative">

        <header className="p-6 pt-12 pb-4 border-b border-neutral-100 dark:border-neutral-900 flex items-center justify-between">
          <h1 className="text-2xl font-light tracking-tight text-neutral-950 dark:text-neutral-50 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Generate
          </h1>
          <button
            onClick={() => {
              setTempKey(apiKey || '');
              setTempModel(modelName || 'gemini-1.5-flash');
              setShowSettings(true);
            }}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
            title="API Key Settings"
          >
            <Key className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-24">
          <ClientOnly>
            {/* Success message */}
            {addedCount !== null && (
              <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <Check className="w-4 h-4" />
                  Added {addedCount} habit{addedCount !== 1 ? 's' : ''} successfully!
                </div>
                <button
                  onClick={resetForm}
                  className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 mt-2 underline"
                >
                  Generate more habits
                </button>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-4 rounded-xl">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  <button onClick={() => setError(null)}>
                    <X size={14} className="text-red-400 hover:text-red-600" />
                  </button>
                </div>
              </div>
            )}

            {/* Form state */}
            {!hasResults && addedCount === null && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1.5">
                    What&apos;s your goal?
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Run a marathon, Learn Spanish, Read more books..."
                    className="w-full p-3 text-sm bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-300 dark:placeholder:text-neutral-600"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1.5">
                    Any context? <span className="text-neutral-400 dark:text-neutral-500 font-normal">(optional)</span>
                  </label>
                  <textarea
                    placeholder="e.g. I'm a complete beginner, I have 30 minutes per day..."
                    rows={3}
                    className="w-full p-3 text-sm bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-300 dark:placeholder:text-neutral-600 resize-none"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!goal.trim() || isGenerating}
                  className="w-full py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Mini Habits
                    </>
                  )}
                </button>

                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 text-center">
                  Powered by Google Gemini. Your API key is stored locally.
                </p>
              </div>
            )}

            {/* Results state */}
            {hasResults && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-medium">Mini habits for</p>
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mt-0.5">{goal}</p>
                  </div>
                  <button
                    onClick={() => { setHabits([]); setSelected(new Set()); }}
                    className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Try another
                  </button>
                </div>

                <div className="space-y-2">
                  {habits.map((habit, i) => {
                    const isSelected = selected.has(i);
                    return (
                      <button
                        key={i}
                        onClick={() => toggleSelect(i)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border transition-all duration-200",
                          isSelected
                            ? "border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-900"
                            : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 opacity-50"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                            isSelected
                              ? "border-neutral-900 dark:border-neutral-100 bg-neutral-900 dark:bg-neutral-100"
                              : "border-neutral-300 dark:border-neutral-600"
                          )}>
                            {isSelected && <Check className="w-3 h-3 text-white dark:text-neutral-900" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{habit.name}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{habit.why}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleAddSelected}
                  disabled={selectedCount === 0 || isAdding}
                  className="w-full py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add {selectedCount} habit{selectedCount !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            )}
          </ClientOnly>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="absolute inset-0 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 rounded-2xl w-full max-w-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100">API Key Required</h3>
                <button onClick={() => { setShowSettings(false); setPendingGenerate(false); }}>
                  <X size={18} className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300" />
                </button>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Enter your Google Gemini API Key to generate mini habits. The key is stored locally on your device.
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
                  placeholder="e.g. gemini-1.5-flash"
                  className="w-full p-2 text-sm bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-md focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-300 dark:placeholder:text-neutral-600"
                  value={tempModel}
                  onChange={(e) => setTempModel(e.target.value)}
                />
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
                  Try: gemini-1.5-flash, gemini-pro, or gemini-2.0-flash-exp
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
        )}

      </div>
    </main>
  );
}
