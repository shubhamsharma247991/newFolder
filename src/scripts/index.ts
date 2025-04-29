import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Check if API key exists
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize the model
const genAI = new GoogleGenerativeAI(apiKey);

// Get the chat model
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
});

// Create a chat session with specific configuration
export const chatSession = model.startChat({
  generationConfig: {
    temperature: 0.9,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  }
});

// Helper function to send messages
export async function sendMessage(message: string) {
  try {
    const result = await chatSession.sendMessage(message);
    const response = await result.response;
    console.log("Gemini Output:", response.text()); // Log the output
    return response.text();
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}