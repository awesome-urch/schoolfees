'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''

  const [formData, setFormData] = useState({ password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token || !email) {
      setError('Invalid reset link. Request a new one from the login page.')
      return
    }
    if (formData.password !== formData.confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        email,
        token,
        password: formData.password,
      })
      router.push('/auth/login?reset=success')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {(!token || !email) && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-sm">
            This reset link looks incomplete. Request a fresh one from{' '}
            <Link href="/auth/forgot-password" className="font-semibold underline">forgot password</Link>.
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="password"
              type="password"
              placeholder="Min 8 chars — upper, lower, number, symbol"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="pl-10"
              required
              minLength={8}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="confirm"
              type="password"
              placeholder="Repeat the new password"
              value={formData.confirm}
              onChange={(e) => setFormData({ ...formData, confirm: e.target.value })}
              className="pl-10"
              required
              minLength={8}
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading || !token || !email}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            'Set New Password'
          )}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
          ← Back to Sign In
        </Link>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,rgba(239,246,255,0.72),rgba(255,255,255,0.6),rgba(238,242,255,0.72)),url('/images/login-bg.svg')] bg-cover bg-center bg-fixed flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4">
            <img src="/icons/icon-nav.png" alt="SchoolFees" className="h-10 w-10 rounded-md" />
            <span className="text-3xl font-extrabold"><span className="text-blue-600">School</span><span className="text-orange-500">Fees</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600">Choose a new password for your account</p>
        </div>

        <Suspense fallback={<div className="bg-white rounded-xl shadow-lg p-8 text-center text-gray-500">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
