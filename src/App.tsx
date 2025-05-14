import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { PublicLayout } from "@/layouts/publicLayout"//component for non authenticated pages
import HomePage from "@/routes/home" //homepage component
import AuthenticationLayout from "./layouts/auth-layout" //authentication 
import {SignInPage} from "@/routes/sign-in"  //component of signin page
import {SignUpPage} from "@/routes/sign-up" // component of signup page
import ProtectedRoutes from "@/layouts/protectedRoutes" //This component guards routes — it will check if a user is authenticated.
import {MainLayout} from "@/layouts/main-Layout"
import Generate from "@/components/generate"
import Dashboard from "@/routes/dashboard"
import CreateEditPage from "@/routes/create-edit-page"
import MockLoadPage from "@/routes/mock-load-page"
import {MockInterviewPage} from "@/routes/mock-interview-page"
import {Feedback} from "@/routes/feedback" ;
import AboutPage from "@/routes/about"
import ServicesPage from "@/routes/services"
import ContactPage from "@/routes/contact"
function App() {
  return (
       <Router> {/* Wrapper for routes  */ }
      <Routes> 
        {/* public routes */}
        <Route element={<PublicLayout/>}> {/* This is the structure in which below childrens will be rendered in <outlet/> */}
          <Route index element={<HomePage/>}/>
          <Route path="about" element={<AboutPage />}/>
          <Route path="services" element={<ServicesPage />}/>
          <Route path="contact" element={<ContactPage />}/>
        </Route>

        {/* Authentication layout */}
        <Route element={<AuthenticationLayout/>}>
          <Route path="/signin/*" element={<SignInPage />}/>
          <Route path="signup/*" element={<SignUpPage />}/>
        </Route>

        {/* protected routes */}
        <Route element={
          <ProtectedRoutes>
            <MainLayout/>
          </ProtectedRoutes>
        }>
          {/* Add your protected routes here */}
          <Route element={<Generate/>} path="/generate">
          <Route index element={<Dashboard/>}/>
          <Route path=":interviewId" element={<CreateEditPage/>}/>
          <Route path="interview/:interviewId" element={<MockLoadPage/>} />
          <Route path="interview/:interviewId/start" element={<MockInterviewPage/>}/>
          <Route path="feedback/:interviewId" element={<Feedback/>}/>
          </Route>
        </Route>
      </Routes>
    </Router>

   
  )
}

export default App
