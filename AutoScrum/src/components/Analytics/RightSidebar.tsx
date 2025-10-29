import React from 'react';
import { TrendingUp, Target, Clock, Zap, FileText, ChevronRight } from 'lucide-react';
import { Sprint } from '../../types';

interface RightSidebarProps {
  sprint: Sprint | null;
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ sprint, isOpen, onClose, isMobile }) => {
  // Show loading state if sprint is not available
  if (!sprint) {
    return isMobile ? null : (
      <div className="hidden xl:flex w-80 bg-white border-l border-gray-200 flex-col items-center justify-center">
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading sprint data...</p>
        </div>
      </div>
    );
  }

  const burndownData = [
    { day: 'Day 1', ideal: 100, actual: 100 },
    { day: 'Day 3', ideal: 85, actual: 95 },
    { day: 'Day 5', ideal: 70, actual: 80 },
    { day: 'Day 7', ideal: 55, actual: 65 },
    { day: 'Day 9', ideal: 40, actual: 45 },
    { day: 'Day 11', ideal: 25, actual: 35 },
    { day: 'Today', ideal: 10, actual: 35 },
  ];

  const aiInsights = [
    'Sprint velocity is 15% above average',
    'High-priority tasks need attention',
    '2 blockers identified in backend team',
    'Estimated completion: 3 days ahead'
  ];

  const meetingNotes = [
    {
      title: 'Daily Standup - Jan 20',
      summary: 'Team discussed authentication implementation progress...',
      actionItems: ['Review PR #234', 'Update documentation']
    },
    {
      title: 'Sprint Planning - Jan 15', 
      summary: 'Planned 34 story points for current sprint...',
      actionItems: ['Set up CI/CD', 'Design review meeting']
    }
  ];

  if (isMobile) {
    return (
      <>
        {/* Mobile Overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
        
        {/* Mobile Sidebar */}
        <div className={`fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 z-50 transform transition-transform duration-300 lg:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Sprint Analytics</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Sprint Progress */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">{sprint.name}</h3>
                  <Target className="w-4 h-4 text-blue-500" />
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium text-gray-900">{sprint.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${sprint.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{sprint.velocity}</div>
                    <div className="text-xs text-blue-600">Velocity</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">7d</div>
                    <div className="text-xs text-purple-600">Days Left</div>
                  </div>
                </div>
              </div>

              {/* AI Insights */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">AI Insights</h3>
                  <Zap className="w-4 h-4 text-yellow-500" />
                </div>
                
                <div className="space-y-3">
                  {aiInsights.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Meeting Notes */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">Meeting Notes</h3>
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
                
                <div className="space-y-4">
                  {meetingNotes.map((note, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{note.title}</h4>
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{note.summary}</p>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-700">Action Items:</p>
                        {note.actionItems.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center space-x-1">
                            <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                            <p className="text-xs text-gray-600">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="hidden xl:flex w-80 bg-white border-l border-gray-200 flex-col min-h-0">
      {/* Sprint Progress */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">{sprint.name}</h3>
          <Target className="w-4 h-4 text-blue-500" />
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-900">{sprint.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${sprint.progress}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{sprint.velocity}</div>
            <div className="text-xs text-blue-600">Velocity</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600">7d</div>
            <div className="text-xs text-purple-600">Days Left</div>
          </div>
        </div>
      </div>

      {/* Burndown Chart */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Burndown Chart</h3>
          <TrendingUp className="w-4 h-4 text-green-500" />
        </div>
        
        <div className="relative h-32 bg-gray-50 rounded-lg p-3">
          <svg className="w-full h-full" viewBox="0 0 200 80">
            {/* Ideal line */}
            <polyline
              fill="none"
              stroke="#d1d5db"
              strokeWidth="2"
              strokeDasharray="4,4"
              points="10,10 190,70"
            />
            {/* Actual line */}
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              points="10,10 50,18 90,28 130,42 170,52 190,58"
            />
            <circle cx="190" cy="58" r="3" fill="#3b82f6" />
          </svg>
          <div className="absolute bottom-1 left-1 text-xs text-gray-500">Start</div>
          <div className="absolute bottom-1 right-1 text-xs text-gray-500">End</div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">AI Insights</h3>
          <Zap className="w-4 h-4 text-yellow-500" />
        </div>
        
        <div className="space-y-3">
          {aiInsights.map((insight, index) => (
            <div key={index} className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-700">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-generated Meeting Notes */}
      <div className="flex-1 p-6 overflow-y-auto min-h-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Meeting Notes</h3>
          <FileText className="w-4 h-4 text-blue-500" />
        </div>
        
        <div className="space-y-4">
          {meetingNotes.map((note, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">{note.title}</h4>
                <ChevronRight className="w-3 h-3 text-gray-400" />
              </div>
              <p className="text-xs text-gray-600 mb-2">{note.summary}</p>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-700">Action Items:</p>
                {note.actionItems.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center space-x-1">
                    <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                    <p className="text-xs text-gray-600">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;