import React, { useState, useRef } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { analyzeMealImage } from '../lib/gemini';
import { Camera, Upload, Loader2, Apple, Zap, Flame, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const MealAnalyzer: React.FC = () => {
  const [user] = useAuthState(auth);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image || !user) return;
    setLoading(true);
    try {
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];
      const result = await analyzeMealImage(base64Data, mimeType);
      setAnalysis(result);

      // Save to Firestore
      await addDoc(collection(db, `users/${user.uid}/mealAnalyses`), {
        uid: user.uid,
        imageUrl: image,
        analysis: result.assessment,
        calories: result.calories,
        macros: result.macros,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Meal Analysis</h1>
        <p className="text-gray-500 mt-1">Upload a photo of your meal for instant nutritional insights.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative",
              image ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50"
            )}
          >
            {image ? (
              <>
                <img src={image} alt="Meal" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Upload className="w-12 h-12 text-white" />
                </div>
              </>
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-blue-600" />
                </div>
                <p className="font-semibold text-gray-900">Click to upload or drag & drop</p>
                <p className="text-sm text-gray-500 mt-1">Support JPG, PNG up to 5MB</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              className="hidden" 
              accept="image/*" 
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!image || loading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Analyzing Meal...
              </>
            ) : (
              <>
                <Zap className="w-6 h-6" />
                Analyze Nutrition
              </>
            )}
          </button>
        </div>

        <div className="space-y-6">
          {analysis ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
                  <Flame className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Total Calories</p>
                  <h3 className="text-3xl font-bold text-gray-900">{analysis.calories} kcal</h3>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-orange-50 rounded-2xl text-center">
                  <p className="text-xs text-orange-600 font-bold mb-1">PROTEIN</p>
                  <p className="text-xl font-bold text-gray-900">{analysis.macros.protein}g</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl text-center">
                  <p className="text-xs text-blue-600 font-bold mb-1">CARBS</p>
                  <p className="text-xl font-bold text-gray-900">{analysis.macros.carbs}g</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-2xl text-center">
                  <p className="text-xs text-purple-600 font-bold mb-1">FATS</p>
                  <p className="text-xl font-bold text-gray-900">{analysis.macros.fats}g</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <Apple className="w-5 h-5 text-red-500" />
                  Health Assessment
                </h4>
                <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl italic">
                  "{analysis.assessment}"
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-gray-900">Detected Items</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.items.map((item: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full bg-gray-50 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Loader2 className={cn("w-10 h-10 text-gray-300", loading && "animate-spin text-blue-600")} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Awaiting Analysis</h3>
              <p className="text-gray-500 max-w-xs">
                Upload a photo to see detailed nutritional breakdown and AI health insights.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
