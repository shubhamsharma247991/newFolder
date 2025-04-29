import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase.cofig"; // Adjust the import path as needed

export const GetUserAnswersForFollowUpQuestions = async (
  interviewId: string | undefined, 
  currentQuestion: string,
  parentQuestion?: string // Optional parent question to filter by
): Promise<{ answers: string[], isPending: boolean }> => {
  try {
    if (!interviewId) {
      console.warn("Interview ID is undefined");
      return { answers: [], isPending: false };
    }

    console.log(`Fetching follow-up answers for interview: ${interviewId}, question: ${currentQuestion}`);
    
    const userAnswersRef = collection(db, "FollowUpQuestions");
    
    // Build the query based on available parameters
    let q;
    if (parentQuestion) {
      q = query(
        userAnswersRef,
        where("interviewId", "==", interviewId),
        where("parent_Question", "==", parentQuestion)
      );
    } else {
      q = query(
        userAnswersRef,
        where("interviewId", "==", interviewId)
      );
    }

    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} documents for follow-up answers`);
    
    const userAnswers = [];
    let isPending = false;
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      console.log("Document data for follow-up:", data);
      
      if (data.followUps) {
        if (Array.isArray(data.followUps)) {
          // Handle array of follow-ups
          for (const followUp of data.followUps) {
            if (followUp.question === currentQuestion) {
              // Check if it's pending
              if (followUp.userAnswer === "Pending answer") {
                isPending = true;
              }
              // Include only valid answers
              else if (followUp.userAnswer && followUp.userAnswer !== "Pending answer") {
                userAnswers.push(followUp.userAnswer);
                console.log("Found answer in array:", followUp.userAnswer);
              }
            }
          }
        } else if (typeof data.followUps === 'object') {
          // Handle single follow-up object
          if (data.followUps.question === currentQuestion) {
            if (data.followUps.userAnswer === "Pending answer") {
              isPending = true;
            }
            else if (data.followUps.userAnswer && data.followUps.userAnswer !== "Pending answer") {
              userAnswers.push(data.followUps.userAnswer);
              console.log("Found answer in object:", data.followUps.userAnswer);
            }
          }
        }
      }
    }

    console.log("Final retrieved follow-up answers:", userAnswers, "isPending:", isPending);
    return { answers: userAnswers, isPending };
  } catch (error) {
    console.error("Error fetching UserAnswer documents:", error);
    return { answers: [], isPending: false };
  }
}
