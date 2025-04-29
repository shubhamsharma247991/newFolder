import { Interview } from "@/types";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TooltipButton } from "@/components/tooltip-button";
import { Eye, Newspaper, Sparkles, Trash2 } from "lucide-react";
import { collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/config/firebase.cofig";
import { toast } from "sonner";
import { deleteAllFollowUpQuestions } from "@/AllDatabaseMethods/all-Delete-Methods/delete-from-followUpQuestion";
import { deleteAllUserAnswersByInterviewId as deleteAllUserAnswers } from "@/AllDatabaseMethods/all-Delete-Methods/delete-from-userAnswers";
interface InterviewPinProps {
  interview: Interview;
  onMockPage?: boolean;
  change : any
}

const formatDate = (timestamp: any) => {
  if (!timestamp) return 'Date not available';
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return `${date.toLocaleDateString("en-US", { dateStyle: "long" })} - ${date.toLocaleTimeString("en-US", { timeStyle: "short" })}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'Invalid date';
  }
};

// Deleting current interview 
export const InterviewPin = ({
  interview,
  onMockPage = false,
  change ,
}: InterviewPinProps) => {
  const navigate = useNavigate();

  //

  // deleting interview 
  const deleteInterview = async (e: React.MouseEvent) => {
    e.stopPropagation();
  
    try {
      // Delete associated UserAnswer documents
      const userAnswersRef = collection(db, "userAnswers");
      const q = query(userAnswersRef, where("mockIdRef", "==", interview.id));
      const querySnapshot = await getDocs(q);
  
      const deletePromises = querySnapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, "userAnswers", docSnap.id))
      );
      await deleteAllFollowUpQuestions(interview.id); // Delete all follow-up questions associated with the interview
      await deleteAllUserAnswers(interview.id); // Delete all user answers associated with the interview
      await Promise.all(deletePromises);
      console.log("All matching UserAnswer documents have been deleted.");
  
      // Delete the interview document
      await deleteDoc(doc(db, "interviews", interview.id));
      console.log("Interview deleted successfully.");
      toast.success("Interview and associated answers deleted successfully.");
      change(); // Trigger state change in parent to refresh the list
    } catch (error) {
      console.error("Error deleting interview and associated answers:", error);
      toast.error("Failed to delete interview and associated answers.");
    }finally{
      navigate("/generate", { replace: true });
    }
  };
  
  return (
    <Card className="p-4 rounded-md shadow-none hover:shadow-md shadow-gray-100 cursor-pointer transition-all space-y-4">
      <CardTitle className="text-lg flex justify-between">
        <div>
        {interview?.position}  
        </div>
        <div>
          <button 
            type="button"
            aria-label="Delete interview"
            title="Delete interview"
            onClick={deleteInterview}
            className="p-1 rounded-full hover:bg-red-50 transition-colors"
          >
            <Trash2 className="text-red-400 h-4 w-4 hover:text-red-600" />
          </button>
        </div>
      </CardTitle>
      <CardDescription>{interview?.description}</CardDescription>
      <div className="w-full flex items-center gap-2 flex-wrap">
        {interview?.techStack.split(",").map((word, index) => (
          <Badge
            key={index}
            variant={"outline"}
            className="text-xs text-muted-foreground hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-900"
          >
            {word}
          </Badge>
        ))}
      </div>

      <CardFooter
        className={cn(
          "w-full flex items-center p-0",
          onMockPage ? "justify-end" : "justify-between"
        )}
      >
        <p className="text-[12px] text-muted-foreground truncate whitespace-nowrap">
          {formatDate(interview?.createdAt)}
        </p>

        {!onMockPage && (
          <div className="flex items-center justify-center">
            <TooltipButton
              content="View"
              variant="ghost"
              onClick={() => {
                navigate(`/generate/${interview?.id}`, { replace: true });
              }}
              disabled={false}
              className="hover:text-sky-500"
              icon={<Eye className="h-4 w-4" />}
              loading={false}
            />

            <TooltipButton
              content="Feedback"
              variant="ghost"
              onClick={() => {
                navigate(`/generate/feedback/${interview?.id}`, {
                  replace: true,
                });
              }}
              disabled={false}
              className="hover:text-yellow-500"
              icon={<Newspaper className="h-4 w-4" />}
              loading={false}
            />

            <TooltipButton
              content="Start"
              variant="ghost"
              onClick={() => {
                navigate(`/generate/interview/${interview?.id}`, {
                  replace: true,
                });
              }}
              disabled={false}
              className="hover:text-sky-500"
              icon={<Sparkles className="h-4 w-4" />}
              loading={false}
            />
          </div>
        )}
      </CardFooter>
    </Card>
  );
};