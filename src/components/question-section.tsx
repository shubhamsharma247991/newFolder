// src/components/Interview/QuestionSection.tsx (or similar path)
import  { useEffect, useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { TooltipButton } from "./tooltip-button";
import { Volume2, VolumeX, Loader } from "lucide-react"; // Added Loader
import { RecordAnswer } from "./record-answer";
import {  useParams, Link } from "react-router-dom";
import { fetchFollowUps } from "@/AllDatabaseMethods/toGetFollowUpQuestion/get-follow-up";
// *** NEW: Import the function to get user answers ***
import { GetUserAnswersByMockIdAndQuestion } from "@/AllDatabaseMethods/toGetSavedUserAnswer/togetsavedUserAnswer";
import { FollowUp } from '@/types/index';
import GETFOLLOWUP from "@/components/getFollowUp/get-follow-Up";


interface QuestionSectionProps {
    questions: { question: string; answer: string }[];
}

// *** NEW: Define a type for the user answers map ***
type UserAnswersMap = {
    [questionText: string]: string | undefined;
};

export const QuestionSection = ({ questions }: QuestionSectionProps) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSpeech, setCurrentSpeech] = useState<SpeechSynthesisUtterance | null>(null);
    const [followUpData, setFollowUpData] = useState<{ [key: string]: FollowUp[] }>({});
    const [activeTab, setActiveTab] = useState<string>(questions[0]?.question || ""); // Initialize activeTab
    const { interviewId } = useParams<{ interviewId: string }>();

    // *** NEW: State for user answers and loading status ***
    const [userAnswers, setUserAnswers] = useState<UserAnswersMap>({});
    const [isLoadingAnswers, setIsLoadingAnswers] = useState(true); // Track initial loading


    const handlePlayQuestion = (qst: string) => {
        // ... (speech synthesis logic - unchanged)
        if (isPlaying && currentSpeech) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            setCurrentSpeech(null);
        } else if ("speechSynthesis" in window) {
            const speech = new SpeechSynthesisUtterance(qst);
            window.speechSynthesis.speak(speech);
            setIsPlaying(true);
            setCurrentSpeech(speech);
            speech.onend = () => {
                setIsPlaying(false);
                setCurrentSpeech(null);
            };
        }
    };

    // *** NEW: Function to fetch all primary answers ***
    const fetchAllPrimaryAnswers = useCallback(async () => {
        if (!interviewId || !questions || questions.length === 0) {
            setIsLoadingAnswers(false);
            return;
        }
        console.log("Fetching all primary answers...");
        setIsLoadingAnswers(true);
        try {
            const answerPromises = questions.map(q =>
                GetUserAnswersByMockIdAndQuestion(interviewId, q.question)
            );
            const results = await Promise.all(answerPromises);

            const answersMap: UserAnswersMap = {};
            questions.forEach((q, index) => {
                // Assuming GetUserAnswersByMockIdAndQuestion returns array, take the first one
                if (results[index] && results[index]!.length > 0) {
                    answersMap[q.question] = results[index]![0]; // Store the answer string
                } else {
                    answersMap[q.question] = undefined; // Explicitly mark as not answered
                }
            });
            setUserAnswers(answersMap);
            console.log("Fetched primary answers:", answersMap);
        } catch (error) {
            console.error("Error fetching primary answers:", error);
            // Handle error appropriately, maybe show a toast
        } finally {
            setIsLoadingAnswers(false);
        }
    }, [interviewId, questions]); // Dependency array includes questions

    // *** NEW: Function to fetch follow-ups for a single question ***
    const fetchFollowUpForQuestion = useCallback(async (questionText: string) => {
        if (!interviewId) return;
        try {
            console.log(`Workspaceing follow-ups for "${questionText}"...`);
            const followUps = await fetchFollowUps(interviewId, questionText);
            setFollowUpData(prev => ({ ...prev, [questionText]: followUps }));
            console.log(`Workspaceed follow-ups for "${questionText}":`, followUps);
        } catch (error) {
            console.error(`Error fetching follow-ups for "${questionText}":`, error);
        }
    }, [interviewId]); // Only depends on interviewId

    // *** MODIFIED: useEffect to fetch initial data (primary answers + follow-ups for initial tab) ***
    useEffect(() => {
        fetchAllPrimaryAnswers();
        // Fetch follow-ups only for the initially active tab
        if (activeTab) {
            fetchFollowUpForQuestion(activeTab);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [interviewId, questions]); // Rerun if interviewId or the list of questions changes

    // *** NEW: useEffect to fetch follow-ups when tab changes ***
    useEffect(() => {
        // Fetch follow-ups for the newly active tab *if* it's not already loaded
        // (or just always refetch if you prefer)
        if (activeTab && !followUpData[activeTab]) {
             fetchFollowUpForQuestion(activeTab);
        }
    }, [activeTab, fetchFollowUpForQuestion, followUpData]);


    // *** NEW: Callback for when a primary answer is saved ***
    const handlePrimaryAnswerSaved = useCallback((questionText: string, savedAnswer: string) => {
        console.log(`Primary answer saved for "${questionText}". Updating state.`);
        setUserAnswers(prev => ({
            ...prev,
            [questionText]: savedAnswer,
        }));
        // Trigger a refresh of follow-up questions for this specific question
        fetchFollowUpForQuestion(questionText);
    }, [fetchFollowUpForQuestion]); // Dependency includes the fetch function

    // *** NEW: Callback for when a follow-up answer is saved ***
    const handleFollowUpAnswerSaved = useCallback((parentQuestionText: string) => {
        console.log(`Follow-up answer saved for parent "${parentQuestionText}". Refreshing follow-ups.`);
        // Just refetch follow-ups for the parent question
        fetchFollowUpForQuestion(parentQuestionText);
    }, [fetchFollowUpForQuestion]);

    // --- Render Logic ---

    if (isLoadingAnswers) {
        return (
            <div className="w-full min-h-96 border rounded-md p-4 flex justify-center items-center">
                <Loader className="animate-spin h-8 w-8 text-gray-500" />
                <span className="ml-2">Loading questions and answers...</span>
            </div>
        );
    }

    if (!questions || questions.length === 0) {
       return <div className="w-full min-h-96 border rounded-md p-4">No questions available for this interview.</div>;
    }

    return (
        <>
            <div className="w-full min-h-96 border rounded-md p-4">
                <Tabs
                    // Ensure defaultValue is valid or fallback
                    defaultValue={activeTab || questions[0]?.question}
                    value={activeTab} // Controlled component
                    className="w-full space-y-12"
                    orientation="vertical"
                    onValueChange={(value) => {
                        console.log("Tab changed to:", value);
                        setActiveTab(value);
                        // Fetch follow-ups when tab changes (handled by useEffect now)
                    }}
                >
                    <TabsList className="bg-transparent w-full flex flex-wrap items-center justify-start gap-4">
                        {questions.map((tab, i) => (
                            <TabsTrigger
                                key={tab.question}
                                value={tab.question}
                                className={cn(
                                    "data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-md text-xs px-2 py-1",
                                    "text-gray-600 hover:bg-gray-100" // Added hover/inactive styles
                                )}
                            >
                                {`Question #${i + 1}`}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {questions.map((tab) => (
                        <TabsContent key={tab.question} value={tab.question} className="mt-0 pl-4"> {/* Adjusted styling */}
                            <p className="text-base text-left tracking-wide text-neutral-700 font-medium mb-2">{tab.question}</p> {/* Slightly bolder question */}
                            <div className="w-full flex items-center justify-end mb-4"> {/* Added margin bottom */}
                                <TooltipButton
                                    content={isPlaying && currentSpeech?.text === tab.question ? "Stop" : "Read Question"}
                                    icon={isPlaying && currentSpeech?.text === tab.question ? <VolumeX className="min-w-5 min-h-5 text-muted-foreground" /> : <Volume2 className="min-w-5 min-h-5 text-muted-foreground" />}
                                    onClick={() => handlePlayQuestion(tab.question)}
                                />
                            </div>

                            {/* *** MODIFIED: Pass initial answer and callback *** */}
                            <RecordAnswer
                                key={tab.question} // Add key for proper re-rendering if needed
                                question={tab}
                                followUp={false}
                                initialUserAnswer={userAnswers[tab.question]} // Pass fetched answer
                                onAnswerSaved={(savedAnswer) => handlePrimaryAnswerSaved(tab.question, savedAnswer)} // Pass callback
                            />

                            {/* Follow-up Section */}
                            {followUpData[tab.question]?.length > 0 && (
                                <div className="mt-8 pt-4 border-t"> {/* Added spacing and separator */}
                                    <h3 className="text-md font-semibold mb-3 text-gray-800">Follow-Up Question(s):</h3> {/* Adjusted styling */}
                                    <ul className="space-y-4">
                                        {followUpData[tab.question].map((fu, idx) => (
                                            <li key={fu.question + idx} className="border p-4 rounded-md bg-gray-50 shadow-sm" id={`followup-${tab.question}-${idx}`}> {/* Added key and shadow */}
                                                <p className="text-sm text-gray-800 mb-2"><strong>Q:</strong> {fu.question}</p> {/* Added margin */}
                                                {/* Check if user answer exists and is not the placeholder */}
                                                {fu.userAnswer && fu.userAnswer !== "Pending answer" ? (
                                                    <>
                                                        
                                                        <div className="mt-2 flex items-center text-green-600 justify-between">
                                                        <p className="text-sm text-gray-600 mt-1"><strong>Your Answer:</strong> {fu.userAnswer}</p>
                                                            <div className="flex">
                                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                            <p className="text-xs">Saved</p>
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="mt-3"> {/* Added margin */}
                                                        <GETFOLLOWUP
                                                            key={`followup-input-${tab.question}-${idx}`} // Add key
                                                            Question={fu.question}
                                                            answer={fu.answer || ""}
                                                            parentQuestion={tab.question}
                                                            // *** MODIFIED: Pass specific callback for follow-ups ***
                                                            onAnswerSaved={() => handleFollowUpAnswerSaved(tab.question)}
                                                        />
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}


                        </TabsContent>
                    ))}
                </Tabs>
            </div>
            <div className="flex justify-end mt-4 w-full p-4">
                <Link to={`/generate/feedback/${interviewId}`}>
                    <button className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 border border-gray-700 transition-all duration-300">
                        SEE RESULT
                    </button>
                </Link>
            </div>
        </>
    );
};