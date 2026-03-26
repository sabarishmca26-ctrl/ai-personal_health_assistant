import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Footprints, Droplets, Smile, Calendar, Trash2, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { HealthLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { deleteDoc, doc } from 'firebase/firestore';

export const ActivityHistory: React.FC = () => {
  const [user] = useAuthState(auth);
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMood, setFilterMood] = useState('All');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, `users/${user.uid}/healthLogs`),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as HealthLog[];
      setLogs(logData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/healthLogs`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (logId: string) => {
    if (!user || !window.confirm('Are you sure you want to delete this log?')) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/healthLogs`, logId));
    } catch (error) {
      console.error("Error deleting log:", error);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.date.includes(searchTerm) || (log.notes?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesMood = filterMood === 'All' || log.mood === filterMood;
    return matchesSearch && matchesMood;
  });

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'Great': return 'text-green-500 bg-green-50';
      case 'Good': return 'text-blue-500 bg-blue-50';
      case 'Okay': return 'text-yellow-500 bg-yellow-50';
      case 'Tired': return 'text-orange-500 bg-orange-50';
      case 'Stressed': return 'text-red-500 bg-red-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Activity History</h1>
        <p className="text-gray-500 mt-1">A detailed record of your health journey</p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by date or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterMood}
            onChange={(e) => setFilterMood(e.target.value)}
            className="flex-1 md:flex-none p-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          >
            <option value="All">All Moods</option>
            <option value="Great">Great</option>
            <option value="Good">Good</option>
            <option value="Okay">Okay</option>
            <option value="Tired">Tired</option>
            <option value="Stressed">Stressed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-6 text-sm font-bold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="p-6 text-sm font-bold text-gray-600 uppercase tracking-wider">Steps</th>
                <th className="p-6 text-sm font-bold text-gray-600 uppercase tracking-wider">Water (ml)</th>
                <th className="p-6 text-sm font-bold text-gray-600 uppercase tracking-wider">Mood</th>
                <th className="p-6 text-sm font-bold text-gray-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <AnimatePresence mode="popLayout">
                {filteredLogs.map((log) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{format(new Date(log.date), 'MMM dd, yyyy')}</p>
                          <p className="text-xs text-gray-400">{format(new Date(log.date), 'EEEE')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <Footprints className="w-4 h-4 text-orange-500" />
                        <span className="font-semibold text-gray-700">{(log.steps || 0).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-gray-700">{log.waterIntake || 0} ml</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                        getMoodColor(log.mood || 'Okay')
                      )}>
                        <Smile className="w-3 h-3" />
                        {log.mood || 'Okay'}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <button
                        onClick={() => log.id && handleDelete(log.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredLogs.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <Calendar className="w-12 h-12 opacity-20" />
                      <p className="font-medium">No activity logs found matching your filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
