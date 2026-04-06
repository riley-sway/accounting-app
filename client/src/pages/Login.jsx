import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function Login() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { password })
      localStorage.setItem('auth_token', res.data.token)
      navigate('/')
    } catch {
      setError('Incorrect password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-8"
            style={{ backgroundColor: '#0F172A' }}
          >
            <img src="/sway-favicon.png" alt="Sway" className="w-7 h-7 object-contain" />
          </div>
          <h1
            className="text-2xl font-extrabold mb-1 tracking-tight"
            style={{ fontFamily: 'Manrope, sans-serif', color: '#0F172A' }}
          >
            Welcome back
          </h1>
          <p className="text-sm mb-8" style={{ color: '#64748b' }}>
            Sign in to Sway Creative
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#45464d' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="Enter your password"
              />
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 rounded-lg text-sm font-bold text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#0F172A', fontFamily: 'Manrope, sans-serif' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
