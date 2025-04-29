import { Outlet } from "react-router-dom";
import Header from "@/components/header";
const AuthenticationLayout = () => {
  return (
    <>
    <Header/>
    <div className="w-screen h-screen overflow-hidden justify-center flex items-center relative">
      <img src="/assets/img/bg.png" alt="" className="absolute  w-full h-full opacity-20  object-cover " />
    <Outlet/>
    </div>
    </>
    
  )
}

export default AuthenticationLayout ;
