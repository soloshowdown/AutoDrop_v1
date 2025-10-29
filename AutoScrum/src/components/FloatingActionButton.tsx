import React, { useState } from 'react';
import { Plus, Video, PlayCircle, FileText, X } from 'lucide-react';

interface FloatingActionButtonProps {
  onAction: (action: string) => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onAction }) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: Video, label: 'Start Meeting', action: 'meeting', color: 'bg-blue-500 hover:bg-blue-600' },
    { icon: PlayCircle, label: 'New Sprint', action: 'sprint', color: 'bg-purple-500 hover:bg-purple-600' },
    { icon: FileText, label: 'Create Task', action: 'task', color: 'bg-green-500 hover:bg-green-600' },
  ];

  const handleAction = (action: string) => {
    onAction(action);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-20 right-6 z-30 lg:hidden">
      {/* Action Buttons */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 space-y-3">
          {actions.map((action, index) => (
            <div
              key={action.action}
              className="flex items-center space-x-3 animate-in slide-in-from-bottom-2 duration-200"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="bg-white text-gray-900 px-3 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap">
                {action.label}
              </span>
              <button
                onClick={() => handleAction(action.action)}
                className={`w-12 h-12 rounded-full shadow-lg text-white transition-all duration-200 ${action.color} hover:scale-110`}
              >
                <action.icon className="w-5 h-5 mx-auto" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg text-white transition-all duration-200 ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-600 rotate-45' 
            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-110'
        }`}
      >
        {isOpen ? <X className="w-6 h-6 mx-auto" /> : <Plus className="w-6 h-6 mx-auto" />}
      </button>
    </div>
  );
};

export default FloatingActionButton;