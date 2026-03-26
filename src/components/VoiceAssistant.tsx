import React, { useState, useEffect, useRef } from 'react';
import { getGeminiModel } from '../lib/gemini';
import { Mic, MicOff, Volume2, Loader2, Play, Pause, Video, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { GoogleGenAI, Modality } from '@google/genai';

export const VoiceAssistant: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleToggleMic = async () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      setTimeout(async () => {
        const mockPrompt = "Tell me a quick health tip.";
        setTranscript(mockPrompt);
        await getAiResponse(mockPrompt);
        setIsListening(false);
      }, 2000);
    }
  };

  const getAiResponse = async (prompt: string) => {
    try {
      const ai = getGeminiModel("gemini-3-flash-preview");
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are a helpful voice health assistant. Keep responses concise and friendly.",
        }
      });
      
      const text = response.text || "";
      setAiResponse(text);
      await playTts(text);
    } catch (error) {
      console.error("Voice AI error:", error);
    }
  };

  const playTts = async (text: string) => {
    setIsSpeaking(true);
    try {
      const ai = getGeminiModel("gemini-2.5-flash-preview-tts");
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const blob = await (await fetch(`data:audio/wav;base64,${base64Audio}`)).blob();
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play();
        }
      }
    } catch (error) {
      console.error("TTS error:", error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleGenerateImage = async () => {
    setGeneratingImage(true);
    try {
      const ai = getGeminiModel("gemini-3.1-flash-image-preview");
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: {
          parts: [{ text: "A high-quality, cinematic wellness image representing health, vitality, and peace." }],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
            imageSize: "1K",
          },
        },
      });
      
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setImageUrl(`data:image/png;base64,${part.inlineData.data}`);
        }
      }
    } catch (error) {
      console.error("Image generation error:", error);
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleGenerateVideo = async () => {
    setGeneratingVideo(true);
    try {
      const ai = getGeminiModel();
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: 'A peaceful zen garden with a waterfall, 4k, cinematic, health and wellness theme',
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        setVideoUrl(downloadLink);
      }
    } catch (error) {
      console.error("Video generation error:", error);
    } finally {
      setGeneratingVideo(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Voice Assistant</h1>
        <p className="text-gray-500 mt-1">Real-time health conversations powered by Gemini Live API.</p>
      </header>

      <div className="flex flex-col items-center justify-center py-12 space-y-12">
        <div className="relative">
          <motion.div
            animate={isListening || isSpeaking ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={cn(
              "w-48 h-48 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500",
              isListening ? "bg-red-500 shadow-red-200" : isSpeaking ? "bg-blue-500 shadow-blue-200" : "bg-white border-4 border-blue-50 shadow-blue-100"
            )}
          >
            <button
              onClick={handleToggleMic}
              className="w-40 h-40 rounded-full bg-white flex items-center justify-center shadow-inner"
            >
              {isListening ? (
                <MicOff className="w-16 h-16 text-red-500" />
              ) : isSpeaking ? (
                <Volume2 className="w-16 h-16 text-blue-500 animate-pulse" />
              ) : (
                <Mic className="w-16 h-16 text-blue-600" />
              )}
            </button>
          </motion.div>
          
          {(isListening || isSpeaking) && (
            <div className="absolute -inset-4 rounded-full border-2 border-blue-200 animate-ping opacity-20" />
          )}
        </div>

        <div className="max-w-2xl w-full space-y-6">
          {transcript && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">You said:</p>
              <p className="text-lg text-gray-800">{transcript}</p>
            </div>
          )}

          {aiResponse && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-600 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Volume2 className="w-24 h-24" />
              </div>
              <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-2">Healix:</p>
              <p className="text-xl leading-relaxed font-medium">{aiResponse}</p>
            </motion.div>
          )}
        </div>

        <div className="w-full max-w-2xl pt-8 border-t border-gray-100 space-y-12">
          {/* Image Generator */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Volume2 className="w-6 h-6 text-blue-600" />
                Wellness Image Generator
              </h3>
              <button
                onClick={handleGenerateImage}
                disabled={generatingImage}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {generatingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Generate Image
              </button>
            </div>
            
            <div className="aspect-video bg-gray-100 rounded-3xl overflow-hidden relative border-2 border-dashed border-gray-200">
              {imageUrl ? (
                <img src={imageUrl} alt="Wellness" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                  {generatingImage ? (
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                  ) : (
                    <p>No image generated yet. Click the button to create a wellness visualization.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Video Generator */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Video className="w-6 h-6 text-purple-600" />
                Wellness Visualizer (Video)
              </h3>
              <button
                onClick={handleGenerateVideo}
                disabled={generatingVideo}
                className="px-6 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {generatingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Generate Zen Video
              </button>
            </div>
            
            <div className="aspect-video bg-gray-900 rounded-3xl overflow-hidden relative group">
              {videoUrl ? (
                <video src={videoUrl} controls className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                  {generatingVideo ? (
                    <>
                      <Loader2 className="w-12 h-12 animate-spin mb-4 text-purple-500" />
                      <p className="font-medium text-white">Generating your personalized wellness video...</p>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <Video className="w-10 h-10 text-gray-600" />
                      </div>
                      <p className="text-white font-medium">No video generated yet</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};
