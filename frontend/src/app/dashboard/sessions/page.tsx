'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, LogOut, Plus, Calendar, Edit, Trash2, X, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'

export default function SessionsManagementPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [schools, setSchools] = useState<any[]>([])
  const [selectedSchool, setSelectedSchool] = useState<string>('')
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSession, setEditingSession] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
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
        fetchSessions(response.data[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch schools:', error)
    } finally {
      setLoading(false)
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

  const handleSchoolChange = (schoolId: string) => {
    setSelectedSchool(schoolId)
    fetchSessions(parseInt(schoolId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        schoolId: parseInt(selectedSchool),
      }

      if (editingSession) {
        await api.patch(`/academic-sessions/${editingSession.id}/school/${selectedSchool}`, payload)
        alert('Academic session updated successfully!')
      } else {
        await api.post('/academic-sessions', payload)
        alert('Academic session created successfully!')
      }

      setShowModal(false)
      resetForm()
      fetchSessions(parseInt(selectedSchool))
    } catch (error: any) {
      alert(error.response?.data?.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (session: any) => {
    setEditingSession(session)
    setFormData({
      name: session.name,
      startDate: session.startDate.split('T')[0],
      endDate: session.endDate.split('T')[0],
    })
    setShowModal(true)
  }

  const handleSetCurrent = async (sessionId: number) => {
    if (!confirm('Set this as the current academic session?')) return

    try {
      await api.patch(`/academic-sessions/${sessionId}/school/${selectedSchool}/set-current`, {})
      alert('Current session updated successfully!')
      fetchSessions(parseInt(selectedSchool))
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to set current session')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      startDate: '',
      endDate: '',
    })
    setEditingSession(null)
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
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                SchoolFees
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.fullName}</span>
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
          <div className="flex space-x-8 overflow-x-auto">
            <Link href="/dashboard" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 whitespace-nowrap">
              Dashboard
            </Link>
            <Link href="/dashboard/schools" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 whitespace-nowrap">
              Schools
            </Link>
            <Link href="/dashboard/sessions" className="py-4 px-2 border-b-2 border-blue-600 text-blue-600 font-medium whitespace-nowrap">
              Sessions
            </Link>
            <Link href="/dashboard/students" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 whitespace-nowrap">
              Students
            </Link>
            <Link href="/dashboard/classes" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 whitespace-nowrap">
              Classes
            </Link>
            <Link href="/dashboard/fees" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 whitespace-nowrap">
              Fees
            </Link>
            <Link href="/dashboard/payments" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 whitespace-nowrap">
              Payments
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Academic Sessions</h1>
            <p className="text-gray-600">Manage academic years and terms</p>
          </div>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Session
          </Button>
        </div>

        {/* School Selector */}
        {schools.length > 1 && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <Label htmlFor="schoolSelect">Select School</Label>
            <select
              id="schoolSelect"
              value={selectedSchool}
              onChange={(e) => handleSchoolChange(e.target.value)}
              className="mt-2 flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Info Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Academic sessions are required before you can create fee types. Set one session as "Current" to use it as the default.
          </p>
        </div>

        {/* Sessions List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No academic sessions yet</p>
              <Button onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Session
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Session Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {session.isCurrent && (
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          )}
                          <span className="font-medium text-gray-900">{session.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(session.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(session.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {session.isCurrent ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Current
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          {!session.isCurrent && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetCurrent(session.id)}
                            >
                              Set Current
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(session)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingSession ? 'Edit Academic Session' : 'Add Academic Session'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Session Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., 2023/2024 - First Term"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-500">
                  Format: YYYY/YYYY - Term Name (e.g., 2023/2024 - First Term)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Saving...' : editingSession ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

