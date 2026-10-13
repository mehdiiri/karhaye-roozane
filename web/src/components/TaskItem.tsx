import React, { useState } from 'react';
import { motion, Reorder } from 'motion/react';
import { Check, Clock, GripVertical, RotateCcw } from 'lucide-react';
import { Task } from '../types';
import { toPersianDigits } from '../utils/jalali';
import confetti from 'canvas-confetti';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onClickDetails?: (task: Task) => void;
  isWidgetMode?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onClickDetails,
  isWidgetMode = false,
}) => {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCompleting(true);

    if (!task.completed) {
      try {
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.65 },
          colors:
            task.priority === 'high'
              ? ['#ef4444', '#f87171']
              : task.priority === 'medium'
              ? ['#10b981', '#34d399']
              : ['#3b82f6', '#60a5fa'],
        });
      } catch {
        // Ignore
      }
    }

    setTimeout(() => {
      onToggleComplete(task.id);
      setIsCompleting(false);
    }, 280);
  };

  const priorityColor =
    task.priority === 'high'
      ? { dot: 'bg-red-500', border: 'border-r-red-500' }
      : task.priority === 'medium'
      ? { dot: 'bg-emerald-500', border: 'border-r-emerald-500' }
      : { dot: 'bg-blue-500', border: 'border-r-blue-500' };

  return (
    <Reorder.Item
      value={task}
      id={task.id}
      className="list-none select-none"
      whileDrag={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)' }}
    >
      <div
        onClick={() => onClickDetails?.(task)}
        className={`group relative flex items-center justify-between gap-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-blue-400/60 dark:hover:border-blue-500/50 cursor-pointer transition-all border-r-[3.5px] ${
          priorityColor.border
        } ${isWidgetMode ? 'py-1.5 px-2 mb-1 text-xs' : 'py-2 px-3 mb-1.5 text-sm'}`}
      >
        {/* Right side: Drag Handle + Checkbox + Dot + Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Subtle Drag Handle */}
          {!isWidgetMode && (
            <div
              className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 p-0.5 -mr-1"
              title="برای جابجایی بکشید و رها کنید"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Checkbox */}
          <button
            onClick={handleCheck}
            type="button"
            aria-label="تکمیل کار"
            className={`flex-shrink-0 flex items-center justify-center rounded-md border transition-all ${
              task.completed || isCompleting
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800'
            } ${isWidgetMode ? 'w-4 h-4' : 'w-4.5 h-4.5'}`}
          >
            {task.completed || isCompleting ? (
              <Check className="w-3 h-3 stroke-[3]" />
            ) : (
              <span className={`w-1.5 h-1.5 rounded-full ${priorityColor.dot} opacity-80`} />
            )}
          </button>

          {/* Priority Dot */}
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColor.dot}`}
            title="اولویت"
          />

          {/* Title */}
          <span
            className={`font-medium tracking-tight text-slate-800 dark:text-slate-100 truncate ${
              task.completed || isCompleting ? 'line-through text-slate-400 dark:text-slate-500' : ''
            }`}
          >
            {task.title}
          </span>
        </div>

        {/* Left side: Time & Badges */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {task.time && (
            <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
              <Clock className="w-3 h-3" />
              <span>{toPersianDigits(task.time)}</span>
            </span>
          )}

          {task.completed && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium">
              انجام شد
            </span>
          )}
        </div>
      </div>
    </Reorder.Item>
  );
};
