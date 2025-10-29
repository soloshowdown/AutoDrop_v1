import React from 'react';
import { Calendar, Flag, Edit, Trash2 } from 'lucide-react';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onDrag?: (e: React.DragEvent, task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onDrag, onEdit, onDelete }) => {
  const priorityColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-red-100 text-red-800 border-red-200',
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isOverdue = new Date(task.dueDate) < new Date();

  return (
    <div
      draggable
      onDragStart={(e) => onDrag && onDrag(e, task)}
      className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group touch-manipulation relative"
    >
      {/* Priority Badge */}
      <div className="flex items-center justify-between mb-2">
        <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${priorityColors[task.priority]}`}>
          <Flag className="w-2.5 h-2.5 sm:w-3 sm:h-3 inline mr-1" />
          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
        </span>
        <span className="text-xs text-gray-500 font-medium hidden sm:inline">{task.storyPoints} pts</span>
      </div>

      {/* Action Buttons */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit && onEdit(task); }}
          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
        >
          <Edit className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete && onDelete(task.id); }}
          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Task Title */}
      <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
        {task.title}
      </h4>

      {/* Task Description */}
      <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img
            src={task.assignee.avatar}
            alt={task.assignee.name}
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
            title={task.assignee.name}
          />
          <span className="text-xs text-gray-500 truncate max-w-16 sm:max-w-20">{task.assignee.name.split(' ')[0]}</span>
        </div>
        
        <div className={`flex items-center space-x-1 text-xs ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
          <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          <span>{formatDate(task.dueDate)}</span>
        </div>
        
        {/* Mobile Story Points */}
        <span className="sm:hidden text-xs text-gray-500 font-medium ml-2">{task.storyPoints}pts</span>
      </div>
    </div>
  );
};

export default TaskCard;