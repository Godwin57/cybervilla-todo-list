"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./lib/prisma";

export async function getTasks() {
  return prisma.task.findMany({ orderBy: { createdAt: "asc" } });
}

export async function createTask(title: string, description?: string, dueDate?: Date) {
  const trimmed = title.trim();
  if (!trimmed) return;
  await prisma.task.create({
    data: { title: trimmed, description, dueDate, completed: false },
  });
  revalidatePath("/");
}

export async function toggleTask(id: string) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return;
  await prisma.task.update({
    where: { id },
    data: { completed: !task.completed },
  });
  revalidatePath("/");
}

export async function editTask(id: string, title: string, description?: string | null, dueDate?: Date | null) {
  const trimmed = title.trim();
  if (!trimmed) return;
  await prisma.task.update({
    where: { id },
    data: { title: trimmed, description, dueDate },
  });
  revalidatePath("/");
}

export async function deleteTask(id: string) {
  await prisma.task.delete({ where: { id } });
  revalidatePath("/");
}

export async function clearCompleted() {
  await prisma.task.deleteMany({ where: { completed: true } });
  revalidatePath("/");
}
