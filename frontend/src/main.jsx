import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY environment variable')
}

// Routes Clerk's internal navigation (e.g. after authenticateWithRedirect)
// through react-router instead of a full page reload.
function ClerkProviderWithRoutes({ children }) {
  const navigate = useNavigate()
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      navigate={(to) => navigate(to)}
      afterSignOutUrl="/login"
    >
      {children}
    </ClerkProvider>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ClerkProviderWithRoutes>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ClerkProviderWithRoutes>
    </BrowserRouter>
  </StrictMode>,
)
