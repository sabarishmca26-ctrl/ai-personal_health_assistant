import React, { useState, useEffect, useRef } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, limit, doc, setDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getGeminiModel } from '../lib/gemini';
import { Send, Bot, User, Loader2, Search, MapPin } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, ChatHistory } from '../types';
import { cn } from '../lib/utils';

export const Chat: React.FC = () => {
  const [user] = useAuthState(auth);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, `users/${user.uid}/chatHistories`),
      orderBy('updatedAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as ChatHistory;
        setMessages(data.messages);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/chatHistories`);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const ai = getGeminiModel("gemini-3-flash-preview");
      
      // Heuristic to decide between Search and Maps (cannot be combined)
      const mapsKeywords = ['near', 'nearby', 'location', 'clinic', 'hospital', 'pharmacy', 'restaurant', 'gym', 'center', 'place', 'where', 'address', 'find'];
      const useMaps = mapsKeywords.some(kw => input.toLowerCase().includes(kw));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: newMessages.map(m => ({ role: m.role, parts: m.parts })),
        config: {
          systemInstruction: "You are Healix, a professional health assistant. Provide accurate, helpful, and empathetic health advice. Use Google Search for recent medical info and Google Maps for nearby health facilities.",
          tools: useMaps ? [{ googleMaps: {} }] : [{ googleSearch: {} }],
        },
      });

      const aiMessage: ChatMessage = { role: 'model', parts: [{ text: response.text || "I'm sorry, I couldn't process that." }] };
      const updatedMessages = [...newMessages, aiMessage];

      // Save to Firestore
      const chatRef = doc(collection(db, `users/${user.uid}/chatHistories`), 'main');
      await setDoc(chatRef, {
        uid: user.uid,
        messages: updatedMessages,
        updatedAt: new Date().toISOString(),
      });

    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Bot className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Healix Assistant</h2>
            <div className="flex items-center gap-2 text-xs text-green-500">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Online & Ready
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="p-2 rounded-lg bg-gray-50 text-gray-400" title="Search Grounding Enabled">
            <Search className="w-4 h-4" />
          </div>
          <div className="p-2 rounded-lg bg-gray-50 text-gray-400" title="Maps Grounding Enabled">
            <MapPin className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">How can I help you today?</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
              Ask me about nutrition, symptoms, exercise plans, or find nearby clinics.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-4", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              msg.role === 'user' ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
            )}>
              {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className={cn(
              "max-w-[80%] p-4 rounded-2xl shadow-sm",
              msg.role === 'user' ? "bg-blue-600 text-white rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
            )}>
              <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-inherit prose-strong:text-inherit">
                <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-gray-600" />
            </div>
            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm text-gray-500">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-6 bg-white border-t border-gray-100">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your health query..."
            className="w-full pl-6 pr-14 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-2 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
