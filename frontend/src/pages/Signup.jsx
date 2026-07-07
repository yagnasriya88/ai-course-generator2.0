import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Flame, Sparkles, Star, TrendingUp } from 'lucide-react'
import { useSignUp } from '@clerk/clerk-react'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'
import AuthTextField from '../components/AuthTextField'
import ErrorMessage from '../components/ErrorMessage'
import GoogleAuthButton from '../components/GoogleAuthButton'

const SIGNUP_FEATURES = [
  {
    icon: Sparkles,
    title: 'AI-powered learning',
    description: 'A crew of AI agents builds and enriches a full course from any topic you type.',
  },
  {
    icon: TrendingUp,
    title: 'Real progress tracking',
    description: 'See lesson and quiz completion across every course, at a glance.',
  },
  {
    icon: Flame,
    title: 'Build a daily streak',
    description: 'Show up each day and watch your learning streak grow.',
  },
  {
    icon: Star,
    title: 'Earn XP and gold',
    description: 'Complete lessons to earn XP and gold, and level up as you go.',
  },
]

function splitName(fullName) {
  const trimmed = fullName.trim().replace(/\s+/g, ' ')
  const spaceIndex = trimmed.indexOf(' ')
  if (spaceIndex === -1) return { firstName: trimmed, lastName: '' }
  return { firstName: trimmed.slice(0, spaceIndex), lastName: trimmed.slice(spaceIndex + 1) }
}

function Signup() {
  const { signUp, setActive, isLoaded } = useSignUp()
  const { status } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('form') // form | verify
  const [pending, setPending] = useState(null) // null | 'google' | 'password' | 'verify'
  const [error, setError] = useState(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')

  // A Clerk session already exists in this browser — re-showing the signup
  // form would throw "Session already exists" on submit, so bounce onward.
  if (status === 'authed') return <Navigate to="/" replace />

  async function handleGoogle() {
    if (!isLoaded || pending) return
    setPending('google')
    setError(null)
    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/',
      })
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Something went wrong. Please try again.')
      setPending(null)
    }
  }

  async function handleSignup(event) {
    event.preventDefault()
    if (!isLoaded || pending) return
    setPending('password')
    setError(null)
    try {
      const { firstName, lastName } = splitName(name)
      await signUp.create({ firstName, lastName, emailAddress: email, password })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setStep('verify')
      setPending(null)
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Something went wrong. Please try again.')
      setPending(null)
    }
  }

  async function handleVerify(event) {
    event.preventDefault()
    if (!isLoaded || pending) return
    setPending('verify')
    setError(null)
    try {
      const result = await signUp.attemptEmailAddressVerification({ code })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        navigate('/', { replace: true })
      } else {
        setError("That code didn't work. Please check and try again.")
        setPending(null)
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Invalid or expired code.')
      setPending(null)
    }
  }

  if (step === 'verify') {
    return (
      <AuthLayout
        heading="Check your email"
        subheading={`We sent a 6-digit code to ${email}.`}
        features={SIGNUP_FEATURES}
      >
        <form onSubmit={handleVerify} className="mt-8 flex flex-col gap-4">
          <AuthTextField
            label="Verification code"
            type="text"
            value={code}
            onChange={setCode}
            autoComplete="one-time-code"
            required
          />
          <button
            type="submit"
            disabled={pending !== null}
            className="mt-1 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending === 'verify' ? 'Verifying…' : 'Verify & continue'}
          </button>
        </form>

        {error && (
          <div className="mt-4">
            <ErrorMessage message={error} />
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setStep('form')
            setPending(null)
            setError(null)
          }}
          className="mt-6 w-full text-center text-sm text-slate-500 hover:underline"
        >
          Back
        </button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      heading="Create your account"
      subheading="Your generated courses are private to you."
      features={SIGNUP_FEATURES}
    >
      <div className="mt-8 flex flex-col gap-3">
        <GoogleAuthButton onClick={handleGoogle} loading={pending === 'google'} label="Sign up with Google" />
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium tracking-wide text-slate-400 uppercase">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        <AuthTextField label="Name" type="text" value={name} onChange={setName} autoComplete="name" required />
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
          autoComplete="new-password"
          required
          minLength={8}
        />
        {/* Clerk's smart CAPTCHA renders into this element for bot protection when a challenge is needed */}
        <div id="clerk-captcha" />
        <button
          type="submit"
          disabled={pending !== null}
          className="mt-1 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending === 'password' ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      {error && (
        <div className="mt-4">
          <ErrorMessage message={error} />
        </div>
      )}

      <p className="mt-6 text-center text-xs text-slate-400">
        By continuing, you agree to sign up securely via Clerk.
      </p>

      <p className="mt-4 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary-600 hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}

export default Signup
