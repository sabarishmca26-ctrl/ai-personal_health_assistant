import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Bell, Plus, Trash2, Clock, Calendar as CalendarIcon, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Reminder } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const ReminderManager: React.FC = () => {
  const [user] = useAuthState(auth);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newReminder, setNewReminder] = useState({
    activity: '',
    time: '08:00',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    enabled: true
  });

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, `users/${user.uid}/reminders`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Reminder[];
      setReminders(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/reminders`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAdd = async () => {
    if (!user || !newReminder.activity) return;

    try {
      await addDoc(collection(db, `users/${user.uid}/reminders`), {
        uid: user.uid,
        ...newReminder,
        createdAt: new Date().toISOString()
      });
      setShowAdd(false);
      setNewReminder({
        activity: '',
        time: '08:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        enabled: true
      });
    } catch (error) {
      console.error("Error adding reminder:", error);
    }
  };

  const toggleReminder = async (reminder: Reminder) => {
    if (!user || !reminder.id) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/reminders`, reminder.id), {
        enabled: !reminder.enabled
      });
    } catch (error) {
      console.error("Error toggling reminder:", error);
    }
  };

  const deleteReminder = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/reminders`, id));
    } catch (error) {
      console.error("Error deleting reminder:", error);
    }
  };

  const toggleDay = (day: string) => {
    setNewReminder(prev => ({
      ...prev,
      days: prev.days.includes(day) 
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          Health Reminders
        </h3>
        <button
          onClick={() => setShowAdd(true)}
          className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {reminders.map((reminder) => (
            <motion.div
              key={reminder.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "p-4 rounded-2xl border transition-all flex items-center justify-between",
                reminder.enabled ? "bg-white border-gray-100 shadow-sm" : "bg-gray-50 border-gray-200 opacity-60"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  reminder.enabled ? "bg-blue-50 text-blue-600" : "bg-gray-200 text-gray-500"
                )}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{reminder.activity}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span className="font-mono font-bold">{reminder.time}</span>
                    <span>•</span>
                    <span>{reminder.days.length === 7 ? 'Every day' : reminder.days.join(', ')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleReminder(reminder)}
                  className={cn(
                    "p-2 transition-all",
                    reminder.enabled ? "text-blue-600" : "text-gray-400"
                  )}
                >
                  {reminder.enabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
                <button
                  onClick={() => reminder.id && deleteReminder(reminder.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {reminders.length === 0 && !showAdd && (
          <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No reminders set yet.</p>
            <button 
              onClick={() => setShowAdd(true)}
              className="text-blue-600 text-sm font-bold mt-2 hover:underline"
            >
              Add your first reminder
            </button>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-2xl font-bold mb-6">New Reminder</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activity</label>
                <input
                  type="text"
                  placeholder="e.g., Drink Water, Take Vitamin"
                  value={newReminder.activity}
                  onChange={(e) => setNewReminder({ ...newReminder, activity: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  value={newReminder.time}
                  onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Repeat on</label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map(day => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                        newReminder.days.includes(day)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!newReminder.activity}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
