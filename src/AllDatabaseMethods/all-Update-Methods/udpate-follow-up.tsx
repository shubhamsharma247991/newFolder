import { collection, query, where, getDocs, updateDoc, serverTimestamp} from 'firebase/firestore';
import { db } from '@/config/firebase.cofig';

export const updateUserAnswerInFollowUp = async (
    interviewId: string | undefined,
    parentQuestion: string,
    userAnswer: string,
    feedback:string , 
    rating : number,
    followUpQuestion?: string, // Optional parameter to specify which follow-up question to update
): Promise<void> => {
    try {
        console.log(`Updating follow-up answer for interview: ${interviewId}, parent question: ${parentQuestion}`);
        
        if (!interviewId) {
            throw new Error("Interview ID is undefined");
        }
        
        // 1. Create a reference to the "FollowUpQuestions" collection.
        const followUpQuestionsRef = collection(db, 'FollowUpQuestions');

        // 2. Build the query to find the document that matches the criteria.
        const followUpQuery = query(
            followUpQuestionsRef,
            where('interviewId', '==', interviewId),
            where('parent_Question', '==', parentQuestion),
        );

        // 3. Get the documents that match the query.
        const querySnapshot = await getDocs(followUpQuery);
        console.log(`Found ${querySnapshot.size} documents matching the criteria`);

        // 4. Check if a document was found.
        if (querySnapshot.empty) {
            throw new Error(
                `No matching document found for interviewId: ${interviewId} and parentQuestion: ${parentQuestion}`
            );
        }

        // 5. Get the first matching document. We assume only one.
        const docToUpdate = querySnapshot.docs[0];
        const currentData = docToUpdate.data();
        console.log("Current document data:", currentData);

        // 6. Update the document.
        let updateData = {};
        
        // Check if followUps is an array
        if (Array.isArray(currentData.followUps)) {
            // Find the follow-up question and update its userAnswer
            const updatedFollowUps = currentData.followUps.map(fu => {
                // If followUpQuestion is provided, only update the matching question
                if (followUpQuestion && fu.question !== followUpQuestion) {
                    return fu; // Keep this follow-up unchanged
                }
                // Update the userAnswer
                return { ...fu, userAnswer: userAnswer };
            });
            
            updateData = {
                followUps: updatedFollowUps,
                updatedAt: serverTimestamp(),
            };
        } else {
            // If it's a single object
            updateData = {
                'followUps.userAnswer': userAnswer,
                'Feedback': feedback,
                'rating': rating,
                updatedAt: serverTimestamp(),
            };
        }
        
        console.log("Updating document with:", updateData);
        await updateDoc(docToUpdate.ref, updateData);

        console.log(
            `Successfully updated userAnswer for interviewId: ${interviewId} and parentQuestion: ${parentQuestion}`
        );
    } catch (error: any) {
        // 7. Handle any errors that occur during the process.  Include detailed logging.
        console.error(
            `Error updating userAnswer for interviewId: ${interviewId} and parentQuestion: ${parentQuestion}`,
            error
        );
        throw error; // Re-throw the error to be handled by the caller.
    }
};
