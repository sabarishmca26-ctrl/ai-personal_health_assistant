import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { HealthDashboard } from './components/HealthDashboard';
import { Chat } from './components/Chat';
import { MealAnalyzer } from './components/MealAnalyzer';
import { VoiceAssistant } from './components/VoiceAssistant';
import { Profile } from './components/Profile';
import { ActivityHistory } from './components/ActivityHistory';
import { AdminDashboard } from './components/AdminDashboard';
import { Loader2, ShieldCheck } from 'lucide-react';
import { UserProfile } from './types';
import { Toaster } from 'sonner';
import { useReminders } from './hooks/useReminders';

export default function App() {
  const [user, loading, error] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profileLoading, setProfileLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useReminders();

  useEffect(() => {
    const checkProfile = async () => {
      if (user) {
        setProfileLoading(true);
        try {
          const profileRef = doc(db, 'users', user.uid);
          const profileSnap = await getDoc(profileRef);
          
          if (!profileSnap.exists()) {
            const newProfile: UserProfile = {
              uid: user.uid,
              displayName: user.displayName || 'User',
              email: user.email || '',
              createdAt: new Date().toISOString(),
              role: (user.email === 'sabarishmca26@gmail.com' || user.email === 'healix@healix.admin') ? 'admin' : 'patient'
            };
            await setDoc(profileRef, newProfile);
            setIsAdmin(newProfile.role === 'admin');
          } else {
            const data = profileSnap.data() as UserProfile;
            setIsAdmin(data.role === 'admin' || user.email === 'sabarishmca26@gmail.com' || user.email === 'healix@healix.admin');
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
        } finally {
          setProfileLoading(false);
        }
      }
    };
    checkProfile();
  }, [user]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center shadow-sm">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <p className="text-gray-500 font-medium animate-pulse">Initializing Healix...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center border border-red-100">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h2>
          <p className="text-gray-600 mb-6">{error.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const renderContent = () => {
    if (isAdmin && activeTab === 'admin') {
      return <AdminDashboard />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <HealthDashboard />;
      case 'history':
        return <ActivityHistory />;
      case 'chat':
        return <Chat />;
      case 'meal':
        return <MealAnalyzer />;
      case 'voice':
        return <VoiceAssistant />;
      case 'profile':
        return <Profile />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <HealthDashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={isAdmin}>
      <Toaster position="top-right" richColors closeButton />
      {renderContent()}
    </Layout>
  );
}
