import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import AuthPage from './components/Auth/AuthPage';
import { useResponsive } from './hooks/useResponsive';
import { useFirebaseTasks, useFirebaseTeamMembers, useFirebaseSprint } from './hooks/useFirebaseData';
import { initializeSampleData } from './services/firebaseService';
import TopNav from './components/Navigation/TopNav';
import LeftSidebar from './components/Sidebar/LeftSidebar';
import VideoCall from './features/video-meeting/VideoCall';
import KanbanBoard from './components/Kanban/KanbanBoard';
import RightSidebar from './components/Analytics/RightSidebar';
import FloatingActionButton from './components/FloatingActionButton';
import MobileBottomNav from './components/MobileBottomNav';
import { createDemoUser } from './services/firebaseService';

function App() {
  const { currentUser, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('Kanban');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileAnalyticsOpen, setMobileAnalyticsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  // Firebase hooks
  const { tasks, loading: tasksLoading, updateTaskStatus } = useFirebaseTasks();
  const { teamMembers, loading: teamLoading } = useFirebaseTeamMembers();
  const { sprint, loading: sprintLoading } = useFirebaseSprint();

  // Initialize sample data on first load
  React.useEffect(() => {
    const initData = async () => {
      await createDemoUser();
      await initializeSampleData();
    };
    initData();
  }, []);

  // Show auth page if not authenticated
  if (authLoading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AutoScrum AI...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage />;
  }

  const handleTaskMove = async (taskId: string, newStatus: 'todo' | 'in-progress' | 'done') => {
    await updateTaskStatus(taskId, newStatus);
  };

  const handleTaskUpdate = () => {
    // Tasks will automatically update via Firebase listeners
    console.log('Task updated');
  };

  const handleFloatingAction = (action: string) => {
    switch (action) {
      case 'meeting':
        setActiveTab('Meetings');
        break;
      case 'sprint':
        setActiveTab('Sprints');
        break;
      case 'task':
        // Open task creation modal or navigate to task creation
        console.log('Create new task');
        break;
    }
  };

  const closeMobileMenus = () => {
    setMobileSidebarOpen(false);
    setMobileAnalyticsOpen(false);
    setMobileMenuOpen(false);
  };

  // Show loading state while data is being fetched
  if (tasksLoading || teamLoading || sprintLoading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AutoScrum AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Top Navigation */}
      <TopNav 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          setActiveTab(tab);
          closeMobileMenus();
        }}
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        isMobileMenuOpen={mobileMenuOpen}
      />
      
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar */}
        <LeftSidebar
          teamMembers={teamMembers}
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          isMobile={isMobile || isTablet}
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6 overflow-y-auto pb-20 lg:pb-6 min-h-0">
          {/* Video Meeting Section */}
          {(activeTab === 'Meetings' || isDesktop) && (
            <div className="flex-shrink-0">
              <VideoCall />
            </div>
          )}
          
          {/* Kanban Board Section */}
          {(activeTab === 'Kanban' || isDesktop) && (
            <div className="flex-shrink-0">
              <KanbanBoard tasks={tasks} onTaskMove={handleTaskMove} onTaskUpdate={handleTaskUpdate} />
            </div>
          )}
          
          {/* Other Tab Content */}
          {activeTab === 'Sprints' && !isDesktop && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex items-center justify-center h-64 flex-shrink-0">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sprint Planning</h3>
                <p className="text-gray-600">Sprint planning features coming soon...</p>
              </div>
            </div>
          )}
          
          {activeTab === 'Analytics' && !isDesktop && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex items-center justify-center h-64 flex-shrink-0">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
                <p className="text-gray-600">Advanced analytics coming soon...</p>
              </div>
            </div>
          )}
          
          {activeTab === 'Settings' && !isDesktop && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex items-center justify-center h-64 flex-shrink-0">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings</h3>
                <p className="text-gray-600">Configuration options coming soon...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Right Sidebar */}
        <RightSidebar 
          sprint={sprint}
          isOpen={mobileAnalyticsOpen}
          onClose={() => setMobileAnalyticsOpen(false)}
          isMobile={isMobile || isTablet}
        />
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSidebarToggle={() => setMobileSidebarOpen(true)}
        onAnalyticsToggle={() => setMobileAnalyticsOpen(true)}
      />
      
      {/* Floating Action Button */}
      <FloatingActionButton onAction={handleFloatingAction} />
    </div>
  );
}

export default App;