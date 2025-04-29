import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { Interview } from "@/types";

import { CustomBreadCrumb } from "@/components/custom-bread-crum";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import  Headings  from "@/components/headings";
import { Button } from "@/components/ui/button";
import { Loader, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/config/firebase.cofig";
import {generateAiResponse} from "@/AI-Request/ai-req-for-mainQ"


interface FormMockInterviewProps {
  initialData: Interview | null;
}

const formSchema = z.object({
  position: z
    .string()
    .min(1, "Position is required")
    .max(100, "Position must be 100 characters or less"),
  description: z.string().min(10, "Description is required"),
  experience: z.coerce
    .number()
    .min(0, "Experience cannot be empty or negative"),
  techStack: z.string().min(1, "Tech stack must be at least a character"),
});

type FormData = z.infer<typeof formSchema>;

export const FormMockInterview = ({ initialData }: FormMockInterviewProps) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {},
  });

  const { isValid, isSubmitting } = form.formState;
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { userId } = useAuth();
  
 
  
  const handleDelete = async () => {
    if (!initialData) return;
    
      try {
        setLoading(true);
        await deleteDoc(doc(db, "interviews", initialData.id));
        toast.success("Interview deleted successfully");
        navigate("/generate", { replace: true });
      } catch (error) {
        console.error("Error deleting interview:", error);
        toast.error("Failed to delete interview");
      } finally {
        setLoading(false);
      }
  };

  const title = initialData
    ? initialData.position
    : "Create a new mock interview";

  const breadCrumpPage = initialData ? initialData?.position : "Create";
  const actions = initialData ? "Save Changes" : "Create";
  const toastMessage = initialData
    ? { title: "Updated..!", description: "Changes saved successfully..." }
    : { title: "Created..!", description: "New Mock Interview created..." };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      if (!isValid) {
        toast.error("Form validation failed", {
          description: "Please check all fields and try again"
        });
        return;
      }

      // Generate AI response first
      let aiResult;
      try {
        aiResult = await generateAiResponse(data);
        if (!Array.isArray(aiResult) || aiResult.length === 0) {
          throw new Error("Invalid response format from AI");
        }
      } catch (aiError) {
        console.error("AI Response Error:", aiError);
        toast.error("AI Response Error", {
          description: "Failed to generate interview questions. Please try again."
        });
        return;
      }

      // Proceed with database operations
      if (initialData) {
        // update existing interview
        await updateDoc(doc(db, "interviews", initialData?.id), {
          questions: aiResult,
          ...data,
          updatedAt: serverTimestamp(),
        }).catch((error) => {
          console.error("Firestore update error:", error);
          throw error;
        });
      } else {
        // create a new mock interview
        await addDoc(collection(db, "interviews"), {
          ...data,
          userId,
          questions: aiResult,
          createdAt: serverTimestamp(),
        }).catch((error) => {
          console.error("Firestore add error:", error);
          throw error;
        });
      }
      
      toast(toastMessage.title, { description: toastMessage.description });
      navigate("/generate", { replace: true });
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Error", {
        description: `Something went wrong: ${(error as Error)?.message || "Unknown error"}. Please try again.`
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      form.reset({
        position: initialData.position,
        description: initialData.description,
        experience: initialData.experience,
        techStack: initialData.techStack,
      });
    }
  }, [initialData, form]);

  return (
    <div className="w-full flex-col space-y-4">
      <CustomBreadCrumb
        breadCrumbPage={breadCrumpPage}
        breadCrumbItems={[{ label: "Mock Interviews", link: "/generate" }]}
      />

      <div className="mt-4 flex items-center justify-between w-full select-none">
        <Headings title={title} isSubHeading />

        {initialData && (
          <Button 
            size={"icon"} 
            variant={"ghost"} 
            onClick={handleDelete}
            disabled={loading}
            type="button"
            aria-label="Delete interview"
            title="Delete interview"
          >
            <Trash2 className="min-w-4 min-h-4 text-red-500" />
          </Button>
        )}
      </div>

      <Separator className="my-4" />

      <div className="my-6"></div>

      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full p-8 rounded-lg flex-col flex items-start justify-start gap-6 shadow-md "
        >
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem className="w-full space-y-4">
                <div className="w-full flex items-center justify-between">
                  <FormLabel>Job Role / Job Position</FormLabel>
                  <FormMessage className="text-sm" />
                </div>
                <FormControl>
                  <Input
                    className="h-12"
                    disabled={loading}
                    placeholder="eg:- Full Stack Developer"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="w-full space-y-4">
                <div className="w-full flex items-center justify-between">
                  <FormLabel>Job Description</FormLabel>
                  <FormMessage className="text-sm" />
                </div>
                <FormControl>
                  <Textarea
                    className="h-12"
                    disabled={loading}
                    placeholder="eg:- describle your job role"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="experience"
            render={({ field }) => (
              <FormItem className="w-full space-y-4">
                <div className="w-full flex items-center justify-between">
                  <FormLabel>Years of Experience</FormLabel>
                  <FormMessage className="text-sm" />
                </div>
                <FormControl>
                  <Input
                    type="number"
                    className="h-12"
                    disabled={loading}
                    placeholder="eg:- 5 Years"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="techStack"
            render={({ field }) => (
              <FormItem className="w-full space-y-4">
                <div className="w-full flex items-center justify-between">
                  <FormLabel>Tech Stacks</FormLabel>
                  <FormMessage className="text-sm" />
                </div>
                <FormControl>
                  <Textarea
                    className="h-12"
                    disabled={loading}
                    placeholder="eg:- React, Typescript..."
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="w-full flex items-center justify-end gap-6">
            <Button
              type="reset"
              size={"sm"}
              variant={"outline"}
              disabled={isSubmitting || loading}
            >
              Reset
            </Button>
            <Button
              type="submit"
              size={"sm"}
              disabled={isSubmitting || !isValid || loading}
            >
              {loading ? (
                <Loader className="text-gray-50 animate-spin" />
              ) : (
                actions
              )}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};