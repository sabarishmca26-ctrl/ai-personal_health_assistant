import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { User, Scale, Ruler, Calendar, Save, Loader2, CheckCircle2, Bell } from 'lucide-react';
import { UserProfile } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { ReminderManager } from './ReminderManager';

export const Profile: React.FC = () => {
  const [user] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    height: '',
    targetAge: '',
    targetWeight: '',
    targetHeight: '',
    displayName: ''
  });

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(data);
        setFormData({
          age: data.age?.toString() || '',
          weight: data.weight?.toString() || '',
          height: data.height?.toString() || '',
          targetAge: data.targetAge?.toString() || '',
          targetWeight: data.targetWeight?.toString() || '',
          targetHeight: data.targetHeight?.toString() || '',
          displayName: data.displayName || ''
        });
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSuccess(false);

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        age: formData.age ? parseInt(formData.age) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        targetAge: formData.targetAge ? parseInt(formData.targetAge) : null,
        targetWeight: formData.targetWeight ? parseFloat(formData.targetWeight) : null,
        targetHeight: formData.targetHeight ? parseFloat(formData.targetHeight) : null,
        displayName: formData.displayName,
        updatedAt: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const calculateBMI = () => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height) / 100; // convert cm to m
    if (weight > 0 && height > 0) {
      return (weight / (height * height)).toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (bmi < 25) return { label: 'Normal weight', color: 'text-green-600', bg: 'bg-green-50' };
    if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { label: 'Obese', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const bmi = calculateBMI();
  const bmiValue = bmi ? parseFloat(bmi) : null;
  const bmiCategory = bmiValue ? getBMICategory(bmiValue) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
        <p className="text-gray-500 mt-1">Manage your personal health information for better AI insights.</p>
      </header>

      {bmiValue && (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn("p-6 rounded-3xl border flex items-center justify-between", bmiCategory?.bg, "border-opacity-50")}
        >
          <div>
            <p className="text-sm font-medium opacity-70">Your Body Mass Index (BMI)</p>
            <h2 className={cn("text-4xl font-black mt-1", bmiCategory?.color)}>{bmiValue}</h2>
            <p className={cn("text-sm font-bold mt-1 uppercase tracking-wider", bmiCategory?.color)}>
              {bmiCategory?.label}
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs opacity-50 max-w-[200px]">
              BMI is a simple index of weight-for-height that is commonly used to classify underweight, overweight and obesity in adults.
            </p>
          </div>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Display Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Your name"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                Age
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="e.g. 25"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Scale className="w-4 h-4 text-purple-500" />
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="e.g. 70.5"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Ruler className="w-4 h-4 text-green-500" />
                Height (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="e.g. 175"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              Health Goals
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-400" />
                  Target Age
                </label>
                <input
                  type="number"
                  value={formData.targetAge}
                  onChange={(e) => setFormData({ ...formData, targetAge: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="e.g. 90"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-purple-400" />
                  Target Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.targetWeight}
                  onChange={(e) => setFormData({ ...formData, targetWeight: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="e.g. 65"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-green-400" />
                  Target Height (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.targetHeight}
                  onChange={(e) => setFormData({ ...formData, targetHeight: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="e.g. 175"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {success && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-green-600 font-medium text-sm"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Profile updated successfully!
                </motion.div>
              )}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-100"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm"
      >
        <ReminderManager />
      </motion.div>

      <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
        <h3 className="font-bold text-blue-900 mb-2">Why provide this information?</h3>
        <p className="text-sm text-blue-700 leading-relaxed">
          Providing your age, weight, and height allows Healix to calculate more accurate nutritional needs, 
          BMR (Basal Metabolic Rate), and provide personalized health recommendations tailored specifically to your body type.
        </p>
      </div>
    </motion.div>
  );
};
