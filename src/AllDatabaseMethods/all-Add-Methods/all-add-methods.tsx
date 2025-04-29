import { db } from '@/config/firebase.cofig';
import { collection, addDoc, serverTimestamp, Firestore } from 'firebase/firestore';


//ADD USER ANSWERS
export const addUserAnswer = async (
    db: Firestore,
    interviewId: string | undefined,
    question: string,
    correctAnswer: string,
    userAnswer: string,
   aiResult : {feedback : string , rating : number},
    userId: string | undefined | null,
): Promise<void> => {
    try {
        const userAnswersRef = collection(db, 'userAnswers');
        await addDoc(userAnswersRef, {
            
            mockIdRed:interviewId,
            question : question,
            correct_ans : correctAnswer,
            user_ans :userAnswer,
            feedback : aiResult.feedback,
            rating:aiResult.rating,
            userId :userId,
            createdAt: serverTimestamp(),
        });
        console.log(`Successfully added user answer for interviewId: ${interviewId}, userId: ${userId}, question: ${question}`);
    } catch (error: any) {
        console.error(`Error adding user answer: ${error.message}`, error);
        throw error; // Re-throw the error for the caller to handle
    }
};
// ADD FOLLOW UP QUESTION
export const addFollowUpQuestion = async (
  interviewId: string,
  parentQuestion: string,
  followUpQuestion: string,
  followUpQuestionAnswer: string,
): Promise<void> => {
  try {
      const followUpQuestionsRef = collection(db, 'FollowUpQuestions');
      await addDoc(followUpQuestionsRef, {
          interviewId,
          parent_Question: parentQuestion,
          followUps: {
              question: followUpQuestion,
              answer: followUpQuestionAnswer,
              userAnswer: "", // Initialize userAnswer as an empty string
          },
          Feedback:"",
          rating:0,
          createdAt: serverTimestamp(),
      });
      console.log(`Successfully added follow-up question for interviewId: ${interviewId}, parentQuestion: ${parentQuestion}`);
  } catch (error: any) {
      console.error(`Error adding follow-up question: ${error.message}`, error);
      throw error; // Re-throw the error for the caller to handle
  }
};
