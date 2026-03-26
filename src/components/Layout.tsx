import React from 'react';
import { auth, logout } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { LogOut, User, Activity, MessageSquare, Camera, Mic, ShieldCheck, History } from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, isAdmin }) => {
  const [user] = useAuthState(auth);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'history', label: 'Activity History', icon: History },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'meal', label: 'Meal Analysis', icon: Camera },
    { id: 'voice', label: 'Voice Assistant', icon: Mic },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin', icon: ShieldCheck });
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-[#E5E7EB] z-50 hidden md:flex flex-col">
        <div className="p-6 border-b border-[#E5E7EB]">
          <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            <Activity className="w-8 h-8 text-blue-600" />
            Healix
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                activeTab === item.id 
                  ? "bg-blue-50 text-blue-700 font-medium shadow-sm" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#E5E7EB]">
          {user && (
            <div className="flex items-center gap-3 px-4 py-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                {user.displayName?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.displayName}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-[#E5E7EB] z-50 flex md:hidden justify-around p-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex flex-col items-center p-2 rounded-lg",
              activeTab === item.id ? "text-blue-600" : "text-gray-500"
            )}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] mt-1">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
