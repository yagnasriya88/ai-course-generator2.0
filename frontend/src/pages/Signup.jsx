import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Flame, Sparkles, Star, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'
import ErrorMessage from '../components/ErrorMessage'

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

function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | error
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (status === 'loading') return
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setStatus('error')
      return
    }
    setStatus('loading')
    setError(null)
    try {
      await signup(name, email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  return (
    <AuthLayout
      heading="Create your account"
      subheading="Your generated courses are private to you."
      features={SIGNUP_FEATURES}
    >
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          required
          disabled={status === 'loading'}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200 disabled:opacity-60"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          disabled={status === 'loading'}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200 disabled:opacity-60"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min. 8 characters)"
          minLength={8}
          required
          disabled={status === 'loading'}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200 disabled:opacity-60"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm password"
          minLength={8}
          required
          disabled={status === 'loading'}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="mt-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'loading' ? 'Creating account…' : 'Sign up'}
        </button>
      </form>

      {status === 'error' && (
        <div className="mt-4">
          <ErrorMessage message={error} />
        </div>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary-600 hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}

export default Signup
