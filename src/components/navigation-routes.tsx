import { cn } from "@/lib/utils"
import { NavLink } from "react-router-dom"
import { MainRoutes } from "@/lib/helper"

interface NavigationRoutesProps {
  isMobile?: boolean
}

export const NavigationRoutes = ({ isMobile = false }: NavigationRoutesProps) => {
  return (
    <ul className={cn(
      "flex gap-6",
      isMobile ? "flex-col items-start" : "items-center"
    )}>
      {MainRoutes.map(route => (
        <li key={route.href}>
          <NavLink 
            to={route.href} 
            className={({isActive}) => cn(
              "text-base text-neutral-500 transition-colors hover:text-neutral-700",
              isActive && "text-neutral-900 font-semibold"
            )}
          >
            {route.label}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

