import { db } from "@/config/firebase.cofig";
import { useAuth } from "@clerk/clerk-react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import LoaderPage from "@/routes/loader-page";
import { CustomBreadCrumb } from "@/components/custom-bread-crum";
import Headings from "@/components/headings";
import { InterviewPin } from "@/components/pin";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { CircleCheck, Star } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
// Define the types here or ensure they are correctly imported from "@/types"
// Assuming types are imported correctly:
import { FollowUpQuestions, Interview, UserAnswer } from "@/types";




export const Feedback = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<UserAnswer[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpQuestions[]>([]);
  const [activeFeed, setActiveFeed] = useState("");
  const { userId } = useAuth();
  const navigate = useNavigate();

  // Check if interviewId is available, otherwise navigate
  useEffect(() => {
    if (!interviewId) {
      navigate("/generate", { replace: true });
    }
  }, [interviewId, navigate]); // Depend on interviewId and navigate

  useEffect(() => {
    if (interviewId && userId) { // Ensure userId is also available
      const fetchInterview = async () => {
        try {
          const interviewDoc = await getDoc(
            doc(db, "interviews", interviewId)
          );
          if (interviewDoc.exists()) {
            setInterview({
              id: interviewDoc.id,
              ...interviewDoc.data(),
            } as Interview);
          } else {
            // Handle case where interview document doesn't exist
            console.warn(`Interview document with ID ${interviewId} not found.`);
            // Optionally navigate or show an error message
          }
        } catch (error) {
          console.error("Error fetching interview:", error);
          toast("Error", {
            description: "Failed to load interview details.",
          });
        }
      };

      const fetchFeedbacks = async () => {
        setIsLoading(true);
        try {
          // Fetch UserAnswers
          const userAnswersQuery = query(
            collection(db, "userAnswers"),
            where("userId", "==", userId),
            where("mockIdRef", "==", interviewId)
          );
          const userAnswersSnap = await getDocs(userAnswersQuery);
          const interviewData: UserAnswer[] = userAnswersSnap.docs.map((doc) => {
            // Add checks for potentially missing fields if necessary for UserAnswer type
            return { id: doc.id, ...doc.data() } as UserAnswer;
          });
          setFeedbacks(interviewData);

          // Fetch FollowUpQuestions
          const followUpsQuery = query(
            collection(db, "FollowUpQuestions"), // Corrected collection name based on your previous code
            where("interviewId", "==", interviewId)
          );
          const followUpsSnap = await getDocs(followUpsQuery);
          const followUpsData: FollowUpQuestions[] = followUpsSnap.docs.map((doc) => {
             // Cast to FollowUpQuestions, assuming the type definition handles optional fields
            const data = doc.data();
            return { id: doc.id, ...data } as FollowUpQuestions;
          });
          setFollowUps(followUpsData);
          console.log("Fetched FollowUps:", followUpsData); // Log fetched data for debugging

        } catch (error) {
          console.error("Error fetching feedbacks or follow-ups:", error);
          toast("Error", {
            description: "Something went wrong while loading feedback. Please try again later.",
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchInterview();
      fetchFeedbacks();
    }
  }, [interviewId, userId]); // Depend on interviewId and userId

  const overAllRating = useMemo(() => {
    // Ensure ratings are numbers and handle potential undefined/null ratings
    const totalFeedbacks = feedbacks.length + followUps.length;
    if (totalFeedbacks === 0) return "0.0";

    const totalRatings = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0) +
                         followUps.reduce((acc, f) => acc + (f.rating || 0), 0); // Use (f.rating || 0) to treat missing/null ratings as 0

    return (totalRatings / totalFeedbacks).toFixed(1);
  }, [feedbacks, followUps]);

  if (isLoading) {
    return <LoaderPage className="w-full h-[70vh]" />;
  }

  // Render nothing if interview data is not loaded yet and not loading
  if (!interview && !isLoading) {
      return null; // Or a message like "Interview not found"
  }


  return (
    <div className="flex flex-col w-full gap-8 py-5">
      <div className="flex items-center justify-between w-full gap-2">
        {/* Ensure interview is not null before accessing its properties */}
        {interview && (
            <CustomBreadCrumb
              breadCrumbPage={"Feedback"}
              breadCrumbItems={[
                { label: "Mock Interviews", link: "/generate" },
                {
                  label: `${interview.position}`, // Access position safely
                  link: `/generate/interview/${interview.id}`, // Access id safely
                },
              ]}
            />
        )}
      </div>

      <Headings
        title="Congratulations !"
        description="Your personalized feedback is now available. Dive in to see your strengths, areas for improvement, and tips to help you ace your next interview."
      />

      <p className="text-base text-muted-foreground">
        Your overall interview ratings :{" "}
        <span className="text-emerald-500 font-semibold text-xl">
          {overAllRating} / 10
        </span>
      </p>

      {interview && <InterviewPin change={() => {}} interview={interview} onMockPage />}

      <Headings title="Interview Feedback" isSubHeading />

      {(feedbacks.length > 0 || followUps.length > 0) && (
        <Accordion type="single" collapsible className="space-y-6">
          {/* Render Feedbacks */}
          {feedbacks.map((feed) => (
            <AccordionItem
              key={feed.id}
              value={feed.id}
              className="border rounded-lg shadow-md"
            >
              <AccordionTrigger
                onClick={() => setActiveFeed(feed.id)}
                className={cn(
                  "px-5 py-3 flex items-center justify-between text-base rounded-t-lg transition-colors hover:no-underline",
                  activeFeed === feed.id
                    ? "bg-gradient-to-r from-purple-50 to-blue-50"
                    : "hover:bg-gray-50"
                )}
              >
                {/* Add check for feed.question */}
                <span>{feed.question || 'Question not available'}</span> {/* Use || for fallback text */}
              </AccordionTrigger>

              <AccordionContent className="px-5 py-6 bg-white rounded-b-lg space-y-5 shadow-inner">
                <div className="text-lg font-semibold text-gray-700">
                  <Star className="inline mr-2 text-yellow-400" />
                  Rating : {feed.rating || 'N/A'} {/* Use || for fallback text */}
                </div>

                <Card className="border-none space-y-3 p-4 bg-green-50 rounded-lg shadow-md">
                  <CardTitle className="flex items-center text-lg">
                    <CircleCheck className="mr-2 text-green-600" />
                    Expected Answer
                  </CardTitle>
                  <CardDescription className="font-medium text-gray-700">
                    {feed.correct_ans || 'Expected answer not available'} {/* Use || for fallback text */}
                  </CardDescription>
                </Card>

                <Card className="border-none space-y-3 p-4 bg-yellow-50 rounded-lg shadow-md">
                  <CardTitle className="flex items-center text-lg">
                    <CircleCheck className="mr-2 text-yellow-600" />
                    Your Answer
                  </CardTitle>
                  <CardDescription className="font-medium text-gray-700">
                    {feed.user_ans || 'Your answer not available'} {/* Use || for fallback text */}
                  </CardDescription>
                </Card>

                <Card className="border-none space-y-3 p-4 bg-red-50 rounded-lg shadow-md">
                  <CardTitle className="flex items-center text-lg">
                    <CircleCheck className="mr-2 text-red-600" />
                    Feedback
                  </CardTitle>
                  <CardDescription className="font-medium text-gray-700">
                    {feed.feedback || 'Feedback not available'} {/* Use || for fallback text */}
                  </CardDescription>
                </Card>
              </AccordionContent>
            </AccordionItem>
          ))}

          {/* Render Follow Ups Similarly */}
          {followUps.map((follow) => (
           <>{follow.Feedback &&  <AccordionItem
           key={follow.id}
           value={follow.id}
           className="border rounded-lg shadow-md"
         >
           <AccordionTrigger
             onClick={() => setActiveFeed(follow.id)}
             className={cn(
               "px-5 py-3 flex items-center justify-between text-base rounded-t-lg transition-colors hover:no-underline",
               activeFeed === follow.id
                 ? "bg-gradient-to-r from-purple-50 to-blue-50"
                 : "hover:bg-gray-50"
             )}
           >
             {/* Add check for follow.followUp and follow.followUp.question */}
             <span>Follow-up: {follow.followUps?.question || 'Question not available'}</span> {/* Use optional chaining and fallback text */}
           </AccordionTrigger>

           <AccordionContent className="px-5 py-6 bg-white rounded-b-lg space-y-5 shadow-inner">
             <div className="text-lg font-semibold text-gray-700">
               <Star className="inline mr-2 text-yellow-400" />
               Rating : {follow.rating || 'N/A'} {/* Use || for fallback text */}
             </div>

             <Card className="border-none space-y-3 p-4 bg-green-50 rounded-lg shadow-md">
               <CardTitle className="flex items-center text-lg">
                 <CircleCheck className="mr-2 text-green-600" />
                 Expected Answer
               </CardTitle>
               <CardDescription className="font-medium text-gray-700">
                 {/* Add check for follow.followUp and follow.followUp.answer */}
                 {follow.followUps?.answer || 'Expected answer not available'} {/* Use optional chaining and fallback text */}
               </CardDescription>
             </Card>

             <Card className="border-none space-y-3 p-4 bg-yellow-50 rounded-lg shadow-md">
               <CardTitle className="flex items-center text-lg">
                 <CircleCheck className="mr-2 text-yellow-600" />
                 Your Answer
               </CardTitle>
               <CardDescription className="font-medium text-gray-700">
                 {/* Add check for follow.followUp and follow.followUp.userAnswer */}
                 {follow.followUps?.userAnswer || 'Your answer not available'} {/* Use optional chaining and fallback text */}
               </CardDescription>
             </Card>

             <Card className="border-none space-y-3 p-4 bg-red-50 rounded-lg shadow-md">
               <CardTitle className="flex items-center text-lg">
                 <CircleCheck className="mr-2 text-red-600" />
                 Feedback
               </CardTitle>
               <CardDescription className="font-medium text-gray-700">
                 {follow.Feedback || 'Feedback not available'} {/* Use || for fallback text */}
               </CardDescription>
             </Card>
           </AccordionContent>
         </AccordionItem>}</>
          ))}
        </Accordion>
      )}
       {/* Add a message if there are no feedbacks or follow-ups */}
       {feedbacks.length === 0 && followUps.length === 0 && !isLoading && (
           <p className="text-center text-muted-foreground">No feedback available for this interview yet.</p>
       )}
    </div>
  );
};
