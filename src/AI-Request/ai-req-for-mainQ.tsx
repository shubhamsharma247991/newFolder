import { toast } from 'sonner';
import { sendMessage } from '@/scripts/index';

// Define the shape of the job data
export interface JobData {
  position: string;
  description: string;
  experience: number;       // years of experience as number
  techStack: string;
}

/**
 * Cleans raw AI response text and parses it into a JSON array of question/answer objects.
 * @param responseText - The raw text returned by the AI model.
 * @returns Parsed array of { question, answer } objects.
 * @throws Error if no valid JSON array is found or parsing fails.
 */
const cleanAiResponse = (responseText: string): Array<{ question: string; answer: string }> => {
  try {
    let cleanText = responseText.trim();
    cleanText = cleanText.replace(/(```json|```|json|`)/g, '');
    const jsonArrayMatch = cleanText.match(/\[[\s\S]*\]/);
    if (!jsonArrayMatch) throw new Error('No JSON array found in response');
    cleanText = jsonArrayMatch[0].replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    cleanText = cleanText.replace(/\\"/g, '\\"').replace(/(?<!\\)"/g, '"');
    return JSON.parse(cleanText);
  } catch (error: any) {
    console.error('Original response:', responseText);
    console.error('Cleaning error:', error);
    throw new Error('Invalid JSON format: ' + error.message);
  }
};

/**
 * Generates technical interview questions for a given job profile by sending a prompt to the AI,
 * cleans the response, and returns the structured data.
 * Errors will trigger a toast notification.
 *
 * @param data - Job details including position, description, experience, and techStack.
 * @returns Promise resolving to an array of { question, answer } objects.
 */
export const generateAiResponse = async (
  data: JobData
): Promise<Array<{ question: string; answer: string }>> => {
  // convert numeric experience to string for prompt
  const experienceStr = `${data.experience}`;

  const prompt = `
    Generate a JSON array containing 5 technical interview questions with answers for a ${data.position} role.
    
    Job Information:
    - Job Position: ${data.position}
    - Job Description: ${data.description}
    - Years of Experience Required: ${experienceStr}
    - Tech Stacks: ${data.techStack}

    IMPORTANT: Return ONLY a valid JSON array with this exact structure:
    [
      {
        "question": "First question text here",
        "answer": "First answer text here"
      },
      {
        "question": "Second question text here",
        "answer": "Second answer text here"
      }
    ]

    The questions should assess skills in ${data.techStack} development, best practices, problem-solving, and experience handling complex requirements.
    
    DO NOT include any explanations, markdown formatting, code blocks, or additional text outside the JSON array.
    DO NOT use any special characters that would break JSON parsing.
    ENSURE all quotes are properly escaped within strings.
  `;

  try {
    // sendMessage returns the raw response text directly
    const rawText: string = await sendMessage(prompt);
    return cleanAiResponse(rawText);
  } catch (err: any) {
    console.error('Error generating AI response:', err);
    toast.error('Failed to generate interview questions. Please try again.');
    return [];
  }
};
