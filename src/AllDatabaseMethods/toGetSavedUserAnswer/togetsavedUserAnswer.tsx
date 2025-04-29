import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase.cofig"; // Adjust the import path as needed

export const  GetUserAnswersByMockIdAndQuestion = async  (interviewId :string | undefined, currentQuestion : string)=>{
  try {
    const userAnswersRef = collection(db, "userAnswers");
    const q = query(
      userAnswersRef,
      where("mockIdRef", "==", interviewId),
      where("question", "==", currentQuestion)
    );

    const querySnapshot = await getDocs(q);
    const userAnswers = querySnapshot.docs.map((doc) => doc.data().user_ans);

    return userAnswers;
  } catch (error) {
    console.error("Error fetching UserAnswer documents:", error);
    return [];
  }
}
