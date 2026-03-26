export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  age?: number;
  weight?: number;
  height?: number;
  targetAge?: number;
  targetWeight?: number;
  targetHeight?: number;
  goals?: string[];
  role?: 'admin' | 'patient';
  createdAt: string;
}

export interface HealthLog {
  id?: string;
  uid: string;
  date: string;
  steps?: number;
  waterIntake?: number;
  mood?: string;
  notes?: string;
}

export interface MealAnalysis {
  id?: string;
  uid: string;
  imageUrl: string;
  analysis: string;
  calories?: number;
  macros?: {
    protein: number;
    carbs: number;
    fats: number;
  };
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface ChatHistory {
  id?: string;
  uid: string;
  messages: ChatMessage[];
  updatedAt: string;
}

export interface Reminder {
  id?: string;
  uid: string;
  activity: string;
  time: string;
  days: string[];
  enabled: boolean;
  createdAt: string;
}
