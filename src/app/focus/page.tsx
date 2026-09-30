'use client';

import React, { useState, useEffect } from 'react';
import { Timer, CheckSquare, Sparkles, Play, Pause, RotateCcw, Plus, Trash2, Calendar, Award } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function StudentFocusPlannerPage() {
  // Pomodoro Timer State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'FOCUS' | 'BREAK'>('FOCUS');
  const [completedSessions, setCompletedSessions] = useState(0);

  // Daily Tasks State
  const [tasks, setTasks] = useState([
    { id: '1', title: 'حل موضوع البكالوريا 2024 - علوم فيزيائية', completed: true },
    { id: '2', title: 'مراجعة تمرين المتتاليات والتركيب', completed: false },
    { id: '3', title: 'حفظ 10 مصطلحات في التاريخ والجغرافيا', completed: false },
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Pomodoro Countdown Logic
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      if (mode === 'FOCUS') {
        setCompletedSessions((prev) => prev + 1);
        setMode('BREAK');
        setTimeLeft(5 * 60);
      } else {
        setMode('FOCUS');
        setTimeLeft(25 * 60);
      }
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'FOCUS' ? 25 * 60 : 5 * 60);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), title: newTaskTitle.trim(), completed: false }]);
    setNewTaskTitle('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Page Header */}
      <div className="space-y-3">
        <Badge variant="teal" size="md" className="gap-1.5 font-bold">
          <Sparkles className="w-4 h-4 text-teal-400" />
          PROF DZ Focus & Revision Hub (مساحة التركيز والتخطيط الدراسي)
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-black text-white">
          منطقة التركيز والتخطيط للامتحانات الوطنية 🇩🇿
        </h1>
        <p className="text-sm text-stone-300 max-w-3xl leading-relaxed">
          أداة دراسية مخصصة لطلاب البكالوريا والتعليم المتوسط لحساب زمن التركيز (Pomodoro)، إدارة المهام اليومية، والتحضير للامتحانات بثبات.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Pomodoro Focus Timer */}
        <div className="lg:col-span-6 space-y-6">
          <div className="clean-card p-8 text-center space-y-6 bg-[#111D38] border border-[#1E3A5F] relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                <Timer className="w-4 h-4" /> مؤقت التركيز (Pomodoro Study Timer)
              </span>
              <Badge variant={mode === 'FOCUS' ? 'teal' : 'amber'} size="sm">
                {mode === 'FOCUS' ? 'جلسة تركيز دراسي (25 د)' : 'استراحة دراسية (5 د)'}
              </Badge>
            </div>

            {/* Giant Countdown Clock */}
            <div className="py-6">
              <div className="text-6xl sm:text-7xl font-black font-mono tracking-widest text-white drop-shadow-lg">
                {formatTime(timeLeft)}
              </div>
              <p className="text-xs text-stone-400 mt-2 font-bold">
                {mode === 'FOCUS' ? 'ركز في حل التمرين دون تشتت' : 'خذ استراحة قصيرة واسترخِ'}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={toggleTimer}
                className="gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-8"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-5 h-5" /> إيقاف مؤقت
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" /> ابدأ التركيز
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={resetTimer}
                className="border-slate-700 text-stone-300 hover:bg-slate-800"
              >
                <RotateCcw className="w-5 h-5" /> إعادة ضبط
              </Button>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-stone-400 font-bold">
              <span>الجلسات المكتملة اليوم: <strong className="text-amber-400">{completedSessions} جلسات</strong></span>
              <span>إجمالي زمة التركيز: <strong className="text-teal-400">{completedSessions * 25} دقيقة</strong></span>
            </div>
          </div>
        </div>

        {/* Right Column: Daily Tasks & BAC Countdown */}
        <div className="lg:col-span-6 space-y-6">
          {/* BAC / BEM Exam Countdown Card */}
          <div className="clean-card p-6 bg-gradient-to-r from-teal-950 to-burgundy-950 border border-teal-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" /> العد التنازلي لبكالوريا 2026 (BAC Countdown)
              </h3>
              <Badge variant="amber">رسمي 🇩🇿</Badge>
            </div>
            <p className="text-xs text-teal-200">
              متبقي على موعد امتحانات البكالوريا الوطنية في الجزائر:
            </p>
            <div className="grid grid-cols-4 gap-2 text-center pt-2">
              <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-xl font-black text-amber-400 block">285</span>
                <span className="text-[10px] text-stone-400">يوم</span>
              </div>
              <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-xl font-black text-white block">14</span>
                <span className="text-[10px] text-stone-400">ساعة</span>
              </div>
              <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-xl font-black text-white block">35</span>
                <span className="text-[10px] text-stone-400">دقيقة</span>
              </div>
              <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-xl font-black text-teal-400 block">40</span>
                <span className="text-[10px] text-stone-400">ثانية</span>
              </div>
            </div>
          </div>

          {/* Daily Tasks Checklist */}
          <div className="clean-card p-6 space-y-4 bg-[#111D38] border border-[#1E3A5F]">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-teal-400" /> قائمة المهام والتمارين اليومية (Daily Tasks)
            </h3>

            {/* Add New Task Form */}
            <form onSubmit={handleAddTask} className="flex gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="أضف مهمة دراسية أو تمرين جديد..."
                className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-stone-400 focus:outline-none focus:border-teal-500"
              />
              <Button variant="primary" size="sm" type="submit" className="gap-1 bg-teal-600 hover:bg-teal-700 text-white font-bold">
                <Plus className="w-4 h-4" /> إضافة
              </Button>
            </form>

            {/* Task Items */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                    task.completed
                      ? 'bg-slate-950/60 border-slate-800 text-stone-500 line-through'
                      : 'bg-slate-900 border-slate-700 text-stone-200'
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
                    />
                    <span className="font-semibold">{task.title}</span>
                  </label>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1 text-stone-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
