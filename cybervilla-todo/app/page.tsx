import { getTasks } from "./actions";
import { TaskBoard } from "./components/TaskBoard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const tasks = await getTasks();

  return (
    <div 
      className="min-h-screen font-body-md text-on-background flex flex-col md:py-margin-desktop py-margin-mobile px-margin-mobile bg-cover bg-center bg-fixed transition-colors"
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      <TaskBoard initialTasks={tasks} />
    </div>
  );
}
