import { useEffect, useState } from "react";
import useSpeechToText, { ResultType } from "react-hook-speech-to-text";
import { TooltipButton } from "@/components/tooltip-button";
import { CircleStop, Loader, Mic, RefreshCw, Save } from "lucide-react";
import { GetUserAnswersForFollowUpQuestions } from "@/AllDatabaseMethods/toGetFollowUpAnswer/toGetFollowUpQuestionAnswer";
import { toast } from "sonner";
import { SaveModal } from "@/components/save-modal";
import { updateUserAnswerInFollowUp } from "@/AllDatabaseMethods/all-Update-Methods/udpate-follow-up";
import { generateResult, initialize } from "@/AI-Request/AI-API-CALLS";
import { useParams } from "react-router-dom";

type Props = {
  parentQuestion: string;
  Question: string;
  answer: string;
  onAnswerSaved?: () => void;
};



const GETFOLLOWUP = ({ Question, answer, parentQuestion, onAnswerSaved }: Props) => {
  const { 
    interimResult, 
    isRecording, 
    results, 
    startSpeechToText, 
    stopSpeechToText,
    error
  } = useSpeechToText({ 
    continuous: true, 
    useLegacyResults: false,
    crossBrowser: true,
    timeout: 10000,
    speechRecognitionProperties: {
      lang: 'en-US',
      interimResults: true,
      maxAlternatives: 1
    }
  });
  
  // Log any speech recognition errors
  useEffect(() => {
    if (error) {
      console.error("Speech recognition error:", error);
      toast.error("Microphone error: " + error);
    }
  }, [error]);
  const [userAnswer, setUserAnswer] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const { interviewId } = useParams<{ interviewId: string }>();

  useEffect(() => {
    initialize(setIsAiGenerating);
    
    // Check if browser supports speech recognition
    const isSpeechRecognitionSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    console.log("Speech recognition supported:", isSpeechRecognitionSupported);
  }, []);

  // Store the recording state in session storage to persist across tab switches
  const storageKey = `followup-recording-${interviewId}-${parentQuestion}-${Question}`;
  
  // Load any in-progress recording from session storage
  useEffect(() => {
    const savedState = sessionStorage.getItem(storageKey);
    if (savedState) {
      try {
        const { text } = JSON.parse(savedState);
        if (text && text.length > 0) {
          setUserAnswer(text);
          // Don't automatically start recording again, but keep the text
          console.log("Restored in-progress recording:", text);
        }
      } catch (e) {
        console.error("Error parsing saved recording state:", e);
      }
    }
  }, [storageKey]);
  
  // Save recording state to session storage when it changes
  useEffect(() => {
    if (!saved && userAnswer) {
      sessionStorage.setItem(storageKey, JSON.stringify({ 
        text: userAnswer, 
        isRecording 
      }));
    } else if (saved) {
      // Clear the session storage when saved
      sessionStorage.removeItem(storageKey);
    }
  }, [userAnswer, isRecording, saved, storageKey]);
  
  // Check if we have a saved answer in the database
  useEffect(() => {
    (async () => {
      try {
        const result = await GetUserAnswersForFollowUpQuestions(interviewId, Question, parentQuestion);
        
        if (result.answers?.length) {
          // We have a saved answer in the database
          setUserAnswer(result.answers[0]);
          setSaved(true);
          // Clear any session storage
          sessionStorage.removeItem(storageKey);
        } else if (result.isPending && !userAnswer) {
          // We have a pending answer (user started but didn't save)
          // Only set empty if we don't already have text from session storage
          setUserAnswer("");
          setSaved(false);
        }
        console.log("Follow-up answers for", Question, ":", result);
      } catch (error) {
        console.error("Error fetching follow-up answers:", error);
      }
    })();
  }, [interviewId, Question, parentQuestion, storageKey]);

  // Sync interim speech text
  useEffect(() => {
    const combined = results
      .filter((r): r is ResultType => typeof r !== "string")
      .map((r) => r.transcript)
      .join(" ");
    setUserAnswer(combined);
  }, [results]);

  const recordUserAnswer = async () => {
    try {
      if (isRecording) {
        console.log("Stopping speech recognition");
        stopSpeechToText();
        if (userAnswer.length < 30) {
          toast.error("Your answer should be at least 30 characters.");
        }
      } else {
        console.log("Starting speech recognition");
        // Request microphone permission if needed
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log("Microphone permission granted");
          } catch (err) {
            console.error("Microphone permission denied:", err);
            toast.error("Please allow microphone access to record your answer");
            return;
          }
        }
        
        // Start speech recognition
        await startSpeechToText();
        toast.success("Recording started. Speak now...");
      }
    } catch (err) {
      console.error("Error in recordUserAnswer:", err);
      toast.error("Failed to access microphone. Please check your browser settings.");
    }
  };
  
  const recordNewAnswer = async () => {
    try {
      console.log("Starting new recording");
      setUserAnswer("");
      
      // Stop any existing recording
      if (isRecording) {
        stopSpeechToText();
      }
      
      // Request microphone permission if needed
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log("Microphone permission granted");
        } catch (err) {
          console.error("Microphone permission denied:", err);
          toast.error("Please allow microphone access to record your answer");
          return;
        }
      }
      
      // Start new recording
      await startSpeechToText();
      setSaved(false);
      toast.success("New recording started. Speak now...");
    } catch (err) {
      console.error("Error in recordNewAnswer:", err);
      toast.error("Failed to start new recording. Please check your microphone.");
    }
  };

  const saveUserAnswer = async () => {
    setLoading(true);
    try {
      // Validate answer length
      if (userAnswer.length < 30) {
        toast.error("Your answer should be at least 30 characters.");
        setLoading(false);
        return;
      }
      
      // Get AI feedback
      const result = await generateResult(Question, answer, userAnswer);
      if (!result) throw new Error("No AI result");
      
      // Update the follow-up question with user's answer
      await updateUserAnswerInFollowUp(interviewId!, parentQuestion, userAnswer,result.feedback ,result.rating , Question );
      
      toast.success("Follow-up answer saved successfully!");
      setSaved(true);
      
      // Clear any session storage for this follow-up
      sessionStorage.removeItem(storageKey);
      
      // Notify parent component that answer was saved
      if (onAnswerSaved) {
        onAnswerSaved();
      }
      // Keep the user answer visible after saving
      
      // Stop recording if it's still active
      if (isRecording) {
        stopSpeechToText();
      }
    } catch (error) {
      console.error("Error saving follow-up answer:", error);
      toast.error("Failed to save follow-up answer. Please try again.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <div className="mt-6 w-full">
      
      
      <div className={`w-full mt-4 p-4 border rounded-md ${isRecording ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Your Answer:</h2>
          {isRecording && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full animate-pulse">
              Recording...
            </span>
          )}
        </div>
        
        <p className="text-sm mt-2 text-gray-700 min-h-[50px]">
          {userAnswer || "Start recording to see your answer here"}
        </p>
        
        {interimResult && !saved && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded">
            <p className="text-sm text-blue-700">
              <strong>Current Speech:</strong> {interimResult}
            </p>
          </div>
        )}
        
        {saved && (
          <div className="flex items-center text-green-600">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-xs font-medium">Saved</p>
      </div>
        )}
        
        {!isRecording && !saved && userAnswer && (
          <p className="text-xs text-gray-500 mt-2">
            {userAnswer.length < 30 
              ? `Need ${30 - userAnswer.length} more characters to save` 
              : "Ready to save your answer"}
          </p>
        )}
      </div>
      <SaveModal isOpen={open} onClose={() => setOpen(false)} onConfirm={saveUserAnswer} loading={loading}/>
      
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {!saved && (
          <>
            <TooltipButton 
              content={isRecording ? "Stop Recording" : "Start Recording"} 
              icon={isRecording ? <CircleStop className="text-red-500 animate-pulse" /> : <Mic />} 
              onClick={recordUserAnswer}
              className={isRecording ? "border-red-500" : ""}
            />
            <TooltipButton 
              content="Record Again" 
              icon={<RefreshCw />} 
              onClick={recordNewAnswer} 
              disabled={isRecording}
            />
            <TooltipButton 
              content="Save Result" 
              icon={isAiGenerating ? <Loader className="animate-spin" /> : <Save />} 
              onClick={() => setOpen(true)} 
              disabled={userAnswer.length < 30 || isRecording}
            />
          </>
        )}
        {isRecording && (
          <div className="w-full text-center mt-2">
            <p className="text-xs text-red-500 animate-pulse">Recording in progress... Speak clearly.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GETFOLLOWUP;
