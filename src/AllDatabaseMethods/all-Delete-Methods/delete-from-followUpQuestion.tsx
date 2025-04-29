import { collection, query, where, deleteDoc, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase.cofig";

export const deleteAllFollowUpQuestions = async (
  interviewId: string,
): Promise<void> => {
  try {
    // 1. Create a reference to the "FollowUpQuestions" collection.
    const followUpQuestionsRef = collection(db, "FollowUpQuestions");

    // 2. Build the query to find documents that match the criteria.
    const q = query(
      followUpQuestionsRef,
      where("interviewId", "==", interviewId),
    );

    // 3. Get the documents that match the query.
    const querySnapshot = await getDocs(q);

    // 4. Iterate over the documents and delete each one.
    const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));

    // 5. Wait for all deletions to complete.
    await Promise.all(deletePromises);

    console.log(
      `Successfully deleted all follow-up questions for interviewId: ${interviewId} `
    );
  } catch (error: any) {
    // 6. Handle any errors that occur during the process.
    console.error(
      `Error deleting follow-up questions for interviewId: ${interviewId} `,
      error
    );
    throw error; // Re-throw the error to be handled by the caller.
  }
};