import { getTasks } from "./actions";
import { TaskBoard } from "./components/TaskBoard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const tasks = await getTasks();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Subtle decorative gradient top bar */}
      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600" />

      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm shadow-slate-200/80 dark:shadow-slate-900 border border-slate-100 dark:border-slate-800 p-6">
          <TaskBoard initialTasks={tasks} />
        </div>

        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-600">
          Focus & Flow — Built with Next.js &amp; Prisma
        </p>
      </main>
    </div>
  );
}
