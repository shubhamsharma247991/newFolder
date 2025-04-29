import { StrictMode } from 'react'
import {ClerkProvider} from "@clerk/clerk-react"//  provides authentication  
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {ToasterProvider as ToastProvider} from '@/provider/toast-provider.tsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App/>
      <ToastProvider/>
    </ClerkProvider>
  </StrictMode>,
)
