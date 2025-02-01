'use client';
import { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz'; // Updated import
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend'; // Drag-and-drop backend

const locales = { 'en-US': require('date-fns/locale/en-US') };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function TaskCalendar() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', start: '', end: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch('/api/tasks')
      .then((res) => {
        // Check if the response is OK (status 200)
        if (!res.ok) {
          throw new Error('Failed to fetch tasks');
        }
        // Try to parse JSON, handle errors if the response is not valid JSON
        return res.json().catch(() => {
          throw new Error('Failed to parse response as JSON');
        });
      })
      .then((data) => {
        setTasks(data);
      })
      .catch((error) => {
        console.error('Error fetching tasks:', error.message);
        // Optionally, set an error state to display a message to the user
      });
  }, []);

  const bangladeshTimeZone = 'Asia/Dhaka';

  const convertToBangladeshTime = (date) => {
    return toZonedTime(date, bangladeshTimeZone);
  };

  // Set default time to current time for the new task
  const setDefaultTimes = () => {
    const currentDate = new Date();
    setNewTask({
      ...newTask,
      start: currentDate.toISOString(),
      end: new Date(currentDate.getTime() + 3600000).toISOString(), // 1 hour later
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask({ ...newTask, [name]: value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const task = {
      title: newTask.title,
      start: new Date(newTask.start),
      end: new Date(newTask.end),
    };

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });

      if (!res.ok) {
        throw new Error('Failed to create task');
      }

      const createdTask = await res.json();
      setTasks((prev) => [...prev, createdTask]);
      setShowForm(false); // Hide the form after submission
    } catch (error) {
      console.error('Error adding task:', error.message);
    }
  };

  const handleEventDrop = async ({ event, start, end }) => {
    const updatedTask = { ...event, start, end };
    try {
      const res = await fetch(`/api/tasks/${event._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask),
      });

      if (!res.ok) {
        throw new Error('Failed to update task');
      }

      const updatedData = await res.json();
      setTasks((prev) => prev.map((t) => (t._id === event._id ? updatedData : t)));
    } catch (error) {
      console.error('Error updating task:', error.message);
    }
  };

  // Allow task to span a full week
  const handleFullWeekTask = () => {
    const currentDate = new Date();
    const endOfWeek = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later
    setNewTask({
      ...newTask,
      start: currentDate.toISOString(),
      end: endOfWeek.toISOString(),
    });
  };

  return (
    <div style={{ height: 500 }}>
      <h2>Task Calendar</h2>

      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'Add New Task'}
      </button>

      {showForm && (
        <form onSubmit={handleFormSubmit}>
          <input
            type="text"
            name="title"
            placeholder="Task Title"
            value={newTask.title}
            onChange={handleInputChange}
            required
          />
          <input
            type="datetime-local"
            name="start"
            value={newTask.start}
            onChange={handleInputChange}
            required
          />
          <input
            type="datetime-local"
            name="end"
            value={newTask.end}
            onChange={handleInputChange}
            required
          />
          <button type="submit">Add Task</button>
        </form>
      )}

      <button onClick={handleFullWeekTask}>Add Task for Full Week</button>

      <DndProvider backend={HTML5Backend}>
        <Calendar
          localizer={localizer}
          events={tasks.map((task) => ({
            ...task,
            start: convertToBangladeshTime(task.start),
            end: convertToBangladeshTime(task.end),
          }))}
          startAccessor="start"
          endAccessor="end"
          style={{ width: '100%' }}
          onEventDrop={handleEventDrop}
          draggableAccessor={() => true} // Enable dragging
        />
      </DndProvider>
    </div>
  );
}
