import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useSignIn } from '@clerk/clerk-react'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'
import AuthTextField from '../components/AuthTextField'
import ErrorMessage from '../components/ErrorMessage'
import GoogleAuthButton from '../components/GoogleAuthButton'

function Login() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const { status } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [pending, setPending] = useState(null) // null | 'google' | 'password'
  const [error, setError] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const redirectTo = location.state?.from?.pathname || '/'

  // A Clerk session already exists in this browser — re-showing the login
  // form would throw "Session already exists" on submit, so bounce onward.
  if (status === 'authed') return <Navigate to={redirectTo} replace />

  async function handleGoogle() {
    if (!isLoaded || pending) return
    setPending('google')
    setError(null)
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: redirectTo,
      })
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Something went wrong. Please try again.')
      setPending(null)
    }
  }

  async function handlePasswordLogin(event) {
    event.preventDefault()
    if (!isLoaded || pending) return
    setPending('password')
    setError(null)
    try {
      const result = await signIn.create({ identifier: email, password })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        navigate(redirectTo, { replace: true })
      } else {
        setError('Additional verification is required for this account.')
        setPending(null)
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Incorrect email or password.')
      setPending(null)
    }
  }

  return (
    <AuthLayout heading="Welcome back" subheading="Log in to see your courses.">
      <div className="mt-8 flex flex-col gap-3">
        <GoogleAuthButton onClick={handleGoogle} loading={pending === 'google'} label="Log in with Google" />
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium tracking-wide text-slate-400 uppercase">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
        <AuthTextField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
        />
        <AuthTextField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          required
        />
        <button
          type="submit"
          disabled={pending !== null}
          className="mt-1 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending === 'password' ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      {error && (
        <div className="mt-4">
          <ErrorMessage message={error} />
        </div>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        New here?{' '}
        <Link to="/signup" className="font-medium text-primary-600 hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  )
}

export default Login
