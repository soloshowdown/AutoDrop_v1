import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface AuthUser extends User {
  displayName: string;
  photoURL: string;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const signup = async (email: string, password: string, name: string) => {
    try {
      setError(null);
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile
      await updateProfile(user, {
        displayName: name,
        photoURL: `https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000)}/pexels-photo-${Math.floor(Math.random() * 1000000)}.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop`
      });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: name,
        photoURL: user.photoURL,
        status: 'online',
        role: 'Developer',
        createdAt: Timestamp.now(),
        lastSeen: Timestamp.now()
      });

      // Add to team members collection
      await setDoc(doc(db, 'teamMembers', user.uid), {
        id: user.uid,
        name: name,
        avatar: user.photoURL,
        status: 'online',
        role: 'Developer',
        createdAt: Timestamp.now(),
        lastSeen: Timestamp.now()
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      // Update user status to online
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          status: 'online',
          lastSeen: Timestamp.now()
        });

        // Update team member status
        const teamMemberRef = doc(db, 'teamMembers', user.uid);
        await updateDoc(teamMemberRef, {
          status: 'online',
          lastSeen: Timestamp.now()
        });
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      if (currentUser) {
        try {
          // Update user status to offline
          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            await updateDoc(userRef, {
              status: 'offline',
              lastSeen: Timestamp.now()
            });
          }

          // Update team member status
          const teamMemberRef = doc(db, 'teamMembers', currentUser.uid);
          const teamMemberDoc = await getDoc(teamMemberRef);
          
          if (teamMemberDoc.exists()) {
            await updateDoc(teamMemberRef, {
              status: 'offline',
              lastSeen: Timestamp.now()
            });
          }
        } catch (docError) {
          console.error('Error updating user status on logout:', docError);
          // Continue with logout even if status update fails
        }
      }
      await signOut(auth);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Ensure user has required fields
        const authUser: AuthUser = {
          ...user,
          displayName: user.displayName || 'Anonymous User',
          photoURL: user.photoURL || `https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop`
        };
        setCurrentUser(authUser);

        // Update user status to online
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            await updateDoc(userRef, {
              status: 'online',
              lastSeen: Timestamp.now()
            });

            // Update team member status
            const teamMemberRef = doc(db, 'teamMembers', user.uid);
            const teamMemberDoc = await getDoc(teamMemberRef);
            
            if (teamMemberDoc.exists()) {
              await updateDoc(teamMemberRef, {
                status: 'online',
                lastSeen: Timestamp.now()
              });
            }
          }
        } catch (error) {
          console.error('Error updating user status:', error);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Handle page unload to set user offline
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            await updateDoc(userRef, {
              status: 'offline',
              lastSeen: Timestamp.now()
            });
          }

          const teamMemberRef = doc(db, 'teamMembers', currentUser.uid);
          const teamMemberDoc = await getDoc(teamMemberRef);
          
          if (teamMemberDoc.exists()) {
            await updateDoc(teamMemberRef, {
              status: 'offline',
              lastSeen: Timestamp.now()
            });
          }
        } catch (error) {
          console.error('Error updating user status on unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentUser]);

  const value = {
    currentUser,
    login,
    signup,
    logout,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};