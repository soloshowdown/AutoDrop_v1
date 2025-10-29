import { TeamMember, Task, Sprint, MeetingParticipant } from '../types';

export const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    status: 'online',
    role: 'Product Manager'
  },
  {
    id: '2',
    name: 'Alex Rivera',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    status: 'online',
    role: 'Frontend Developer'
  },
  {
    id: '3',
    name: 'Maya Johnson',
    avatar: 'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    status: 'away',
    role: 'Backend Developer'
  },
  {
    id: '4',
    name: 'James Wilson',
    avatar: 'https://images.pexels.com/photos/3777943/pexels-photo-3777943.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    status: 'online',
    role: 'UX Designer'
  }
];

export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Implement user authentication',
    description: 'Add login/logout functionality with JWT tokens',
    assignee: mockTeamMembers[1],
    dueDate: '2025-01-25',
    priority: 'high',
    status: 'in-progress',
    storyPoints: 8
  },
  {
    id: '2',
    title: 'Design dashboard mockups',
    description: 'Create wireframes and high-fidelity designs',
    assignee: mockTeamMembers[3],
    dueDate: '2025-01-23',
    priority: 'medium',
    status: 'done',
    storyPoints: 5
  },
  {
    id: '3',
    title: 'Set up CI/CD pipeline',
    description: 'Configure automated testing and deployment',
    assignee: mockTeamMembers[2],
    dueDate: '2025-01-28',
    priority: 'medium',
    status: 'todo',
    storyPoints: 13
  },
  {
    id: '4',
    title: 'Write API documentation',
    description: 'Document all REST endpoints with examples',
    assignee: mockTeamMembers[0],
    dueDate: '2025-01-30',
    priority: 'low',
    status: 'todo',
    storyPoints: 3
  }
];

export const mockSprint: Sprint = {
  id: 'sprint-1',
  name: 'Sprint 3 - Q1 2025',
  startDate: '2025-01-15',
  endDate: '2025-01-29',
  progress: 65,
  velocity: 42
};

export const mockMeetingParticipants: MeetingParticipant[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    isMuted: false,
    isVideoOn: true
  },
  {
    id: '2',
    name: 'Alex Rivera',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    isMuted: true,
    isVideoOn: true
  },
  {
    id: '3',
    name: 'James Wilson',
    avatar: 'https://images.pexels.com/photos/3777943/pexels-photo-3777943.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    isMuted: false,
    isVideoOn: false
  }
];