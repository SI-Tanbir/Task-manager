import { connectToDatabase } from '@/lib/mongodb';
import Task from '@/models/Task';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  await connectToDatabase();
  const { id } = params;
  const updatedTask = await req.json();
  await Task.findByIdAndUpdate(id, updatedTask);
  return NextResponse.json({ message: 'Task updated' });
}
