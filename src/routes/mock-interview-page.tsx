/* eslint-disable @typescript-eslint/no-unused-vars */
import { Interview } from "@/types";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase.cofig";
import { CustomBreadCrumb } from "@/components/custom-bread-crum";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lightbulb } from "lucide-react";
import { QuestionSection } from "@/components/question-section";

export const MockInterviewPage = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const [interview, setInterview] = useState<Interview | null>(null);

  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchInterview = async () => {
      if (!interviewId) {
        navigate('/generate');
        return;
      }

      try {
        const interviewDoc = await getDoc(doc(db, "interviews", interviewId));
        
        if (!interviewDoc.exists()) {
          navigate('/generate');
          return;
        }

        setInterview({
          id: interviewDoc.id,
          ...interviewDoc.data()
        } as Interview);
      } catch (error) {
        console.error("Error fetching interview:", error);
        navigate('/generate');
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [interviewId, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col w-full gap-8 py-5">
      <CustomBreadCrumb
        breadCrumbPage="Start"
        breadCrumbItems={[
          { label: "Mock Interviews", link: "/generate" },
          {
            label: interview?.position || "",
            link: `/generate/interview/${interview?.id}`,
          },
        ]}
      />

      <div className="w-full">
        <Alert className="bg-sky-100 border border-sky-200 p-4 rounded-lg flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-sky-600" />
          <div>
            <AlertTitle className="text-sky-800 font-semibold">
              Important Note
            </AlertTitle>
            <AlertDescription className="text-sm text-sky-700 mt-1 leading-relaxed">
              Press "Record Answer" to begin answering the question. Once you
              finish the interview, you&apos;ll receive feedback comparing your
              responses with the ideal answers.
              <br />
                DO NOT refresh the page or close the tab during the interview. If you
                do, you will lose your progress and the report will not be generated.
                <br />
                DO NOT change question while recording answer first stop recording or save before changing tab or question.
            </AlertDescription>
          </div>
        </Alert>
      </div>

      {interview?.questions && interview?.questions.length > 0 && (
        <div className="mt-4 w-full flex flex-col items-start gap-4">
          <QuestionSection questions={interview?.questions} />
        </div>
      )}
    </div>
  );
};