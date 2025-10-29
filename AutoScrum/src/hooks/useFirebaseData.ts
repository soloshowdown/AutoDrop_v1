import { useState, useEffect } from 'react';
import { Task, TeamMember, Sprint, MeetingParticipant } from '../types';
import { taskService, teamService, sprintService, meetingService } from '../services/firebaseService';

export const useFirebaseTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = taskService.listenToTasks((newTasks) => {
      setTasks(newTasks);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      await taskService.updateTaskStatus(taskId, status);
    } catch (err) {
      setError('Failed to update task status');
      console.error('Error updating task status:', err);
    }
  };

  const addTask = async (task: Omit<Task, 'id'>) => {
    try {
      await taskService.addTask(task);
    } catch (err) {
      setError('Failed to add task');
      console.error('Error adding task:', err);
    }
  };

  return { tasks, loading, error, updateTaskStatus, addTask };
};

export const useFirebaseTeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = teamService.listenToTeamMembers((members) => {
      setTeamMembers(members);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateMemberStatus = async (memberId: string, status: TeamMember['status']) => {
    try {
      await teamService.updateMemberStatus(memberId, status);
    } catch (err) {
      setError('Failed to update member status');
      console.error('Error updating member status:', err);
    }
  };

  return { teamMembers, loading, error, updateMemberStatus };
};

export const useFirebaseSprint = () => {
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = sprintService.listenToCurrentSprint((currentSprint) => {
      setSprint(currentSprint);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateSprintProgress = async (sprintId: string, progress: number, velocity: number) => {
    try {
      await sprintService.updateSprintProgress(sprintId, progress, velocity);
    } catch (err) {
      setError('Failed to update sprint progress');
      console.error('Error updating sprint progress:', err);
    }
  };

  return { sprint, loading, error, updateSprintProgress };
};

export const useFirebaseMeetingParticipants = () => {
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = meetingService.listenToMeetingParticipants((newParticipants) => {
      setParticipants(newParticipants);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateParticipantStatus = async (participantId: string, updates: Partial<MeetingParticipant>) => {
    try {
      await meetingService.updateParticipantStatus(participantId, updates);
    } catch (err) {
      setError('Failed to update participant status');
      console.error('Error updating participant status:', err);
    }
  };

  return { participants, loading, error, updateParticipantStatus };
};