import React, { useState } from 'react';
import { Plus, MoreVertical, X } from 'lucide-react';
import { Task } from '../../types';
import TaskCard from '../TaskCard';
import { taskService } from '../../services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskMove?: (taskId: string, newStatus: Task['status']) => void;
  onTaskUpdate?: () => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onTaskMove, onTaskUpdate }) => {
  const { currentUser } = useAuth();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showAddTask, setShowAddTask] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    dueDate: '',
    storyPoints: 3
  });

  const columns = [
    { id: 'todo', title: 'To Do', status: 'todo' as Task['status'], color: 'border-gray-300' },
    { id: 'in-progress', title: 'In Progress', status: 'in-progress' as Task['status'], color: 'border-blue-300' },
    { id: 'done', title: 'Done', status: 'done' as Task['status'], color: 'border-green-300' }
  ];

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    if (draggedTask && onTaskMove) {
      onTaskMove(draggedTask.id, status);
    }
    setDraggedTask(null);
    setIsDragging(false);
  };

  const handleAddTask = async (status: Task['status']) => {
    if (!newTask.title.trim()) return;

    try {
      // Use current user as assignee
      const assignee = {
        id: currentUser?.uid || 'anonymous',
        name: currentUser?.displayName || 'Anonymous User',
        avatar: currentUser?.photoURL || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
        status: 'online' as const,
        role: 'Developer'
      };

      await taskService.addTask({
        ...newTask,
        assignee,
        status,
        dueDate: newTask.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      // Reset form
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        storyPoints: 3
      });
      setShowAddTask(null);
      onTaskUpdate && onTaskUpdate();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleEditTask = (task: Task) => {
    // For now, just log - you can implement a modal later
    console.log('Edit task:', task);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      onTaskUpdate && onTaskUpdate();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleTouchStart = (e: React.TouchEvent, task: Task) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setDraggedTask(task);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !draggedTask) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStart.x);
    const deltaY = Math.abs(touch.clientY - touchStart.y);
    
    if (deltaX > 10 || deltaY > 10) {
      setIsDragging(true);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging || !draggedTask) {
      setTouchStart(null);
      setDraggedTask(null);
      setIsDragging(false);
      return;
    }

    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const columnElement = element?.closest('[data-column]');
    
    if (columnElement && onTaskMove) {
      const newStatus = columnElement.getAttribute('data-column') as Task['status'];
      onTaskMove(draggedTask.id, newStatus);
    }
    
    setTouchStart(null);
    setDraggedTask(null);
    setIsDragging(false);
  };
  const getColumnStats = (status: Task['status']) => {
    const columnTasks = getTasksByStatus(status);
    const totalPoints = columnTasks.reduce((sum, task) => sum + task.storyPoints, 0);
    return { count: columnTasks.length, points: totalPoints };
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Sprint Board</h2>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {columns.map((column) => {
          const stats = getColumnStats(column.status);
          
          return (
            <div key={column.id} className="flex flex-col" data-column={column.status}>
              {/* Column Header */}
              <div className={`flex items-center justify-between p-2 sm:p-3 rounded-lg border-2 border-dashed ${column.color} mb-4`}>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm sm:text-base font-medium text-gray-900">{column.title}</h3>
                  <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
                    {stats.count}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {stats.points} pts
                </div>
              </div>

              {/* Task Cards */}
              <div
                className="flex-1 space-y-3 min-h-[250px] sm:min-h-[300px] lg:min-h-[400px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.status)}
              >
                {getTasksByStatus(column.status).map((task) => (
                  <div
                    key={task.id}
                    onTouchStart={(e) => handleTouchStart(e, task)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className={isDragging && draggedTask?.id === task.id ? 'opacity-50 transform scale-95' : ''}
                  >
                    <TaskCard
                      task={task}
                      onDrag={handleDragStart}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                    />
                  </div>
                ))}
                
                {/* Add Task Form */}
                {showAddTask === column.status ? (
                  <div className="bg-white border-2 border-blue-200 rounded-xl p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Add New Task</h4>
                      <button
                        onClick={() => setShowAddTask(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Task title"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      
                      <textarea
                        placeholder="Description"
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={2}
                      />
                      
                      <div className="flex space-x-2">
                        <select
                          value={newTask.priority}
                          onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                          className="flex-1 p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                        
                        <input
                          type="number"
                          placeholder="Points"
                          value={newTask.storyPoints}
                          onChange={(e) => setNewTask({ ...newTask, storyPoints: parseInt(e.target.value) || 1 })}
                          className="w-20 p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                          max="21"
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAddTask(column.status)}
                          className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                        >
                          Add Task
                        </button>
                        <button
                          onClick={() => setShowAddTask(null)}
                          className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowAddTask(column.status)}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl p-3 sm:p-4 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors group"
                  >
                  <Plus className="w-5 h-5 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Add Task</span>
                </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanBoard;