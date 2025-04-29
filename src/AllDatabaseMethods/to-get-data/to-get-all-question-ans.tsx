import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase.cofig";
interface QuestionWithAnswers {
  question: string;
  userAnswer: string;
  correctAnswer: string;
}

export const getQuestionsAndAnswersByInterviewId = async ( interviewId: string | undefined): Promise<QuestionWithAnswers[]> => {
  try {
    if (!interviewId) {
      throw new Error("Interview ID is required to retrieve questions and answers.");
    }

    const userAnswersRef = collection(db, "userAnswers");
    const q = query(userAnswersRef, where("mockIdRed", "==", interviewId));
    const querySnapshot = await getDocs(q);

    const questionsWithAnswers: QuestionWithAnswers[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        question: data.question,
        userAnswer: data.user_ans,
        correctAnswer: data.correct_ans,
      };
    });

    console.log(`Retrieved ${questionsWithAnswers.length} questions and answers for interview ID: ${interviewId}`);
    return questionsWithAnswers;
  } catch (error) {
    console.error(`Error retrieving questions and answers for interview ID ${interviewId}:`, error);
    return []; // Return an empty array to indicate an error/no data, or you could re-throw.
  }
};
