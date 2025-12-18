'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { GraduationCap, Loader2, CreditCard, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { publicApi } from '@/lib/api'

export default function StudentPaymentPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [student, setStudent] = useState<any>(null)
  const [fees, setFees] = useState<any[]>([])
  const [schools, setSchools] = useState<any[]>([])
  const [filteredSchools, setFilteredSchools] = useState<any[]>([])
  const [schoolSearchTerm, setSchoolSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    schoolId: '',
    admissionNumber: '',
    email: '',
    selectedFeeId: '',
  })

  // Fetch all schools on mount
  useEffect(() => {
    fetchSchools()
  }, [])

  // Filter schools based on search term
  useEffect(() => {
    if (schoolSearchTerm) {
      const filtered = schools.filter(school =>
        school.name.toLowerCase().includes(schoolSearchTerm.toLowerCase()) ||
        school.address?.toLowerCase().includes(schoolSearchTerm.toLowerCase())
      )
      setFilteredSchools(filtered)
    } else {
      setFilteredSchools(schools)
    }
  }, [schoolSearchTerm, schools])

  const fetchSchools = async () => {
    try {
      const response = await publicApi.get('/schools/public/list')
      setSchools(response.data)
      setFilteredSchools(response.data)
    } catch (err) {
      console.error('Failed to fetch schools:', err)
      setError('Failed to load schools. Please refresh the page.')
    }
  }

  const handleFindStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await publicApi.get(
        `/students/admission/${formData.admissionNumber}/school/${formData.schoolId}`
      )
      setStudent(response.data)

      // Fetch available fees for this student
      const feesResponse = await publicApi.get(`/fees/school/${formData.schoolId}`)
      setFees(feesResponse.data)

      setStep(2)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Student not found')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    setLoading(true)
    setError('')

    try {
      const selectedFee = fees.find((f) => f.id === parseInt(formData.selectedFeeId))
      
      if (!selectedFee) {
        setError('Selected fee not found')
        setLoading(false)
        return
      }

      const response = await publicApi.post('/payments/initialize', {
        schoolId: parseInt(formData.schoolId),
        studentId: student.id,
        feeTypeId: parseInt(formData.selectedFeeId),
        amount: Number(selectedFee.amount),
        email: formData.email,
        paymentMethod: 'paystack',
      })

      // Redirect to Paystack
      window.location.href = response.data.authorizationUrl
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment initialization failed')
    } finally {
      setLoading(false)
    }
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
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pay School Fees</h1>
            <p className="text-gray-600">Quick and secure online payment</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            {step === 1 ? (
              <form onSubmit={handleFindStudent} className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Step 1: Find Student</h2>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="schoolSearch">Search Your School</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="schoolSearch"
                      type="text"
                      placeholder="Type school name or address..."
                      value={schoolSearchTerm}
                      onChange={(e) => setSchoolSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolId">Select School</Label>
                  <select
                    id="schoolId"
                    value={formData.schoolId}
                    onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="">-- Select your school --</option>
                    {filteredSchools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                        {school.address && ` - ${school.address.substring(0, 50)}${school.address.length > 50 ? '...' : ''}`}
                      </option>
                    ))}
                  </select>
                  {filteredSchools.length === 0 && schoolSearchTerm && (
                    <p className="text-xs text-amber-600">No schools found. Try a different search.</p>
                  )}
                  {schools.length === 0 && !error && (
                    <p className="text-xs text-gray-500">Loading schools...</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admissionNumber">Admission Number</Label>
                  <Input
                    id="admissionNumber"
                    type="text"
                    placeholder="Enter admission number"
                    value={formData.admissionNumber}
                    onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-500">Receipt will be sent to this email</p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finding student...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Step 2: Select Fee & Pay</h2>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Student Information</h3>
                  <p className="text-sm text-gray-600">
                    <strong>Name:</strong> {student?.firstName} {student?.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Admission No:</strong> {student?.admissionNumber}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Class:</strong> {student?.class?.name || 'Not assigned'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feeType">Select Fee Type</Label>
                  <select
                    id="feeType"
                    value={formData.selectedFeeId}
                    onChange={(e) => setFormData({ ...formData, selectedFeeId: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="">-- Select a fee --</option>
                    {fees.map((fee) => (
                      <option key={fee.id} value={fee.id}>
                        {fee.name} - ₦{fee.amount.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.selectedFeeId && (() => {
                  const fee = fees.find((f) => f.id === parseInt(formData.selectedFeeId))
                  const feeAmount = Number(fee?.amount || 0)
                  // Calculate transaction fee (1.5% + ₦100, capped at ₦2,000)
                  let transactionFee = (feeAmount * 0.015) + 100
                  if (transactionFee > 2000) transactionFee = 2000
                  const totalAmount = feeAmount + transactionFee
                  
                  return (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900 mb-3">
                        <strong>Payment Breakdown:</strong>
                      </p>
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Fee Amount:</span>
                          <span className="font-semibold text-gray-900">₦{feeAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Transaction Fee:</span>
                          <span className="font-semibold text-gray-900">₦{Math.round(transactionFee).toLocaleString()}</span>
                        </div>
                        <div className="border-t border-blue-300 pt-2">
                          <div className="flex justify-between">
                            <span className="text-blue-900 font-semibold">Total to Pay:</span>
                            <span className="text-2xl font-bold text-blue-600">₦{Math.round(totalAmount).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-blue-700">
                        * Transaction fee covers payment processing charges
                      </p>
                    </div>
                  )
                })()}

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={handlePayment}
                    disabled={!formData.selectedFeeId || loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Proceed to Payment'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
