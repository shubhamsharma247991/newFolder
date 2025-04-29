import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader } from "lucide-react";
interface TooltipButtonProps {
  content: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
  loading?: boolean;
}

export const TooltipButton = ({
  content,
  icon,
  onClick,
  disabled = false,
  variant = "default",
  className,
  loading = false
}: TooltipButtonProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            size="icon" 
            variant={variant}
            onClick={onClick}
            disabled={disabled || loading}
            className={className}
          >
            {loading ? <Loader className="h-4 w-4 animate-spin" /> : icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};