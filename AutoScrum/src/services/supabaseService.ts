import { createClient } from '@supabase/supabase-js';
import { Task, TeamMember, Sprint, MeetingParticipant } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const taskService = {
  getTasks: async (): Promise<Task[]> => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:team_members!assignee_id(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      assignee: task.assignee as TeamMember,
      dueDate: task.due_date,
      priority: task.priority,
      status: task.status,
      storyPoints: task.story_points,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    })) as Task[];
  },

  listenToTasks: (callback: (tasks: Task[]) => void) => {
    const fetchTasks = async () => {
      const tasks = await taskService.getTasks();
      callback(tasks);
    };

    fetchTasks();

    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  addTask: async (task: Omit<Task, 'id'>): Promise<string> => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: task.title,
        description: task.description,
        assignee_id: task.assignee.id,
        due_date: task.dueDate,
        priority: task.priority,
        status: task.status,
        story_points: task.storyPoints
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  },

  updateTask: async (taskId: string, updates: Partial<Task>): Promise<void> => {
    const updateData: any = { updated_at: new Date().toISOString() };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.assignee !== undefined) updateData.assignee_id = updates.assignee.id;
    if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.storyPoints !== undefined) updateData.story_points = updates.storyPoints;

    const { error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId);

    if (error) throw error;
  },

  deleteTask: async (taskId: string): Promise<void> => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  },

  updateTaskStatus: async (taskId: string, status: Task['status']): Promise<void> => {
    const { error } = await supabase
      .from('tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) throw error;
  }
};

export const teamService = {
  getTeamMembers: async (): Promise<TeamMember[]> => {
    const { data, error } = await supabase
      .from('team_members')
      .select('*');

    if (error) throw error;
    return data || [];
  },

  listenToTeamMembers: (callback: (members: TeamMember[]) => void) => {
    const fetchMembers = async () => {
      const members = await teamService.getTeamMembers();
      callback(members);
    };

    fetchMembers();

    const channel = supabase
      .channel('team-members-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => {
        fetchMembers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  addTeamMember: async (member: Omit<TeamMember, 'id'>): Promise<string> => {
    const { data, error } = await supabase
      .from('team_members')
      .insert({
        name: member.name,
        avatar: member.avatar,
        status: member.status,
        role: member.role
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  },

  updateMemberStatus: async (memberId: string, status: TeamMember['status']): Promise<void> => {
    const { error } = await supabase
      .from('team_members')
      .update({ status, last_seen: new Date().toISOString() })
      .eq('id', memberId);

    if (error) throw error;
  }
};

export const sprintService = {
  getCurrentSprint: async (): Promise<Sprint | null> => {
    const { data, error } = await supabase
      .from('sprints')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      startDate: data.start_date,
      endDate: data.end_date,
      progress: data.progress,
      velocity: data.velocity,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  listenToCurrentSprint: (callback: (sprint: Sprint | null) => void) => {
    const fetchSprint = async () => {
      const sprint = await sprintService.getCurrentSprint();
      callback(sprint);
    };

    fetchSprint();

    const channel = supabase
      .channel('sprints-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sprints' }, () => {
        fetchSprint();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  createSprint: async (sprint: Omit<Sprint, 'id'>): Promise<string> => {
    const { data, error } = await supabase
      .from('sprints')
      .insert({
        name: sprint.name,
        start_date: sprint.startDate,
        end_date: sprint.endDate,
        progress: sprint.progress,
        velocity: sprint.velocity,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  },

  updateSprintProgress: async (sprintId: string, progress: number, velocity: number): Promise<void> => {
    const { error } = await supabase
      .from('sprints')
      .update({ progress, velocity, updated_at: new Date().toISOString() })
      .eq('id', sprintId);

    if (error) throw error;
  }
};

export const meetingService = {
  getMeetingParticipants: async (): Promise<MeetingParticipant[]> => {
    const { data, error } = await supabase
      .from('meeting_participants')
      .select('*');

    if (error) throw error;
    return (data || []).map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isMuted: p.is_muted,
      isVideoOn: p.is_video_on,
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }));
  },

  listenToMeetingParticipants: (callback: (participants: MeetingParticipant[]) => void) => {
    const fetchParticipants = async () => {
      const participants = await meetingService.getMeetingParticipants();
      callback(participants);
    };

    fetchParticipants();

    const channel = supabase
      .channel('meeting-participants-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_participants' }, () => {
        fetchParticipants();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  updateParticipantStatus: async (participantId: string, updates: Partial<MeetingParticipant>): Promise<void> => {
    const updateData: any = { updated_at: new Date().toISOString() };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.avatar !== undefined) updateData.avatar = updates.avatar;
    if (updates.isMuted !== undefined) updateData.is_muted = updates.isMuted;
    if (updates.isVideoOn !== undefined) updateData.is_video_on = updates.isVideoOn;

    const { error } = await supabase
      .from('meeting_participants')
      .update(updateData)
      .eq('id', participantId);

    if (error) throw error;
  }
};
