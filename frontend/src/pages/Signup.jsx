import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'
import ErrorMessage from '../components/ErrorMessage'

function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | error
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (status === 'loading') return
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
