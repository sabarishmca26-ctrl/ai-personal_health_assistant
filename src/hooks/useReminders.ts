import { useState, useEffect, useRef } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Reminder } from '../types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const useReminders = () => {
  const [user] = useAuthState(auth);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const lastTriggered = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, `users/${user.uid}/reminders`),
      where('enabled', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Reminder[];
      setReminders(data);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (reminders.length === 0) return;

    const checkReminders = () => {
      const now = new Date();
      const currentTime = format(now, 'HH:mm');
      const currentDay = format(now, 'EEE'); // Mon, Tue, etc.
      const todayKey = format(now, 'yyyy-MM-dd');

      reminders.forEach(reminder => {
        if (!reminder.id) return;
        
        const isToday = reminder.days.includes(currentDay);
        const isTime = reminder.time === currentTime;
        const alreadyTriggeredToday = lastTriggered.current[reminder.id] === todayKey;

        if (isToday && isTime && !alreadyTriggeredToday) {
          toast.info(`Health Reminder: ${reminder.activity}`, {
            description: `It's ${reminder.time}. Time for your scheduled activity!`,
            duration: 10000,
            icon: '🔔'
          });
          lastTriggered.current[reminder.id] = todayKey;
        }
      });
    };

    // Check every 30 seconds to be safe
    const interval = setInterval(checkReminders, 30000);
    checkReminders(); // Initial check

    return () => clearInterval(interval);
  }, [reminders]);
};
