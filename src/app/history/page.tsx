'use client';

import { useState, useEffect } from 'react';
import { format, subDays, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks, isAfter } from 'date-fns';
import { useHabitStore, Habit } from '@/store/useHabitStore';
import { ClientOnly } from '@/components/ClientOnly';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Sparkles, X, Loader2, Key } from 'lucide-react';

export default function HistoryPage() {
  const { habits, toggleHabit, apiKey, setApiKey, modelName, setModelName, syncHabits } = useHabitStore();
  const [expandedHabits, setExpandedHabits] = useState<Record<string, boolean>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [tempModel, setTempModel] = useState('');

  useEffect(() => {
    syncHabits();
  }, [syncHabits]);

  const today = new Date();
  
  // Date Logic
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const currentWeekDays = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });

  const pastWeeksStart = subWeeks(currentWeekStart, 4);
  const pastWeeksEnd = subDays(currentWeekStart, 1);
  const pastWeeksDays = eachDayOfInterval({ start: pastWeeksStart, end: pastWeeksEnd });

  const toggleHistory = (habitId: string) => {
    setExpandedHabits(prev => ({ ...prev, [habitId]: !prev[habitId] }));
  };

  const getStreak = (habit: Habit) => {
    let s = 0;
    let date = new Date();
    if (!habit.completedDates[format(date, 'yyyy-MM-dd')]) {
        date = subDays(date, 1);
    }
    while (habit.completedDates[format(date, 'yyyy-MM-dd')]) {
        s++;
        date = subDays(date, 1);
    }
    return s;
  };
  
  const handleAnalyze = async () => {
    if (!apiKey) {
      setTempKey(''); 
      setTempModel(modelName || 'gemini-1.5-flash');
      setShowSettings(true);
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      // Prepare Context: Last 14 Days
      const last14Days = eachDayOfInterval({ start: subDays(today, 13), end: today });
      const context = habits.map(h => {
        const history = last14Days.map(d => {
            const dateStr = format(d, 'yyyy-MM-dd');
            const done = h.completedDates[dateStr] ? 'Done' : 'Missed';
            const note = h.notes?.[dateStr] ? `(Note: ${h.notes[dateStr]})` : '';
            return `${dateStr}: ${done} ${note}`;
        }).join('\n');
        return `Habit: ${h.name}\n${history}`;
      }).join('\n\n');

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, context, modelName }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data.result);
    } catch (err: any) {
      // On failure, allow user to fix key
      setTempKey(apiKey || '');
      setTempModel(modelName || 'gemini-1.5-flash');
      setShowSettings(true);
      alert(`Analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveKey = () => {
      setApiKey(tempKey);
      setModelName(tempModel);
      setShowSettings(false);
      if (tempKey && !apiKey) handleAnalyze(); 
  };

  const openSettings = () => {
      setTempKey(apiKey || '');
      setTempModel(modelName || 'gemini-1.5-flash');
      setShowSettings(true);
  };

  const WeekGrid = ({ days, habit }: { days: Date[], habit: Habit }) => (
    <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const isDone = !!habit.completedDates[dateKey];
            const note = habit.notes?.[dateKey];
            const isToday = isSameDay(day, today);
            const isFuture = isAfter(day, today);
            const dayNum = format(day, 'd');
            
            if (isFuture) {
                return <div key={dateKey} className="w-7 h-7" />; 
            }

            return (
                <div 
                  key={dateKey} 
                  className="flex flex-col items-center justify-center cursor-pointer group/date"
                  onClick={() => toggleHabit(habit.id, dateKey)}
                  title={note ? `${dateKey}: ${note}` : dateKey}
                >
                    <div 
                        className={cn(
                            "w-7 h-7 rounded-md transition-all duration-200 border flex items-center justify-center text-[10px] font-medium relative",
                            isDone 
                                ? "bg-neutral-900 dark:bg-neutral-100 border-neutral-900 dark:border-neutral-100 text-white dark:text-neutral-900" 
                                : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-700",
                            isToday && !isDone && "ring-2 ring-neutral-900/10 dark:ring-neutral-100/10 ring-offset-1 dark:ring-offset-neutral-900 border-neutral-300 dark:border-neutral-600"
                        )}
                    >
                        {dayNum}
                        {note && (
                            <div className={cn(
                                "absolute bottom-1 w-0.5 h-0.5 rounded-full",
                                isDone ? "bg-white/50 dark:bg-neutral-900/50" : "bg-neutral-400 dark:bg-neutral-500"
                            )} />
                        )}
                    </div>
                </div>
            );
        })}
    </div>
  );

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans">
      <div className="max-w-md mx-auto min-h-screen flex flex-col bg-white dark:bg-neutral-950 shadow-2xl shadow-neutral-200/50 dark:shadow-none border-x border-neutral-100 dark:border-neutral-900 relative">
        
        <header className="p-6 pt-12 pb-4 border-b border-neutral-100 dark:border-neutral-900 flex items-center justify-between">
          <h1 className="text-2xl font-light tracking-tight text-neutral-950 dark:text-neutral-50">History</h1>
          <div className="flex gap-2">
            <button 
                onClick={openSettings}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
                title="API Key Settings"
            >
                <Key className="w-4 h-4" />
            </button>
            <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500 dark:text-neutral-400 disabled:opacity-50"
                title="AI Weekly Review"
            >
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          <ClientOnly>
             {/* AI Insight Card */}
             {analysis && (
                 <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl relative animate-in fade-in slide-in-from-top-4">
                     <button 
                        onClick={() => setAnalysis(null)}
                        className="absolute top-2 right-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
                     >
                         <X size={14} />
                     </button>
                     <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2 flex items-center gap-2">
                         <Sparkles size={12} /> Weekly Insight
                     </h3>
                     <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                         {analysis}
                     </div>
                 </div>
             )}

             {habits.length === 0 ? (
                <div className="text-center text-neutral-400 dark:text-neutral-600 text-sm py-8">
                  No habits to track yet.
                </div>
             ) : (
                 habits.map((habit) => {
                    const isExpanded = !!expandedHabits[habit.id];
                    
                    return (
                        <div key={habit.id} className="space-y-3">
                            <div className="flex items-baseline justify-between">
                                <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">{habit.name}</h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-medium uppercase text-neutral-400 dark:text-neutral-500 tracking-wider">
                                        {getStreak(habit)} Day Streak
                                    </span>
                                    <button 
                                        onClick={() => toggleHistory(habit.id)}
                                        className="text-neutral-300 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors p-1"
                                    >
                                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                {/* Header Row */}
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {['M','T','W','T','F','S','S'].map((d, i) => (
                                        <div key={i} className="text-center text-[9px] font-bold text-neutral-300 dark:text-neutral-600 select-none">
                                            {d}
                                        </div>
                                    ))}
                                </div>

                                {/* Past Weeks (Collapsible) */}
                                {isExpanded && (
                                    <div className="space-y-1 animate-in slide-in-from-top-2 duration-200 fade-in">
                                        <WeekGrid days={pastWeeksDays} habit={habit} />
                                    </div>
                                )}

                                {/* Current Week (Always Visible) */}
                                <WeekGrid days={currentWeekDays} habit={habit} />
                            </div>
                        </div>
                    );
                 })
             )}
          </ClientOnly>
        </div>

        {/* Settings Modal (Simple Overlay) */}
        {showSettings && (
            <div className="absolute inset-0 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 rounded-2xl w-full max-w-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium text-neutral-900 dark:text-neutral-100">Enable AI Insights</h3>
                        <button onClick={() => setShowSettings(false)}><X size={18} className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300" /></button>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Enter your Google Gemini API Key to enable weekly reviews. The key is stored locally on your device.
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
                        Save & Enable
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
