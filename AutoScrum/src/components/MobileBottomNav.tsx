import React from 'react';
import { BarChart3, Calendar, MessageSquare, Settings, Users } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSidebarToggle: () => void;
  onAnalyticsToggle: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ 
  activeTab, 
  onTabChange, 
  onSidebarToggle, 
  onAnalyticsToggle 
}) => {
  const navItems = [
    { id: 'team', icon: Users, label: 'Team', action: onSidebarToggle },
    { id: 'Meetings', icon: MessageSquare, label: 'Meet', action: () => onTabChange('Meetings') },
    { id: 'Kanban', icon: Calendar, label: 'Board', action: () => onTabChange('Kanban') },
    { id: 'analytics', icon: BarChart3, label: 'Stats', action: onAnalyticsToggle },
    { id: 'Settings', icon: Settings, label: 'More', action: () => onTabChange('Settings') },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
      <div className="grid grid-cols-5 py-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id || (item.id === 'Kanban' && activeTab === 'Kanban');
          
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`flex flex-col items-center justify-center py-2 px-1 transition-colors ${
                isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <item.icon className={`w-5 h-5 mb-1 ${isActive ? 'text-blue-600' : ''}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;