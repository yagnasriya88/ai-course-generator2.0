import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react'
import LoadingSpinner from '../components/LoadingSpinner'

// Completes the Google OAuth redirect handshake Login/Signup kick off via
// authenticateWithRedirect, then Clerk's `navigate` (wired to react-router in
// main.jsx) sends the user on to redirectUrlComplete.
function SsoCallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner label="Signing you in…" />
      <AuthenticateWithRedirectCallback />
    </div>
  )
}

export default SsoCallback
