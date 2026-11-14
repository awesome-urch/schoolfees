'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CreditCard, Search, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { publicApi } from '@/lib/api'
import { openRemitaCheckout } from '@/lib/remita'

function StudentPaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
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
    paymentMethod: 'remitta',
  })
  const [selectedFeeIds, setSelectedFeeIds] = useState<number[]>([])
  const [feeDropdownOpen, setFeeDropdownOpen] = useState(false)

  const paidFeeIds = new Set(
    (student?.payments || [])
      .filter((p: any) => p.status === 'successful')
      .map((p: any) => p.feeTypeId)
  )

  const unpaidFees = fees.filter((f: any) => !paidFeeIds.has(f.id))
  const selectedFees = fees.filter((f: any) => selectedFeeIds.includes(f.id))
  const selectedTotal = selectedFees.reduce((sum: number, f: any) => sum + Number(f.amount), 0)

  const toggleFee = (id: number) => {
    setSelectedFeeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    setSelectedFeeIds((prev) =>
      prev.length === unpaidFees.length ? [] : unpaidFees.map((f: any) => f.id)
    )
  }

  // Fetch all schools on mount
  useEffect(() => {
    fetchSchools()
  }, [])

  // Prefill school/admission number when arriving via a school's direct link,
  // e.g. /student/pay?school=5&admission=ADM001
  useEffect(() => {
    if (schools.length === 0) return

    const schoolParam = searchParams.get('school')
    const admissionParam = searchParams.get('admission')
    const schoolValid = schoolParam && schools.some((s) => s.id === parseInt(schoolParam))

    if (schoolParam || admissionParam) {
      setFormData((prev) => ({
        ...prev,
        schoolId: schoolValid ? schoolParam : prev.schoolId,
        admissionNumber: admissionParam || prev.admissionNumber,
      }))
    }

    // When the link carries school + admission, resolve the student
    // immediately so the parent sees the child's name straight away.
    if (schoolValid && admissionParam && !student) {
      lookupStudent(schoolParam, admissionParam)
    }
  }, [schools, searchParams])

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

  const lookupStudent = async (schoolId: string, admissionNumber: string) => {
    setLoading(true)
    setError('')

    try {
      const response = await publicApi.get(
        `/students/admission/${encodeURIComponent(admissionNumber.trim())}/school/${schoolId}`
      )
      setStudent(response.data)

      // Fetch available fees for this student — school-wide fees plus
      // fees scoped to the student's class (faculty).
      const feesResponse = await publicApi.get(`/fees/school/${schoolId}`)
      const studentClassId = response.data?.classId
      setFees(
        feesResponse.data.filter(
          (fee: any) =>
            fee.isActive !== false &&
            (!fee.class || fee.class?.id === studentClassId)
        )
      )

      return true
    } catch (err: any) {
      setError(
        err.response?.status === 404
          ? 'Student not found. Check the school and admission number.'
          : err.response?.data?.message || 'Student not found'
      )
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleFindStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (student) {
      setStep(2)
      return
    }
    if (await lookupStudent(formData.schoolId, formData.admissionNumber)) {
      setStep(2)
    }
  }

  const handleResetStudent = () => {
    setStudent(null)
    setFees([])
    setError('')
    setFormData((prev) => ({ ...prev, schoolId: '', admissionNumber: '' }))
    setSelectedFeeIds([])
    setSchoolSearchTerm('')
  }

  const handlePayment = async () => {
    setLoading(true)
    setError('')

    try {
      if (selectedFees.length === 0) {
        setError('Please select at least one fee item')
        setLoading(false)
        return
      }

      const response = await publicApi.post('/payments/initialize', {
        schoolId: parseInt(formData.schoolId),
        studentId: student.id,
        feeTypeId: selectedFeeIds[0],
        feeTypeIds: selectedFeeIds,
        amount: selectedTotal,
        email: formData.email || undefined,
        paymentMethod: formData.paymentMethod,
      })

      if (response.data.remita) {
        // Remita Payment Gateway: open the inline widget, then verify by
        // reference once the payer completes the checkout.
        const { reference } = response.data
        await openRemitaCheckout(response.data.remita, {
          onSuccess: () => router.push(`/payment/verify?reference=${reference}`),
          onError: (res: any) => {
            console.error('Remita widget error', res)
            const detail = res?.message || res?.responseMsg || res?.responseCode
            setError(
              detail
                ? `Remitta payment failed: ${detail}`
                : 'Remitta payment failed. Please try again.'
            )
            setLoading(false)
          },
          onClose: () => setLoading(false),
        })
        return
      }

      // Redirect to Paystack
      window.location.href = response.data.authorizationUrl
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment initialization failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,rgba(239,246,255,0.72),rgba(255,255,255,0.6),rgba(238,242,255,0.72)),url('/images/pay-bg.svg')] bg-cover bg-center bg-fixed">
      {/* Header */}
      <nav className="border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/icons/icon-nav.png" alt="SchoolFees" className="h-9 w-auto rounded-md" />
            <span className="text-2xl font-extrabold"><span className="text-blue-600">School</span><span className="text-orange-500">Fees</span></span>
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

                {student ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-green-700 mb-2">STUDENT FOUND</p>
                    <p className="text-sm text-gray-900">
                      <strong>Name:</strong> {student.firstName} {student.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Admission No:</strong> {student.admissionNumber}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Class:</strong> {student.class?.name || 'Not assigned'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>School:</strong> {student.school?.name}
                    </p>
                    <button
                      type="button"
                      onClick={handleResetStudent}
                      className="text-xs text-blue-600 hover:underline mt-2"
                    >
                      Not your child? Search again
                    </button>
                  </div>
                ) : (
                  <>
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

                  </>
                )}

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
                  <Label>What do you want to pay?</Label>
                  <button
                    type="button"
                    onClick={() => setFeeDropdownOpen((v) => !v)}
                    className="w-full flex items-center justify-between rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-left transition hover:border-blue-300"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {selectedFeeIds.length > 0
                        ? `${selectedFeeIds.length} fee${selectedFeeIds.length > 1 ? 's' : ''} selected — ₦${selectedTotal.toLocaleString()}`
                        : 'Select fee(s) to pay'}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-gray-400 transition-transform ${feeDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {feeDropdownOpen && (
                    <div className="overflow-hidden rounded-lg border-2 border-gray-200 bg-white shadow-lg divide-y divide-gray-100">
                      {unpaidFees.length > 1 && (
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-blue-600 hover:bg-blue-50"
                        >
                          {selectedFeeIds.length === unpaidFees.length ? 'Deselect all' : 'Select all'}
                        </button>
                      )}
                      {fees.map((fee) => {
                        const paid = paidFeeIds.has(fee.id)
                        const selected = selectedFeeIds.includes(fee.id)
                        return (
                          <button
                            key={fee.id}
                            type="button"
                            disabled={paid}
                            onClick={() => toggleFee(fee.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                              paid
                                ? 'bg-gray-50 opacity-60 cursor-not-allowed'
                                : selected
                                  ? 'bg-blue-50'
                                  : 'bg-white hover:bg-blue-50/50'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center ${
                                paid
                                  ? 'border-gray-300 bg-gray-100'
                                  : selected
                                    ? 'border-blue-600 bg-blue-600'
                                    : 'border-gray-300 bg-white'
                              }`}
                            >
                              {selected && (
                                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">{fee.name}</p>
                              {fee.session?.name && (
                                <p className="text-xs text-gray-500">{fee.session.name}</p>
                              )}
                            </div>
                            {paid ? (
                              <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                Paid
                              </span>
                            ) : (
                              <span className="text-lg font-bold text-gray-900">
                                ₦{Number(fee.amount).toLocaleString()}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {fees.length === 0 && (
                    <p className="text-sm text-gray-500">No fees found for this student.</p>
                  )}
                  {fees.length > 0 && fees.every((f) => paidFeeIds.has(f.id)) && (
                    <p className="text-sm text-green-700">All fees have been paid.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <select
                    id="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="remitta">Remita</option>
                    <option value="paystack">Paystack</option>
                  </select>
                </div>

                {selectedFees.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900 mb-3">
                      <strong>Payment Breakdown:</strong>
                    </p>
                    <div className="space-y-2">
                      {selectedFees.map((f: any) => (
                        <div key={f.id} className="flex justify-between text-sm">
                          <span className="text-gray-700 truncate pr-2">{f.name}</span>
                          <span className="font-medium text-gray-900 whitespace-nowrap">₦{Number(f.amount).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="border-t border-blue-300 pt-2">
                        <div className="flex justify-between">
                          <span className="text-blue-900 font-semibold">Total to Pay:</span>
                          <span className="text-2xl font-bold text-blue-600">₦{selectedTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
                    disabled={selectedFeeIds.length === 0 || loading}
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
            <p className="mt-3 text-sm text-gray-500">
              Need help? Contact us:{' '}
              <a href="tel:08066133281" className="text-blue-600 hover:underline font-medium">08066133281</a>
              <span className="mx-1.5 text-gray-300">|</span>
              <a href="mailto:chinedueya@gmail.com" className="text-blue-600 hover:underline font-medium">chinedueya@gmail.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StudentPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <StudentPaymentContent />
    </Suspense>
  )
}
