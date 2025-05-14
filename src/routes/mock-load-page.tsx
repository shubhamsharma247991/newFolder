/* eslint-disable @typescript-eslint/no-unused-vars */
// PAGE BEFORE STARTING INTERVIEW 
import { db } from "@/config/firebase.cofig";
import { Interview } from "@/types/index";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import  LoaderPage  from "@/routes/loader-page";
import { CustomBreadCrumb } from "@/components/custom-bread-crum";
import { Button } from "@/components/ui/button";
import { Lightbulb, Sparkles } from "lucide-react";
import { InterviewPin } from "@/components/pin";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
const MockLoadPage = () => {

  const { interviewId } = useParams<{ interviewId: string }>();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(true);
    const fetchInterview = async () => {
      if (interviewId) {
        try {
          const interviewDoc = await getDoc(doc(db, "interviews", interviewId));
          if (interviewDoc.exists()) {
            setInterview({
              id: interviewDoc.id,
              ...interviewDoc.data(),
            } as Interview);
          }
        } catch (error) {
          console.log(error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchInterview();
  }, [interviewId, navigate]);
  
  if (isLoading) {
    return <LoaderPage className="w-full h-[70vh]" />;
  }

  if (!interviewId) {
    navigate("/generate", { replace: true });
  }

  if (!interview) {
    navigate("/generate", { replace: true });
  }

  return (
    <div className="flex flex-col w-full gap-8 py-5">
      <div className="flex items-center justify-between w-full gap-2">
        <CustomBreadCrumb
          breadCrumbPage={interview?.position || ""}
          breadCrumbItems={[{ label: "Mock Interviews", link: "/generate" }]}
        />

        <Link to={`/generate/interview/${interviewId}/start`}>
          <Button size={"sm"}>
            Start <Sparkles />
          </Button>
        </Link>
      </div>

      {interview && <InterviewPin interview={interview} onMockPage change={()=>navigate("/generate")}/>}

      <Alert className="bg-yellow-100/50 border-yellow-200 p-4 rounded-lg flex items-start gap-3 -mt-3">
        <Lightbulb className="h-5 w-5 text-yellow-600" />
        <div>
          <AlertTitle className="text-yellow-800 font-semibold">
            Important Information
          </AlertTitle>
          <AlertDescription className="text-sm text-yellow-700 mt-1">
            Please enable your microphone to start the AI-generated
            mock interview. The interview consists of five questions. You’ll
            receive a personalized report based on your responses at the end.{" "}
            <br />
            DO NOT refresh the page or close the tab during the interview. If you
            do, you will lose your progress and the report will not be generated.
            <br />
            DO NOT change question while recording answer first stop recording or save before changing tab or question
          </AlertDescription>
        </div>
      </Alert>



     
    </div>
  );

}

export default MockLoadPage
