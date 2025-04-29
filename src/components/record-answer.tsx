import { useAuth } from "@clerk/clerk-react";
import { CircleStop, Loader, Mic, RefreshCw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import useSpeechToText, { ResultType } from "react-hook-speech-to-text";
import { useParams } from "react-router-dom";
import { TooltipButton } from "@/components/tooltip-button";
import { toast } from "sonner";
import { SaveModal } from "@/components/save-modal";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase.cofig";
import { generateResult, initialize } from "@/AI-Request/AI-API-CALLS";
import { addFollowUpQuestion } from "@/AllDatabaseMethods/all-Add-Methods/all-add-methods";

interface RecordAnswerProps {
    question: { question: string; answer: string };
    followUp?: boolean;
    // *** MODIFIED: Callback now includes the saved answer text ***
    onAnswerSaved?: (savedAnswer: string) => void;
    // *** NEW: Prop for the initial answer passed from parent ***
    initialUserAnswer?: string;
}



export const RecordAnswer = ({
    question,
    followUp = false,
    onAnswerSaved,
    initialUserAnswer // *** Destructure new prop ***
}: RecordAnswerProps) => {
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
        timeout: 10000, // Consider if timeout needs adjustment
        speechRecognitionProperties: {
            lang: 'en-US',
            interimResults: true,
            maxAlternatives: 1 // Usually 1 is sufficient
        }
    });

    // Log any speech recognition errors
    useEffect(() => {
        if (error) {
            console.error("Speech recognition error:", error);
            toast.error("Microphone error: " + error);
        }
    }, [error]);

    // *** MODIFIED: Initialize state based on the prop ***
    const [userAnswer, setUserAnswer] = useState(initialUserAnswer || "");
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    const [open, setOpen] = useState(false); // For save confirmation modal
    const [loading, setLoading] = useState(false); // For save operation loading
    // *** MODIFIED: Initialize 'saved' based on whether an initial answer was provided ***
    const [saved, setSaved] = useState(!!initialUserAnswer);
    // Follow-up state remains local if only needed here after saving

    const { userId } = useAuth();
    const { interviewId } = useParams<{ interviewId: string }>();

    // Initialize the AI API module (only needs to run once)
    useEffect(() => {
        initialize(setIsAiGenerating);

        // Check browser support (good practice)
        const isSpeechRecognitionSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
        console.log("Speech recognition supported:", isSpeechRecognitionSupported);
        if (!isSpeechRecognitionSupported) {
            toast.error("Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari.");
        }
    }, []);


    // *** MODIFIED: Sync interim speech text - append to existing results ***
    useEffect(() => {
        // Combine previous transcripts with the latest ones
        const finalTranscript = results
            .map((result) => (result as ResultType).transcript)
            .join(" ");

        // Update state only if it differs significantly (optional optimization)
        if (finalTranscript) {
             setUserAnswer(finalTranscript);
        }

    }, [results]); // Only depends on results


    const recordUserAnswer = async () => {
        setSaved(false);

        try {
            if (isRecording) {
                console.log("Stopping speech recognition");
                await stopSpeechToText(); // Make sure stop is awaited if it's async
                if (userAnswer.trim().length < 30) { // Use trim()
                    toast.warning("Answer might be too short (less than 30 characters).");
                }
            } else {
                console.log("Starting speech recognition");
                // Request microphone permission (good practice, though might be redundant if already granted)
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    try {
                        await navigator.mediaDevices.getUserMedia({ audio: true });
                        console.log("Microphone permission is available.");
                    } catch (err) {
                        console.error("Microphone permission denied:", err);
                        toast.error("Microphone access denied. Please allow access in browser settings.");
                        return; // Don't proceed if permission denied
                    }
                } else {
                    toast.error("Your browser doesn't support microphone access.");
                    return;
                }

                await startSpeechToText();
                toast.success("Recording started...");
            }
        } catch (err) {
            console.error("Error during speech recording toggle:", err);
            toast.error("Failed to start/stop recording. Check console.");
            // Ensure recording state is correct if an error occurs
            if (isRecording) await stopSpeechToText();
        }
    };

    const recordNewAnswer = async () => {
         // This function is specifically for starting over completely
        console.log("Starting new recording from scratch");
        setUserAnswer(""); // Clear answer
        setSaved(false);    // Reset saved status
        // results.length = 0; // Reset speech results if necessary/possible

        if (isRecording) {
            console.log("Stopping existing recording before starting new one.");
            await stopSpeechToText(); // Stop current one first
        }

        // Now start recording
        try {
             if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    try {
                        await navigator.mediaDevices.getUserMedia({ audio: true });
                    } catch (err) {
                        toast.error("Microphone access denied.");
                        return;
                    }
                }
            await startSpeechToText();
            toast.success("New recording started...");
        } catch (err) {
             console.error("Error starting new recording:", err);
            toast.error("Failed to start new recording.");
        }
    };


    const saveUserAnswer = async () => {
        if (userAnswer.trim().length < 30) {
             toast.error("Answer is too short (minimum 30 characters).");
             return; // Prevent saving if too short
        }
        setLoading(true);
        setOpen(false); // Close confirmation modal immediately
        try {
            console.log("Generating AI feedback for:", question.question);
            const result = await generateResult(
                question.question,
                question.answer, // Ideal answer
                userAnswer      // User's recorded answer
            );

            if (!result || typeof result.rating === 'undefined' || typeof result.feedback === 'undefined') {
                 // Check for essential fields
                throw new Error("AI result format is invalid or incomplete.");
            }
            console.log("AI Result:", result);

            // Determine where to save based on 'followUp' prop (though it's false in this usage)
            if (followUp) {
                // This block might be unreachable if followUp is always false here
                // Ensure addFollowUpQuestion handles updating an *existing* follow-up's answer
                // This might require a different function like `updateFollowUpAnswer`
                console.warn("Saving logic for followUp=true needs review/implementation.");
                // Assuming addFollowUpQuestion can also *update* based on question match
                 if (result.follow_up_question && result.follow_up_question_ans) {
                    await addFollowUpQuestion(interviewId!, question.question, result.follow_up_question, result.follow_up_question_ans);
                 } else {
                    console.warn("AI did not provide a follow-up for this follow-up question.");
                 }

            } else {
                 // Saving a primary answer
                console.log("Saving primary answer to userAnswers collection...");
                await addDoc(collection(db, "userAnswers"), {
                    mockIdRef: interviewId,
                    question: question.question,
                    correct_ans: question.answer, // Consider if this is always needed
                    user_ans: userAnswer,
                    feedback: result.feedback,
                    rating: result.rating,
                    userId,
                    createdAt: serverTimestamp(),
                });
            }

            // Handle potential follow-up generation from the primary answer
            if (!followUp && result.follow_up_question && result.follow_up_question_ans) {
                console.log("AI generated a follow-up question. Saving it...");
              
                await addFollowUpQuestion(interviewId!, question.question, result.follow_up_question, result.follow_up_question_ans);
                 console.log("Follow-up question saved.");
            }

            toast.success("Answer saved successfully!");
            setSaved(true); // Mark as saved

            // *** MODIFIED: Call the callback prop with the saved answer ***
            if (onAnswerSaved) {
                onAnswerSaved(userAnswer);
            }
            // Do not clear userAnswer - keep it visible

        } catch (err: any) {
            console.error("Error saving answer or getting AI feedback:", err);
            toast.error(`Save failed: ${err.message || "Please try again."}`);
            setSaved(false); // Ensure saved state is false if save failed
        } finally {
            setLoading(false); // Stop loading indicator
            // Don't setOpen(false) here, it was closed at the start of try
        }
    };

    // --- Render Logic ---

    const canSave = userAnswer.trim().length >= 30 && !isRecording && !loading;

    return (
        // Reduced top margin slightly if QuestionSection adds padding
        <div className="w-full flex flex-col items-center gap-6 mt-2">
            {/* Confirmation Modal */}
            <SaveModal isOpen={open} onClose={() => setOpen(false)} onConfirm={saveUserAnswer} loading={loading} />

            {/* Answer Display Area */}
            <div className={`w-full p-4 border rounded-md ${isRecording ? 'bg-red-50 border-red-300 shadow-inner' : 'bg-gray-50 border-gray-200'} transition-colors duration-300`}>
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-md font-semibold text-gray-700">Your Answer:</h2>
                    {isRecording && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full animate-pulse font-medium">
                            RECORDING
                        </span>
                    )}
                     {saved && !isRecording && (
                         <div className="flex items-center text-green-600">
                             <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                             </svg>
                             <p className="text-xs font-medium">Saved</p>
                         </div>
                     )}
                </div>

                <p className="text-sm text-gray-800 min-h-[60px] leading-relaxed"> {/* Increased min-height slightly */}
                     {/* Show interim result if actively recording */}
                     {isRecording && interimResult ? (
                         <>
                            <span className="text-gray-500">{userAnswer}</span> {/* Show stable part */}
                            <span className="text-blue-600">{interimResult}</span> {/* Show changing part */}
                         </>
                     ) : userAnswer ? (
                         userAnswer
                     ) : (
                         <span className="text-gray-400 italic">Click the microphone to start recording your answer...</span>
                     )}
                 </p>


                {/* Conditional Hints/Status */}
                 {!isRecording && !saved && userAnswer && userAnswer.trim().length < 30 && (
                     <p className="text-xs text-orange-600 mt-2">
                         Needs {30 - userAnswer.trim().length} more characters to save.
                     </p>
                 )}
                  {!isRecording && !saved && userAnswer && userAnswer.trim().length >= 30 && (
                     <p className="text-xs text-blue-600 mt-2">
                         Ready to save your answer.
                     </p>
                 )}

            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center items-center gap-3">
                 {/* Show record/stop OR saved status */}
                 {!saved &&  (
                     <>
                         <TooltipButton
                             content={isRecording ? "Stop Recording" : "Start Recording"}
                             icon={isRecording ? <CircleStop className="text-red-500 animate-pulse" /> : <Mic />}
                             onClick={recordUserAnswer}
                             // Disable start if already saving
                             disabled={loading}
                             className={isRecording ? "border-red-500 text-red-600" : ""}
                         />
                         <TooltipButton
                             content="Record Again"
                             icon={<RefreshCw />}
                             onClick={recordNewAnswer}
                            // Disable if currently recording or saving
                             disabled={isRecording || loading}
                         />
                         <TooltipButton
                             content="Save Answer"
                             icon={loading ? <Loader className="animate-spin" /> : <Save />}
                             // Open confirmation modal instead of direct save
                             onClick={() => { if (canSave) setOpen(true); }}
                             disabled={!canSave || isAiGenerating} // Disable if cannot save or AI is busy elsewhere
                         />
                     </>
                 )}

            </div>
             {isAiGenerating && (
                 <p className="text-xs text-blue-500 mt-2 flex items-center">
                     <Loader className="animate-spin h-3 w-3 mr-1" />
                     AI is processing...
                 </p>
             )}

        </div>
    );
};