'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, CheckCircle, XCircle, Loader2, Download, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { publicApi } from '@/lib/api'

export default function PaymentVerifyPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [payment, setPayment] = useState<any>(null)
  const [error, setError] = useState('')
  const reference = searchParams.get('reference')

  useEffect(() => {
    if (!reference) {
      setError('No payment reference provided')
      setLoading(false)
      return
    }

    verifyPayment(reference)
  }, [reference])

  const verifyPayment = async (ref: string) => {
    try {
      const response = await publicApi.get(`/payments/verify/${ref}`)
      setPayment(response.data.payment)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment verification failed')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <nav className="border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              SchoolFees
            </span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {error ? (
            // Error State
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Failed</h1>
              <p className="text-gray-600 mb-8">{error}</p>
              <div className="flex gap-4 justify-center">
                <Link href="/student/pay">
                  <Button>Try Again</Button>
                </Link>
                <Link href="/">
                  <Button variant="outline">
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                </Link>
              </div>
            </div>
          ) : payment?.status === 'successful' ? (
            // Success State
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
              <p className="text-gray-600 mb-8">Your payment has been confirmed</p>

              {/* Payment Details */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                <h2 className="font-semibold text-gray-900 mb-4">Payment Details</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reference:</span>
                    <span className="font-medium text-gray-900">{payment.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Student:</span>
                    <span className="font-medium text-gray-900">
                      {payment.student?.firstName} {payment.student?.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fee Type:</span>
                    <span className="font-medium text-gray-900">{payment.feeType?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold text-green-600 text-lg">
                      ₦{payment.amount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(payment.paidAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="flex-1" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
                <Link href="/" className="flex-1">
                  <Button className="w-full">
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                </Link>
              </div>

              {/* Info Note */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> A receipt has been sent to your email. Please keep this reference number for your records.
                </p>
              </div>
            </div>
          ) : (
            // Pending/Other State
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="h-12 w-12 text-yellow-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Pending</h1>
              <p className="text-gray-600 mb-8">
                Your payment is being processed. Please check back later or contact your school.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => verifyPayment(reference!)}>Check Again</Button>
                <Link href="/">
                  <Button variant="outline">
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

