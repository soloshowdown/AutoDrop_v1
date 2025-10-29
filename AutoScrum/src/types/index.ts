export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
  role: string;
  createdAt?: any;
  lastSeen?: any;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: TeamMember;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'done';
  storyPoints: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  velocity: number;
  isActive?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface MeetingParticipant {
  id: string;
  name: string;
  avatar: string;
  isMuted: boolean;
  isVideoOn: boolean;
  createdAt?: any;
  updatedAt?: any;
}