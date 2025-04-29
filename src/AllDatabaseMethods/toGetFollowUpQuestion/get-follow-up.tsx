import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/config/firebase.cofig";

interface FollowUp {
  question: string;
  answer: string;
  userAnswer: string;
}

export const fetchFollowUps = async (
  interviewId: string | undefined,
  parentQuestion: string
): Promise<FollowUp[]> => {
  try {
    if (!interviewId) {
      console.warn("Interview ID is undefined");
      return [];
    }

    const followUpsRef = collection(db, "FollowUpQuestions");
    const q = query(
      followUpsRef,
      where("interviewId", "==", interviewId),
      where("parent_Question", "==", parentQuestion)
    );

    const querySnapshot = await getDocs(q);
    const allFollowUps: FollowUp[] = [];

    querySnapshot.forEach((doc) => {
      const docData = doc.data();
      console.log("Raw follow-up data from Firestore:", docData);

      if (Array.isArray(docData.followUps)) {
        // Filter out any undefined or null entries
        const validFollowUps = docData.followUps.filter(fu => fu && typeof fu === 'object');
        allFollowUps.push(...validFollowUps);
      } else if (docData.followUps && typeof docData.followUps === "object") {
        allFollowUps.push(docData.followUps);
      } else {
        console.warn("followUps is not in expected format:", docData.followUps);
      }
    });
    
    console.log("Processed follow-ups for", parentQuestion, ":", allFollowUps);

    return allFollowUps;
  } catch (error) {
    console.error("Error fetching follow-up questions:", error);
    return [];
  }
};


