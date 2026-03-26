import { GoogleGenAI, Type, ThinkingLevel, Modality } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY as string;

export const getGeminiModel = (modelName: string = "gemini-3-flash-preview") => {
  const ai = new GoogleGenAI({ apiKey });
  return ai;
};

export const analyzeMealImage = async (base64Image: string, mimeType: string) => {
  const ai = getGeminiModel("gemini-3.1-pro-preview");
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: "Analyze this meal. Provide estimated calories, macronutrients (protein, carbs, fats), and a brief health assessment. Return the result in JSON format.",
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          calories: { type: Type.NUMBER },
          macros: {
            type: Type.OBJECT,
            properties: {
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fats: { type: Type.NUMBER },
            },
            required: ["protein", "carbs", "fats"],
          },
          assessment: { type: Type.STRING },
          items: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["calories", "macros", "assessment", "items"],
      },
    },
  });
  return JSON.parse(response.text || "{}");
};

export const generateHealthAdvice = async (userProfile: any, recentLogs: any[]) => {
  const ai = getGeminiModel("gemini-3.1-pro-preview");
  const prompt = `User Profile: ${JSON.stringify(userProfile)}\nRecent Health Logs: ${JSON.stringify(recentLogs)}\nProvide personalized health advice and wellness plan based on this data. Use Google Search for the latest health trends if needed.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  return response.text;
};

export const generateWellnessImage = async (prompt: string) => {
  const ai = getGeminiModel("gemini-3.1-flash-image-preview");
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: {
      parts: [{ text: `Create a high-quality wellness/health related image: ${prompt}` }],
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
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const textToSpeech = async (text: string) => {
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
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};
