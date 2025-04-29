import { Link } from "react-router-dom"; // Fixed router import
import Headings from "@/components/headings";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator"; // Fixed separator path
import  {InterviewPin}  from "@/components/pin";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/config/firebase.cofig"; // Fixed config path
import { Interview } from "@/types";
import { useAuth } from "@clerk/clerk-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const Dashboard = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useAuth();
  const [change , setChange ] = useState(false) ;
  useEffect(() => {
    if (!userId) return;

    const interviewsQuery = query(
      collection(db, "interviews"),
      where("userId", "==", userId)
    );

    const unsubscribe = onSnapshot(
      interviewsQuery,
      (snapshot) => {
        const interviews = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Interview[];
        setInterviews(interviews);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching interviews:", error);
        toast.error("Failed to fetch interviews");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId,change]);

  return (
    <>
      <div className="flex w-full items-center justify-between select-none">
        <Headings 
          title="Dashboard" 
          description="Create and start your AI mock Interview" 
        />
        <Link to="/generate/create">
          <Button size="sm">
            <Plus className="mr-2"/>
            Add New  
          </Button>
        </Link>
      </div>

      <Separator className="my-8"/>
      
      <div className="md:grid md:grid-cols-3 gap-3 py-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-24 md:h-32 rounded-md" />
          ))
        ) : interviews.length > 0 ? (
          interviews.map((interview) => (
            <InterviewPin key={interview.id} interview={interview} change={()=>{setChange(!change)}} />
          ))
        ) : (
          <div className="md:col-span-3 w-full flex flex-grow items-center justify-center h-96 flex-col">
            <img
              src="/assets/svg/not-found.svg"
              className="w-44 h-44 object-contain"
              alt="No data found"
            />
            <h2 className="text-lg font-semibold text-muted-foreground select-none">
              No Data Found
            </h2>
            <p className="w-full md:w-96 text-center text-sm text-neutral-400 mt-4 select-none">
              There is no available data to show. Please add some new mock
              interviews
            </p>
            <Link to="/generate/create" className="mt-4">
              <Button size="sm">
                <Plus className="min-w-5 min-h-5 mr-1 select-none" />
                Add New
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
