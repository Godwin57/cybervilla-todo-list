"use client";

import {
  useOptimistic,
  useTransition,
  useState,
  useRef,
  useEffect,
} from "react";
import { useTheme } from "next-themes";
import {
  createTask,
  toggleTask,
  editTask,
  deleteTask,
  clearCompleted,
} from "../actions";

// ── Types ────────────────────────────────────────────────────────────────────
export type Task = {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: Date | null;
  completed: boolean;
  createdAt: Date;
};

export type Filter = "all" | "active" | "completed";

type OptimisticAction =
  | { type: "ADD"; task: Task }
  | { type: "TOGGLE"; id: string }
  | { type: "DELETE"; id: string }
  | { type: "CLEAR_COMPLETED" }
  | {
      type: "EDIT";
      id: string;
      title: string;
      description?: string | null;
      dueDate?: Date | null;
    };

// ── Optimistic reducer ────────────────────────────────────────────────────────
function taskReducer(state: Task[], action: OptimisticAction): Task[] {
  switch (action.type) {
    case "ADD":
      return [...state, action.task];
    case "TOGGLE":
      return state.map((t) =>
        t.id === action.id ? { ...t, completed: !t.completed } : t,
      );
    case "DELETE":
      return state.filter((t) => t.id !== action.id);
    case "CLEAR_COMPLETED":
      return state.filter((t) => !t.completed);
    case "EDIT":
      return state.map((t) =>
        t.id === action.id
          ? {
              ...t,
              title: action.title,
              description: action.description,
              dueDate: action.dueDate,
            }
          : t,
      );
    default:
      return state;
  }
}

// ── Utility ───────────────────────────────────────────────────────────────────
function formatDueDate(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const timeStr = d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (d.toDateString() === now.toDateString()) {
    return `Today, ${timeStr}`;
  } else if (d.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow, ${timeStr}`;
  } else {
    return `${d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}, ${timeStr}`;
  }
}

function toDatetimeLocal(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted)
    return (
      <button className="w-10 h-10 p-2" aria-label="Theme toggle placeholder" />
    );

  const isDark = theme === "dark";
  return (
    <button
      aria-label="Toggle theme"
      className="p-2 rounded-full hover:bg-surface-container-low/50 dark:hover:bg-gray-800/50 transition-colors text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <span className="material-symbols-outlined">
        {isDark ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}

function Header({ pendingCount }: { pendingCount: number }) {
  return (
    <>
      {/* Top Navigation (Web) */}
      <header className="hidden md:flex justify-between items-center max-w-[640px] mx-auto px-6 h-16 w-full docked full-width top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl shadow-sm mb-stack-gap border border-white/20 dark:border-gray-800/50">
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-background dark:text-gray-100 animate-float">
          My Tasks
        </h1>
        <div className="flex items-center gap-4">
          <span className="font-body-sm text-body-sm text-on-surface-variant dark:text-gray-300 font-medium">
            {pendingCount} tasks remaining
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* Top Navigation (Mobile) */}
      <header className="md:hidden flex justify-between items-center w-full px-margin-mobile h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl mb-stack-gap fixed top-0 left-0 z-50 border-b border-white/20 dark:border-gray-800/50">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-background dark:text-gray-100 animate-float">
          My Tasks
        </h1>
        <ThemeToggle />
      </header>
    </>
  );
}

function TaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  onToggle: (id: string, current: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <li
      id={`task-${task.id}`}
      className="task-list-item flex items-center justify-between p-4 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors group"
    >
      <div
        className="flex items-start gap-4 flex-grow cursor-pointer mt-1"
        onClick={() => onToggle(task.id, task.completed)}
      >
        <input
          aria-label="Mark task complete"
          checked={task.completed}
          readOnly
          className="custom-checkbox w-6 h-6 rounded border-2 border-outline-variant cursor-pointer focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors flex-shrink-0"
          type="checkbox"
        />
        <div
          className={`flex flex-col flex-grow select-none ${task.completed ? "opacity-60" : ""}`}
        >
          <span
            className={`font-body-md text-body-md font-semibold ${task.completed ? "text-on-surface-variant dark:text-gray-400 line-through" : "text-on-background dark:text-gray-100"}`}
          >
            {task.title}
          </span>
          {task.dueDate && (
            <span className="font-body-sm text-body-sm text-on-surface-variant dark:text-gray-300 flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[16px]">
                calendar_today
              </span>
              {formatDueDate(task.dueDate)}
            </span>
          )}
          {task.description && (
            <p className="font-body-sm text-body-sm text-on-surface-variant/80 dark:text-gray-400 mt-1">
              {task.description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          aria-label={`Edit task: ${task.title}`}
          className="delete-btn p-2 text-outline hover:text-primary focus:text-primary focus:opacity-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all ml-2 self-center"
        >
          <span className="material-symbols-outlined">edit</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          aria-label={`Delete task: ${task.title}`}
          className="delete-btn p-2 text-outline hover:text-error focus:text-error focus:opacity-100 rounded-full focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2 transition-all ml-2 self-center"
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>
    </li>
  );
}

function FilterTabs({
  filter,
  setFilter,
  pendingCount,
  completedCount,
  onClearCompleted,
}: {
  filter: Filter;
  setFilter: (f: Filter) => void;
  pendingCount: number;
  completedCount: number;
  onClearCompleted: () => void;
}) {
  return (
    <>
      {/* Desktop Filters Footer (Hidden on Mobile) */}
      <div className="hidden md:flex items-center justify-between p-4 bg-white/40 dark:bg-gray-900/40 border-t border-outline-variant/30">
        <span className="font-body-sm text-body-sm text-on-surface-variant dark:text-gray-300 font-medium">
          {pendingCount} items left
        </span>
        <div className="flex gap-2">
          {(["all", "active", "completed"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`font-label-md text-label-md px-3 py-1 rounded-md font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 capitalize ${
                filter === f
                  ? "text-primary border border-primary bg-primary-fixed/80 dark:bg-primary-fixed-dim/20 hover:bg-primary-fixed shadow-sm"
                  : "text-on-surface-variant dark:text-gray-300 hover:text-on-background dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-800/50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={() => completedCount > 0 && onClearCompleted()}
          className={`font-label-md text-label-md text-on-surface-variant dark:text-gray-300 hover:text-on-background dark:hover:text-gray-100 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm ${completedCount === 0 ? "opacity-50 cursor-not-allowed" : "hover:underline"}`}
        >
          Clear Completed
        </button>
      </div>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-center items-center gap-stack-gap h-14 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t border-white/20 dark:border-gray-800/50">
        {(["all", "active", "completed"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex flex-col items-center justify-center w-full h-full pt-1 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-colors capitalize ${
              filter === f
                ? "text-primary font-bold border-t-2 border-primary"
                : "text-on-surface-variant dark:text-gray-300 hover:text-primary dark:hover:text-primary"
            }`}
          >
            <span
              className={`material-symbols-outlined mb-1 ${filter === f ? "text-primary" : ""}`}
            >
              {f === "all"
                ? "list"
                : f === "active"
                  ? "radio_button_unchecked"
                  : "check_circle"}
            </span>
            <span className="font-label-sm text-label-sm">{f}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

function AddTaskModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, description?: string, dueDate?: Date) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDateStr, setDueDateStr] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setTitle("");
      setDescription("");
      setDueDateStr("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const dateObj = dueDateStr ? new Date(dueDateStr) : undefined;
    onAdd(title, description, dateObj);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
          Add New Task
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-4 py-3 rounded-md text-[16px] leading-[24px] bg-white dark:bg-gray-800 border-2 border-outline-variant text-on-background dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant dark:text-gray-300 mb-1">
              Date to finish
            </label>
            <input
              type="datetime-local"
              value={dueDateStr}
              onChange={(e) => setDueDateStr(e.target.value)}
              className="w-full px-4 py-3 rounded-md text-[16px] leading-[24px] bg-white dark:bg-gray-800 border-2 border-outline-variant text-on-background dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={3}
              className="w-full px-4 py-3 rounded-md text-[16px] leading-[24px] bg-white dark:bg-gray-800 border-2 border-outline-variant text-on-background dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-on-surface-variant dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !dueDateStr}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-primary hover:opacity-90 disabled:opacity-50 text-white disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditModal({
  editingTask,
  editTitle,
  setEditTitle,
  editDescription,
  setEditDescription,
  editDueDateStr,
  setEditDueDateStr,
  onSave,
  onCancel,
}: {
  editingTask: Task | null;
  editTitle: string;
  setEditTitle: (val: string) => void;
  editDescription: string;
  setEditDescription: (val: string) => void;
  editDueDateStr: string;
  setEditDueDateStr: (val: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTask) {
      setTimeout(() => editInputRef.current?.focus(), 50);
    }
  }, [editingTask]);

  if (!editingTask) return null;

  return (
    <div
      id="edit-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        id="edit-modal"
        className="w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200"
      >
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
          Edit Task
        </h2>
        <div className="flex flex-col gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              ref={editInputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSave();
                if (e.key === "Escape") onCancel();
              }}
              className="w-full px-4 py-3 rounded-md text-[16px] leading-[24px] bg-white dark:bg-gray-800 border-2 border-outline-variant text-on-background dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant dark:text-gray-300 mb-1">
              Date to finish
            </label>
            <input
              type="datetime-local"
              value={editDueDateStr}
              onChange={(e) => setEditDueDateStr(e.target.value)}
              className="w-full px-4 py-3 rounded-md text-[16px] leading-[24px] bg-white dark:bg-gray-800 border-2 border-outline-variant text-on-background dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-md text-[16px] leading-[24px] bg-white dark:bg-gray-800 border-2 border-outline-variant text-on-background dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            id="edit-cancel-btn"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-on-surface-variant dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            id="edit-save-btn"
            onClick={onSave}
            disabled={!editTitle.trim()}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-primary hover:opacity-90 disabled:opacity-50 text-white disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({
  isOpen,
  completedCount,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  completedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      id="clear-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        id="clear-modal"
        className="w-full max-w-sm mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-error">
              warning
            </span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Delete Completed
          </h2>
        </div>
        <p className="text-base text-on-surface-variant dark:text-gray-300 mb-6">
          This will permanently remove all {completedCount} completed task
          {completedCount !== 1 ? "s" : ""}. This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            id="clear-cancel-btn"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-on-surface-variant dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            id="clear-confirm-btn"
            onClick={onConfirm}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-error hover:opacity-90 text-white transition-all focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Client Component ─────────────────────────────────────────────────────
export function TaskBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [optimisticTasks, addOptimistic] = useOptimistic(
    initialTasks,
    taskReducer,
  );
  const [, startTransition] = useTransition();
  const [filter, setFilter] = useState<Filter>("all");

  const [showAddModal, setShowAddModal] = useState(false);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDateStr, setEditDueDateStr] = useState("");

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // ── Computed ───────────────────────────────────────────────────────────────
  const filtered = optimisticTasks.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const pendingCount = optimisticTasks.filter((t) => !t.completed).length;
  const completedCount = optimisticTasks.filter((t) => t.completed).length;

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleAddSubmit(
    title: string,
    description?: string,
    dueDate?: Date,
  ) {
    const trimmed = title.trim();
    if (!trimmed) return;

    const optimisticTask: Task = {
      id: `temp-${Date.now()}`,
      title: trimmed,
      description: description?.trim() || null,
      dueDate: dueDate || null,
      completed: false,
      createdAt: new Date(),
    };

    startTransition(async () => {
      addOptimistic({ type: "ADD", task: optimisticTask });
      await createTask(
        trimmed,
        optimisticTask.description || undefined,
        dueDate,
      );
    });
  }

  function handleToggle(id: string, currentStatus: boolean) {
    startTransition(async () => {
      addOptimistic({ type: "TOGGLE", id });
      await toggleTask(id);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      addOptimistic({ type: "DELETE", id });
      await deleteTask(id);
    });
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditDueDateStr(
      task.dueDate ? toDatetimeLocal(new Date(task.dueDate)) : "",
    );
  }

  function handleEditSave() {
    if (!editingTask || !editTitle.trim()) return;
    const id = editingTask.id;
    const title = editTitle.trim();
    const desc = editDescription.trim() || null;
    const dateObj = editDueDateStr ? new Date(editDueDateStr) : null;

    setEditingTask(null);
    startTransition(async () => {
      addOptimistic({
        type: "EDIT",
        id,
        title,
        description: desc,
        dueDate: dateObj,
      });
      await editTask(id, title, desc, dateObj);
    });
  }

  function handleClearCompleted() {
    setShowClearConfirm(false);
    startTransition(async () => {
      addOptimistic({ type: "CLEAR_COMPLETED" });
      await clearCompleted();
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Header pendingCount={pendingCount} />

      {/* Main Content Canvas */}
      <main className="w-full max-w-[640px] mx-auto md:mt-0 mt-[5rem] pb-24 md:pb-0 flex flex-col gap-stack-gap flex-grow animate-fade-slide-up">
        {/* Add Task Button */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-[16px] leading-[24px] font-semibold bg-primary hover:opacity-90 active:scale-95 text-white transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <span className="material-symbols-outlined">add</span>
            Create Task
          </button>
        </div>

        {/* Task List Container */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 dark:border-gray-800/50 overflow-hidden flex flex-col transition-all duration-300">
          <ul
            className="flex flex-col divide-y divide-outline-variant/30"
            role="list"
            id="task-list"
            aria-live="polite"
          >
            {filtered.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
            {filtered.length === 0 && (
              <li className="p-8 text-center text-on-surface-variant dark:text-gray-300 font-body-sm">
                {filter === "completed"
                  ? "No completed tasks yet"
                  : filter === "active"
                    ? "All tasks done! 🎉"
                    : "No tasks yet — add one above"}
              </li>
            )}
          </ul>

          <FilterTabs
            filter={filter}
            setFilter={setFilter}
            pendingCount={pendingCount}
            completedCount={completedCount}
            onClearCompleted={() => setShowClearConfirm(true)}
          />
        </div>
      </main>

      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddSubmit}
      />

      <EditModal
        editingTask={editingTask}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        editDescription={editDescription}
        setEditDescription={setEditDescription}
        editDueDateStr={editDueDateStr}
        setEditDueDateStr={setEditDueDateStr}
        onSave={handleEditSave}
        onCancel={() => setEditingTask(null)}
      />

      <ConfirmModal
        isOpen={showClearConfirm}
        completedCount={completedCount}
        onConfirm={handleClearCompleted}
        onCancel={() => setShowClearConfirm(false)}
      />
    </>
  );
}
