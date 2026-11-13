'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, CheckCircle, XCircle, Clock, Search, Plus, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'
import LiveClock from '@/components/LiveClock'

export default function PaymentsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [schools, setSchools] = useState<any[]>([])
  const [selectedSchool, setSelectedSchool] = useState<string>('')
  const [payments, setPayments] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPayments, setFilteredPayments] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [deleting, setDeleting] = useState(false)
  // manual payment state
  const [students, setStudents] = useState<any[]>([])
  const [feeTypes, setFeeTypes] = useState<any[]>([])
  const [showManualModal, setShowManualModal] = useState(false)
  const [manualForm, setManualForm] = useState({
    studentId: '',
    feeTypeId: '',
    amount: '',
    paymentDate: '',
    reference: '',
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    fetchSchools()
  }, [router])

  const fetchSchools = async () => {
    try {
      const response = await api.get('/schools')
      setSchools(response.data)
      if (response.data.length > 0) {
        setSelectedSchool(response.data[0].id.toString())
        fetchPayments(response.data[0].id)
        fetchStats(response.data[0].id)
        fetchRefs(response.data[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch schools:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPayments = async (schoolId: number) => {
    try {
      const response = await api.get(`/payments/school/${schoolId}`)
      setPayments(response.data)
      setFilteredPayments(response.data)
      setSelectedIds(new Set())
    } catch (error) {
      console.error('Failed to fetch payments:', error)
    }
  }

  const fetchStats = async (schoolId: number) => {
    try {
      const response = await api.get(`/payments/school/${schoolId}/stats`)
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchRefs = async (schoolId: number) => {
    try {
      const [stRes, ftRes] = await Promise.all([
        api.get(`/students/school/${schoolId}`),
        api.get(`/fees/school/${schoolId}`),
      ])
      setStudents(stRes.data)
      setFeeTypes(ftRes.data)
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/payments/manual', {
        schoolId: +selectedSchool,
        studentId: +manualForm.studentId,
        feeTypeId: +manualForm.feeTypeId,
        amount: +manualForm.amount,
        paymentDate: manualForm.paymentDate || undefined,
        reference: manualForm.reference || undefined,
      })
      alert('Payment recorded!')
      setShowManualModal(false)
      setManualForm({ studentId: '', feeTypeId: '', amount: '', paymentDate: '', reference: '' })
      fetchPayments(+selectedSchool)
      fetchStats(+selectedSchool)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to record payment')
    }
  }

  const handleSchoolChange = (schoolId: string) => {
    setSelectedSchool(schoolId)
    setSelectedIds(new Set())
    fetchPayments(parseInt(schoolId))
    fetchStats(parseInt(schoolId))
    fetchRefs(parseInt(schoolId))
  }

  const isDeletable = (p: any) => p.status === 'pending' || p.status === 'failed'

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    const deletableIds = filteredPayments.filter(isDeletable).map((p) => p.id)
    setSelectedIds((prev) =>
      deletableIds.every((id) => prev.has(id)) && deletableIds.length > 0
        ? new Set()
        : new Set(deletableIds)
    )
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} selected payment(s)? This cannot be undone.`)) return

    setDeleting(true)
    try {
      const res = await api.post('/payments/bulk-delete', {
        schoolId: +selectedSchool,
        paymentIds: Array.from(selectedIds),
      })
      const { deleted, skipped } = res.data
      alert(
        skipped > 0
          ? `${deleted} payment(s) deleted. ${skipped} skipped (only pending/failed payments can be deleted).`
          : `${deleted} payment(s) deleted.`
      )
      fetchPayments(+selectedSchool)
      fetchStats(+selectedSchool)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete payments')
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    if (searchTerm) {
      const filtered = payments.filter((p: any) =>
        p.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.student?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.student?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.student?.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredPayments(filtered)
    } else {
      setFilteredPayments(payments)
    }
  }, [searchTerm, payments])

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    router.push('/auth/login')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'successful':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Successful
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </span>
        )
      default:
        return null
    }
  }

  if (loading && schools.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <img src="/icons/icon-nav.png" alt="SchoolFees" className="h-9 w-auto rounded-md" />
              <span className="text-2xl font-extrabold"><span className="text-blue-600">School</span><span className="text-orange-500">Fees</span></span>
            </Link>
            <div className="flex items-center space-x-4">
              <LiveClock />
              <span className="text-sm text-gray-600">{user?.fullName}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <Link href="/dashboard" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link href="/dashboard/schools" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
              Schools
            </Link>
            <Link href="/dashboard/sessions" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300">
              Sessions
            </Link>
            <Link href="/dashboard/students" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
              Students
            </Link>
            <Link href="/dashboard/academics" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
              Academics
            </Link>
            <Link href="/dashboard/fees" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
              Fees
            </Link>
            <Link href="/dashboard/payments" className="py-4 px-2 border-b-2 border-blue-600 text-blue-600 font-medium">
              Payments
            </Link>
            <Link href="/dashboard/accounts" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
              Accounts
            </Link>
            <Link href="/dashboard/settings" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
              Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Transactions</h1>
          <p className="text-gray-600">View and monitor all payment transactions</p>
        </div>

        {/* School Selector */}
        {schools.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <Label htmlFor="schoolSelect">Select School</Label>
            <select
              id="schoolSelect"
              value={selectedSchool}
              onChange={(e) => handleSchoolChange(e.target.value)}
              className="mt-2 flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mb-4">
          {selectedIds.size > 0 && (
            <Button
              variant="outline"
              onClick={handleBulkDelete}
              disabled={deleting}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Selected ({selectedIds.size})
            </Button>
          )}
          <Button onClick={() => { fetchRefs(+selectedSchool); setShowManualModal(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Manual Payment
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <span className="text-xl font-bold text-green-600">₦</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">₦{stats.totalRevenue?.toLocaleString() || 0}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Successful</p>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.successfulCount || 0}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Pending</p>
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount || 0}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Failed</p>
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.failedCount || 0}</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by reference, student name, or admission number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                      checked={
                        filteredPayments.filter(isDeletable).length > 0 &&
                        filteredPayments.filter(isDeletable).every((p) => selectedIds.has(p.id))
                      }
                      onChange={toggleSelectAll}
                      title="Select all pending/failed payments"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <span className="block text-5xl font-bold text-gray-300 mb-4">₦</span>
                      <p className="text-gray-500">No payments yet</p>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className={`hover:bg-gray-50 ${selectedIds.has(payment.id) ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                          checked={selectedIds.has(payment.id)}
                          disabled={!isDeletable(payment)}
                          onChange={() => toggleSelect(payment.id)}
                          title={isDeletable(payment) ? 'Select payment' : 'Only pending/failed payments can be deleted'}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{payment.reference}</div>
                        <div className="text-xs text-gray-500 capitalize">{payment.paymentMethod}</div>
                        {payment.paystackReference && (
                          <div className="text-xs text-gray-500">{payment.paystackReference}</div>
                        )}
                        {payment.remittaRrr && (
                          <div className="text-xs text-gray-500">RRR: {payment.remittaRrr}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.student?.firstName} {payment.student?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{payment.student?.admissionNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.feeType?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ₦{payment.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(payment.createdAt).toLocaleDateString()}
                        <div className="text-xs text-gray-400">
                          {new Date(payment.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manual Payment Modal */}
        {showManualModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Add Manual Payment</h2>
                  <button onClick={() => setShowManualModal(false)} className="text-gray-400 hover:text-gray-600">
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="student">Student *</Label>
                    <select
                      id="student"
                      required
                      value={manualForm.studentId}
                      onChange={(e) => setManualForm({ ...manualForm, studentId: e.target.value })}
                      className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select student</option>
                      {students.map((s:any) => (
                        <option key={s.id} value={s.id}>
                          {s.admissionNumber} - {s.firstName} {s.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="feeType">Fee Type *</Label>
                    <select
                      id="feeType"
                      required
                      value={manualForm.feeTypeId}
                      onChange={(e) => setManualForm({ ...manualForm, feeTypeId: e.target.value })}
                      className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select fee</option>
                      {feeTypes.map((f:any) => (
                        <option key={f.id} value={f.id}>{f.name} - ₦{f.amount}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      required
                      value={manualForm.amount}
                      onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="paymentDate">Payment Date</Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      value={manualForm.paymentDate}
                      onChange={(e) => setManualForm({ ...manualForm, paymentDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="reference">Reference</Label>
                    <Input
                      id="reference"
                      value={manualForm.reference}
                      onChange={(e) => setManualForm({ ...manualForm, reference: e.target.value })}
                      placeholder="Optional reference"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowManualModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">
                      Save Payment
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
