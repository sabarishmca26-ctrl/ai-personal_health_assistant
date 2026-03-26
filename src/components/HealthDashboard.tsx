import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Activity, Droplets, Footprints, Moon, Plus, TrendingUp, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format } from 'date-fns';
import { HealthLog, UserProfile } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const HealthDashboard: React.FC = () => {
  const [user] = useAuthState(auth);
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showAddLog, setShowAddLog] = useState(false);
  const [newLog, setNewLog] = useState({ steps: 0, waterIntake: 0, mood: 'Good' });

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, `users/${user.uid}/healthLogs`),
      orderBy('date', 'desc'),
      limit(7)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as HealthLog[];
      setLogs(logData.reverse());
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/healthLogs`);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddLog = async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, `users/${user.uid}/healthLogs`), {
        uid: user.uid,
        date: format(new Date(), 'yyyy-MM-dd'),
        ...newLog,
        createdAt: serverTimestamp(),
      });
      setShowAddLog(false);
    } catch (error) {
      console.error("Error adding log:", error);
    }
  };

  const stats = [
    { label: 'Steps', value: logs[logs.length - 1]?.steps || 0, icon: Footprints, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Water', value: `${logs[logs.length - 1]?.waterIntake || 0}ml`, icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Mood', value: logs[logs.length - 1]?.mood || 'N/A', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Health Overview</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.displayName}</p>
        </div>
        <button
          onClick={() => setShowAddLog(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <Plus className="w-5 h-5" />
          Log Activity
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm"
          >
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", stat.bg)}>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Step Trends
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Calendar className="w-4 h-4" />
              Last 7 Days
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={logs}>
                <defs>
                  <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="steps" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorSteps)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-400" />
              Hydration
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={logs}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="waterIntake" stroke="#60a5fa" strokeWidth={3} dot={{ r: 4, fill: '#60a5fa' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {showAddLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-2xl font-bold mb-6">Log Daily Activity</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Steps</label>
                <input
                  type="number"
                  value={newLog.steps}
                  onChange={(e) => setNewLog({ ...newLog, steps: parseInt(e.target.value) })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Water Intake (ml)</label>
                <input
                  type="number"
                  value={newLog.waterIntake}
                  onChange={(e) => setNewLog({ ...newLog, waterIntake: parseInt(e.target.value) })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mood</label>
                <select
                  value={newLog.mood}
                  onChange={(e) => setNewLog({ ...newLog, mood: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                >
                  <option>Great</option>
                  <option>Good</option>
                  <option>Okay</option>
                  <option>Tired</option>
                  <option>Stressed</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowAddLog(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLog}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold"
              >
                Save Log
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
