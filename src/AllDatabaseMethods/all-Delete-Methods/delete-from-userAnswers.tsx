import { collection, query, where, getDocs, doc, writeBatch } from "firebase/firestore";
import { db } from "@/config/firebase.cofig"; // fixed typo

export const deleteAllUserAnswersByInterviewId = async (interviewId: string): Promise<void> => {
  try {
    if (!interviewId) {
      throw new Error("Interview ID is required to delete user answers.");
    }

    const userAnswersRef = collection(db, "userAnswers");
    const q = query(userAnswersRef, where("mockIdRed", "==", interviewId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`No user answers found for interview ID: ${interviewId}`);
      return;
    }

    const batch = writeBatch(db);

    querySnapshot.docs.forEach((docSnapshot) => {
      const docRef = doc(userAnswersRef, docSnapshot.id);
      batch.delete(docRef);
    });

    await batch.commit();

    console.log(`All user answers deleted for interview ID: ${interviewId}`);
  } catch (error) {
    console.error(`Error deleting user answers for interview ID ${interviewId}:`, error);
    throw error;
  }
};
