import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  Timestamp,
  writeBatch,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { Task, TeamMember, Sprint, MeetingParticipant } from '../types';

// Collections
const COLLECTIONS = {
  TASKS: 'tasks',
  TEAM_MEMBERS: 'teamMembers',
  SPRINTS: 'sprints',
  MEETINGS: 'meetings',
  MEETING_PARTICIPANTS: 'meetingParticipants'
};

// Task operations
export const taskService = {
  // Get all tasks
  getTasks: async (): Promise<Task[]> => {
    const tasksRef = collection(db, COLLECTIONS.TASKS);
    const q = query(tasksRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dueDate: doc.data().dueDate?.toDate?.()?.toISOString?.()?.split('T')[0] || doc.data().dueDate
    })) as Task[];
  },

  // Listen to tasks in real-time
  listenToTasks: (callback: (tasks: Task[]) => void) => {
    const tasksRef = collection(db, COLLECTIONS.TASKS);
    const q = query(tasksRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate?.()?.toISOString?.()?.split('T')[0] || doc.data().dueDate
      })) as Task[];
      callback(tasks);
    });
  },

  // Add new task
  addTask: async (task: Omit<Task, 'id'>): Promise<string> => {
    const tasksRef = collection(db, COLLECTIONS.TASKS);
    const taskData = {
      ...task,
      dueDate: Timestamp.fromDate(new Date(task.dueDate)),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(tasksRef, taskData);
    return docRef.id;
  },

  // Update task
  updateTask: async (taskId: string, updates: Partial<Task>): Promise<void> => {
    const taskRef = doc(db, COLLECTIONS.TASKS, taskId);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now()
    };
    
    if (updates.dueDate) {
      updateData.dueDate = Timestamp.fromDate(new Date(updates.dueDate));
    }
    
    await updateDoc(taskRef, updateData);
  },

  // Delete task
  deleteTask: async (taskId: string): Promise<void> => {
    const taskRef = doc(db, COLLECTIONS.TASKS, taskId);
    await deleteDoc(taskRef);
  },

  // Update task status (for Kanban drag & drop)
  updateTaskStatus: async (taskId: string, status: Task['status']): Promise<void> => {
    const taskRef = doc(db, COLLECTIONS.TASKS, taskId);
    await updateDoc(taskRef, {
      status,
      updatedAt: Timestamp.now()
    });
  }
};

// Team member operations
export const teamService = {
  // Get all team members
  getTeamMembers: async (): Promise<TeamMember[]> => {
    const membersRef = collection(db, COLLECTIONS.TEAM_MEMBERS);
    const snapshot = await getDocs(membersRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TeamMember[];
  },

  // Listen to team members in real-time
  listenToTeamMembers: (callback: (members: TeamMember[]) => void) => {
    const membersRef = collection(db, COLLECTIONS.TEAM_MEMBERS);
    
    return onSnapshot(membersRef, (snapshot) => {
      const members = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TeamMember[];
      callback(members);
    });
  },

  // Add team member
  addTeamMember: async (member: Omit<TeamMember, 'id'>): Promise<string> => {
    const membersRef = collection(db, COLLECTIONS.TEAM_MEMBERS);
    const memberData = {
      ...member,
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(membersRef, memberData);
    return docRef.id;
  },

  // Update team member status
  updateMemberStatus: async (memberId: string, status: TeamMember['status']): Promise<void> => {
    const memberRef = doc(db, COLLECTIONS.TEAM_MEMBERS, memberId);
    await updateDoc(memberRef, {
      status,
      lastSeen: Timestamp.now()
    });
  }
};

// Sprint operations
export const sprintService = {
  // Get current sprint
  getCurrentSprint: async (): Promise<Sprint | null> => {
    const sprintsRef = collection(db, COLLECTIONS.SPRINTS);
    const q = query(sprintsRef, where('isActive', '==', true));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate?.toDate?.()?.toISOString?.()?.split('T')[0] || doc.data().startDate,
      endDate: doc.data().endDate?.toDate?.()?.toISOString?.()?.split('T')[0] || doc.data().endDate
    } as Sprint;
  },

  // Listen to current sprint
  listenToCurrentSprint: (callback: (sprint: Sprint | null) => void) => {
    const sprintsRef = collection(db, COLLECTIONS.SPRINTS);
    const q = query(sprintsRef, where('isActive', '==', true));
    
    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        callback(null);
        return;
      }
      
      const doc = snapshot.docs[0];
      const sprint = {
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate?.()?.toISOString?.()?.split('T')[0] || doc.data().startDate,
        endDate: doc.data().endDate?.toDate?.()?.toISOString?.()?.split('T')[0] || doc.data().endDate
      } as Sprint;
      callback(sprint);
    });
  },

  // Create new sprint
  createSprint: async (sprint: Omit<Sprint, 'id'>): Promise<string> => {
    const sprintsRef = collection(db, COLLECTIONS.SPRINTS);
    const sprintData = {
      ...sprint,
      startDate: Timestamp.fromDate(new Date(sprint.startDate)),
      endDate: Timestamp.fromDate(new Date(sprint.endDate)),
      createdAt: Timestamp.now(),
      isActive: true
    };
    
    const docRef = await addDoc(sprintsRef, sprintData);
    return docRef.id;
  },

  // Update sprint progress
  updateSprintProgress: async (sprintId: string, progress: number, velocity: number): Promise<void> => {
    const sprintRef = doc(db, COLLECTIONS.SPRINTS, sprintId);
    await updateDoc(sprintRef, {
      progress,
      velocity,
      updatedAt: Timestamp.now()
    });
  }
};

// Meeting operations
export const meetingService = {
  // Get meeting participants
  getMeetingParticipants: async (): Promise<MeetingParticipant[]> => {
    const participantsRef = collection(db, COLLECTIONS.MEETING_PARTICIPANTS);
    const snapshot = await getDocs(participantsRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MeetingParticipant[];
  },

  // Listen to meeting participants
  listenToMeetingParticipants: (callback: (participants: MeetingParticipant[]) => void) => {
    const participantsRef = collection(db, COLLECTIONS.MEETING_PARTICIPANTS);
    
    return onSnapshot(participantsRef, (snapshot) => {
      const participants = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MeetingParticipant[];
      callback(participants);
    });
  },

  // Update participant status
  updateParticipantStatus: async (participantId: string, updates: Partial<MeetingParticipant>): Promise<void> => {
    const participantRef = doc(db, COLLECTIONS.MEETING_PARTICIPANTS, participantId);
    await updateDoc(participantRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }
};

// Initialize sample data (run once)
export const initializeSampleData = async (): Promise<void> => {
  try {
    // Check if data already exists
    const tasksSnapshot = await getDocs(collection(db, COLLECTIONS.TASKS));
    if (!tasksSnapshot.empty) {
      console.log('Sample data already exists');
      return;
    }

    const batch = writeBatch(db);

    // Add sample sprint
    const sprintRef = doc(collection(db, COLLECTIONS.SPRINTS));
    batch.set(sprintRef, {
      name: 'Sprint 3 - Q1 2025',
      startDate: Timestamp.fromDate(new Date('2025-01-15')),
      endDate: Timestamp.fromDate(new Date('2025-01-29')),
      progress: 65,
      velocity: 42,
      isActive: true,
      createdAt: Timestamp.now()
    });

    // Add sample meeting participants
    const participantsData = [
      // No dummy participants - only real users will be added when they join meetings
    ];

    participantsData.forEach(participant => {
      const participantRef = doc(collection(db, COLLECTIONS.MEETING_PARTICIPANTS));
      batch.set(participantRef, participant);
    });

    // Commit the batch
    await batch.commit();
    console.log('Sample data initialized successfully');
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
};

// Create demo user account for authentication
export const createDemoUser = async (): Promise<void> => {
  try {
    // Try to create the demo user in Firebase Authentication
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, 'demo@autoscrum.ai', 'demo123');
      console.log('Demo user created in Firebase Auth');
    } catch (error: any) {
      // If user already exists, that's fine
      if (error.code !== 'auth/email-already-in-use') {
        throw error;
      }
      console.log('Demo user already exists in Firebase Auth');
      return; // Exit early if user already exists
    }

    // Create Firestore documents for the demo user
    if (userCredential) {
      const { user } = userCredential;
      
      // Update user profile
      await updateProfile(user, {
        displayName: 'Demo User',
        photoURL: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
      });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: 'Demo User',
        photoURL: user.photoURL,
        status: 'offline',
        role: 'Developer',
        createdAt: Timestamp.now(),
        lastSeen: Timestamp.now()
      });

      // Add to team members collection
      await setDoc(doc(db, 'teamMembers', user.uid), {
        id: user.uid,
        name: 'Demo User',
        avatar: user.photoURL,
        status: 'offline',
        role: 'Developer',
        createdAt: Timestamp.now(),
        lastSeen: Timestamp.now()
      });

      console.log('Demo user Firestore documents created');
    }
  } catch (error) {
    console.error('Error creating demo user:', error);
  }
};