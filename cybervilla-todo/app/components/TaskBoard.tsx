"use client";

import { useOptimistic, useTransition, useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { createTask, toggleTask, editTask, deleteTask, clearCompleted } from "../actions";

// ── Types ────────────────────────────────────────────────────────────────────
type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
};

type Filter = "all" | "active" | "completed";

type OptimisticAction =
  | { type: "ADD"; task: Task }
  | { type: "TOGGLE"; id: string }
  | { type: "DELETE"; id: string }
  | { type: "CLEAR_COMPLETED" }
  | { type: "EDIT"; id: string; title: string };

// ── Optimistic reducer ────────────────────────────────────────────────────────
function taskReducer(state: Task[], action: OptimisticAction): Task[] {
  switch (action.type) {
    case "ADD":
      return [...state, action.task];
    case "TOGGLE":
      return state.map((t) =>
        t.id === action.id ? { ...t, completed: !t.completed } : t
      );
    case "DELETE":
      return state.filter((t) => t.id !== action.id);
    case "CLEAR_COMPLETED":
      return state.filter((t) => !t.completed);
    case "EDIT":
      return state.map((t) =>
        t.id === action.id ? { ...t, title: action.title } : t
      );
    default:
      return state;
  }
}

// ── Theme Toggle ──────────────────────────────────────────────────────────────
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;

  const isDark = theme === "dark";
  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/40 transition-colors"
    >
      {isDark ? (
        // Sun icon
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        // Moon icon
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

// ── CheckIcon ─────────────────────────────────────────────────────────────────
function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ── Main Client Component ─────────────────────────────────────────────────────
export function TaskBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [optimisticTasks, addOptimistic] = useOptimistic(initialTasks, taskReducer);
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<Filter>("all");
  const [newTitle, setNewTitle] = useState("");

  // Edit modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Clear-completed confirm modal
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTask) editInputRef.current?.focus();
  }, [editingTask]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = optimisticTasks.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const pendingCount = optimisticTasks.filter((t) => !t.completed).length;
  const completedCount = optimisticTasks.filter((t) => t.completed).length;

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    const optimisticTask: Task = {
      id: `temp-${Date.now()}`,
      title: trimmed,
      completed: false,
      createdAt: new Date(),
    };

    setNewTitle("");
    startTransition(async () => {
      addOptimistic({ type: "ADD", task: optimisticTask });
      await createTask(trimmed);
    });
  }

  function handleToggle(id: string) {
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
  }

  function handleEditSave() {
    if (!editingTask || !editTitle.trim()) return;
    const id = editingTask.id;
    const title = editTitle.trim();
    setEditingTask(null);
    startTransition(async () => {
      addOptimistic({ type: "EDIT", id, title });
      await editTask(id, title);
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
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-indigo-900">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 leading-none">My Tasks</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Focus & Flow</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* ── Add Task Form ───────────────────────────────────────────────────── */}
      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          ref={inputRef}
          id="new-task-input"
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a new task…"
          className="flex-1 px-4 py-2.5 rounded-lg text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
        />
        <button
          type="submit"
          id="add-task-btn"
          disabled={!newTitle.trim()}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-900/40 text-white disabled:cursor-not-allowed transition-colors shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40"
        >
          Add
        </button>
      </form>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{pendingCount}</span>
          {" "}task{pendingCount !== 1 ? "s" : ""} remaining
        </span>
        {completedCount > 0 && (
          <button
            id="clear-completed-btn"
            onClick={() => setShowClearConfirm(true)}
            className="text-xs text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors"
          >
            Clear completed ({completedCount})
          </button>
        )}
      </div>

      {/* ── Filter Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800" role="tablist">
        {(["all", "active", "completed"] as Filter[]).map((f) => (
          <button
            key={f}
            role="tab"
            id={`filter-${f}`}
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${
              filter === f
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Task List ───────────────────────────────────────────────────────── */}
      <ul id="task-list" className="flex flex-col gap-2" aria-live="polite">
        {filtered.length === 0 && (
          <li className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-slate-400 dark:text-slate-500">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {filter === "completed" ? "No completed tasks yet" : filter === "active" ? "All tasks done! 🎉" : "No tasks yet — add one above"}
            </p>
          </li>
        )}

        {filtered.map((task) => (
          <li
            key={task.id}
            id={`task-${task.id}`}
            className={`group flex items-start gap-3 p-3.5 rounded-lg border transition-colors ${
              task.completed
                ? "bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800"
            }`}
          >
            {/* Checkbox */}
            <button
              aria-label={task.completed ? "Mark as active" : "Mark as complete"}
              onClick={() => handleToggle(task.id)}
              className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                task.completed
                  ? "bg-indigo-600 border-indigo-600 text-white dark:bg-indigo-500 dark:border-indigo-500"
                  : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500"
              }`}
            >
              {task.completed && <CheckIcon />}
            </button>

            {/* Title – click to edit */}
            <button
              aria-label={`Edit task: ${task.title}`}
              onClick={() => openEdit(task)}
              className={`flex-1 text-left text-sm leading-relaxed transition-colors ${
                task.completed
                  ? "line-through text-slate-400 dark:text-slate-500"
                  : "text-slate-800 dark:text-slate-200 hover:text-indigo-700 dark:hover:text-indigo-300"
              }`}
            >
              {task.title}
            </button>

            {/* Delete */}
            <button
              aria-label={`Delete task: ${task.title}`}
              onClick={() => handleDelete(task.id)}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      {/* ── Edit Modal ──────────────────────────────────────────────────────── */}
      {editingTask && (
        <div
          id="edit-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setEditingTask(null); }}
        >
          <div id="edit-modal" className="w-full max-w-md mx-4 bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 border border-slate-200 dark:border-slate-700">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Edit Task</h2>
            <input
              ref={editInputRef}
              id="edit-task-input"
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleEditSave(); if (e.key === "Escape") setEditingTask(null); }}
              className="w-full px-4 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                id="edit-cancel-btn"
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                id="edit-save-btn"
                onClick={handleEditSave}
                disabled={!editTitle.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-900/40 text-white disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Clear Completed Confirm Modal ──────────────────────────────────── */}
      {showClearConfirm && (
        <div
          id="clear-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowClearConfirm(false); }}
        >
          <div id="clear-modal" className="w-full max-w-sm mx-4 bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-red-600 dark:text-red-400">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Delete Completed Tasks</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              This will permanently remove all {completedCount} completed task{completedCount !== 1 ? "s" : ""}. This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                id="clear-cancel-btn"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                id="clear-confirm-btn"
                onClick={handleClearCompleted}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
