'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, LogOut, Plus, DollarSign, Edit, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'

export default function FeesManagementPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [schools, setSchools] = useState<any[]>([])
  const [selectedSchool, setSelectedSchool] = useState<string>('')
  const [fees, setFees] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingFee, setEditingFee] = useState<any>(null)
  const [formData, setFormData] = useState({
    schoolId: '',
    sessionId: '',
    classId: '',
    name: '',
    description: '',
    amount: '',
    isActive: true,
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
        fetchFees(response.data[0].id)
        fetchSessions(response.data[0].id)
        fetchClasses(response.data[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch schools:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFees = async (schoolId: number) => {
    try {
      const response = await api.get(`/fees/school/${schoolId}`)
      setFees(response.data)
    } catch (error) {
      console.error('Failed to fetch fees:', error)
    }
  }

  const fetchSessions = async (schoolId: number) => {
    try {
      const response = await api.get(`/academic-sessions/school/${schoolId}`)
      setSessions(response.data)
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    }
  }

  const fetchClasses = async (schoolId: number) => {
    try {
      const response = await api.get(`/classes/school/${schoolId}`)
      setClasses(response.data)
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    }
  }

  const handleSchoolChange = (schoolId: string) => {
    setSelectedSchool(schoolId)
    fetchFees(parseInt(schoolId))
    fetchSessions(parseInt(schoolId))
    fetchClasses(parseInt(schoolId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        schoolId: parseInt(selectedSchool),
        sessionId: parseInt(formData.sessionId),
        classId: formData.classId ? parseInt(formData.classId) : null,
        amount: parseFloat(formData.amount),
      }

      if (editingFee) {
        await api.patch(`/fees/${editingFee.id}/school/${selectedSchool}`, payload)
        alert('Fee updated successfully!')
      } else {
        await api.post('/fees', payload)
        alert('Fee created successfully!')
      }
      
      setShowModal(false)
      resetForm()
      fetchFees(parseInt(selectedSchool))
    } catch (error: any) {
      alert(error.response?.data?.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (fee: any) => {
    setEditingFee(fee)
    setFormData({
      schoolId: fee.schoolId,
      sessionId: fee.sessionId,
      classId: fee.classId || '',
      name: fee.name,
      description: fee.description || '',
      amount: fee.amount.toString(),
      isActive: fee.isActive,
    })
    setShowModal(true)
  }

  const handleDelete = async (feeId: number) => {
    if (!confirm('Are you sure you want to delete this fee?')) return

    try {
      await api.delete(`/fees/${feeId}/school/${selectedSchool}`)
      alert('Fee deleted successfully!')
      fetchFees(parseInt(selectedSchool))
    } catch (error: any) {
      alert(error.response?.data?.message || 'Delete failed')
    }
  }

  const resetForm = () => {
    setFormData({
      schoolId: '',
      sessionId: '',
      classId: '',
      name: '',
      description: '',
      amount: '',
      isActive: true,
    })
    setEditingFee(null)
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    router.push('/auth/login')
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
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                SchoolFees
              </span>
            </Link>
            <div className="flex items-center space-x-4">
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
            <Link href="/dashboard/students" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
              Students
            </Link>
            <Link href="/dashboard/classes" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
              Classes
            </Link>
            <Link href="/dashboard/fees" className="py-4 px-2 border-b-2 border-blue-600 text-blue-600 font-medium">
              Fees
            </Link>
            <Link href="/dashboard/payments" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
              Payments
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Fee Management</h1>
            <p className="text-gray-600">Manage fee structures for your schools</p>
          </div>
          <Button onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Fee Type
          </Button>
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

        {/* Fees Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fees.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
              <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Fee Types Yet</h3>
              <p className="text-gray-600 mb-4">Create fee types for tuition, sports, etc.</p>
              <Button onClick={() => { resetForm(); setShowModal(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Fee Type
              </Button>
            </div>
          ) : (
            fees.map((fee) => (
              <div key={fee.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      fee.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {fee.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{fee.name}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Amount:</span>
                      <span className="text-lg font-bold text-green-600">₦{fee.amount.toLocaleString()}</span>
                    </div>
                    {fee.description && (
                      <p className="text-sm text-gray-600">{fee.description}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Session: {fee.session?.name || 'N/A'}
                    </p>
                    {fee.class && (
                      <p className="text-xs text-gray-500">
                        Class: {fee.class.name}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEdit(fee)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(fee.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingFee ? 'Edit Fee Type' : 'Add New Fee Type'}
                </h2>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="name">Fee Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Tuition Fee, Sports Fee"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="sessionId">Academic Session *</Label>
                    <select
                      id="sessionId"
                      value={formData.sessionId}
                      onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Select Session</option>
                      {sessions.map((session) => (
                        <option key={session.id} value={session.id}>
                          {session.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="classId">Class (Optional)</Label>
                    <select
                      id="classId"
                      value={formData.classId}
                      onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">All Classes</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="amount">Amount (₦) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="isActive">Status</Label>
                    <select
                      id="isActive"
                      value={formData.isActive.toString()}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      rows={3}
                      placeholder="Optional description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowModal(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? 'Saving...' : (editingFee ? 'Update Fee' : 'Create Fee')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
