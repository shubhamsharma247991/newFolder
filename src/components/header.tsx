import { useAuth } from "@clerk/clerk-react";
import {cn} from "@/lib/utils" ;
import {Container} from "@/components/container" ;// wrapper that applies consistent padding/margins to center content.
import LogoContainer from "@/components/Logo-Container"//component responsible for displaying your app's logo
import { NavLink } from "react-router-dom"
import ProfileContainer from "@/components/profile-container";//shows the current user's avatar, profile dropdown, or links like "Sign Out".
import ToggleContainer from "@/components/toggle-container";// mobile menu toggling useful for responsive UI
import { NavigationRoutes } from "@/components/navigation-routes";// set of navigation links like Home, About, Contact, etc. from a centralized component
const Header = () => {
  const {userId } =  useAuth() ;//useAuth hook from Clerk It provides access to the current user's authentication state. Here, you’re using it to check if the user is logged in via userId.

  return (
  <header className={cn("w-full h-25 border-b duration-150 transition-all ease-in-out")}>
    <Container>
      <div className="flex items-center gap-4 w-full select-none">
        {/* logo section */}
        <LogoContainer/>
        {/* Navigation seciton  */} 
        <nav className={cn("hidden md:flex items-center gap-3")}>
        <NavigationRoutes/>
        {/* will show Take an Interview to logged in users */ }
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
        {/* Profile section  */}
        <div className="ml-auto flex item-center gap-6">
          {/* profile Container*/}
            <ProfileContainer/>
          {/*mobile toggle section */}
            <ToggleContainer/>
        </div>
      </div>
    
    </Container>
  </header>
  )
}

export default Header;

