import { connectToDatabase } from '@/lib/mongodb';
import Task from '@/models/Task';
import { NextResponse } from 'next/server';

// GET all tasks
export async function GET() {
  await connectToDatabase();
  const tasks = await Task.find({});
  return NextResponse.json(tasks);
}

// POST a new task
export async function POST(req) {

  await connectToDatabase();
  const body = await req.json();
  const newTask = await Task.create(body);
  return NextResponse.json(newTask, { status: 201 });
}
