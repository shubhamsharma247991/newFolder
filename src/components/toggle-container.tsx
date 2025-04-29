import { useAuth } from "@clerk/clerk-react";
import { NavigationRoutes } from "./navigation-routes";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Menu } from "lucide-react";


const ToggleContainer = () => {
  const {userId} = useAuth() ;
  return (
    <Sheet>
    <SheetTrigger className="block md:hidden "><Menu/></SheetTrigger>
    <SheetContent>
      <SheetHeader>
        <SheetTitle></SheetTitle>
     <nav className="gap-6 flex flex-col items-start">
     <NavigationRoutes isMobile/>
        {userId &&  <NavLink 
            to={"/generate"} 
            className={({isActive}) => cn(
              "text-base text-neutral-500 transition-colors hover:text-neutral-700",
              isActive && "text-neutral-900 font-semibold"
            )}
          >
            Take an interview 
          </NavLink>}
     </nav>
      </SheetHeader>
    </SheetContent>
  </Sheet>
  
  )
}

export default ToggleContainer ;
