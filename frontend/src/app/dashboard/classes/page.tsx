'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, LogOut, Plus, Users, X, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'

export default function ClassesManagementPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [schools, setSchools] = useState<any[]>([])
  const [selectedSchool, setSelectedSchool] = useState<string>('')
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingClass, setEditingClass] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
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
        fetchClasses(response.data[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch schools:', error)
    } finally {
      setLoading(false)
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
    fetchClasses(parseInt(schoolId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingClass) {
        await api.patch(`/classes/${editingClass.id}/school/${selectedSchool}`, {
          name: formData.name,
          description: formData.description,
        })
        alert('Class updated successfully!')
      } else {
        await api.post('/classes', {
          ...formData,
          schoolId: parseInt(selectedSchool),
        })
        alert('Class created successfully!')
      }
      setShowModal(false)
      resetForm()
      fetchClasses(parseInt(selectedSchool))
    } catch (error: any) {
      alert(error.response?.data?.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (cls: any) => {
    setEditingClass(cls)
    setFormData({
      name: cls.name,
      description: cls.description || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (classId: number) => {
    if (!confirm('Are you sure you want to delete this class? Students in this class will have their class unassigned.')) return

    try {
      await api.delete(`/classes/${classId}/school/${selectedSchool}`)
      alert('Class deleted successfully!')
      fetchClasses(parseInt(selectedSchool))
    } catch (error: any) {
      alert(error.response?.data?.message || 'Delete failed')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
    })
    setEditingClass(null)
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
            <Link href="/dashboard/sessions" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300">
              Sessions
            </Link>
            <Link href="/dashboard/students" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
              Students
            </Link>
            <Link href="/dashboard/classes" className="py-4 px-2 border-b-2 border-blue-600 text-blue-600 font-medium">
              Classes
            </Link>
            <Link href="/dashboard/fees" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
              Fees
            </Link>
            <Link href="/dashboard/payments" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
              Payments
            </Link>
            <Link href="/dashboard/accounts" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
              Accounts
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Classes Management</h1>
            <p className="text-gray-600">Manage classes/grades for your schools</p>
          </div>
          <Button onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Class
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

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {classes.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Classes Yet</h3>
              <p className="text-gray-600 mb-4">Create classes like JSS1, SS2, etc.</p>
              <Button onClick={() => { resetForm(); setShowModal(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Class
              </Button>
            </div>
          ) : (
            classes.map((cls) => (
              <div key={cls.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{cls.name}</h3>
                {cls.description && (
                  <p className="text-sm text-gray-600 mb-4">{cls.description}</p>
                )}
                <div className="pt-4 border-t space-y-2">
                  <p className="text-xs text-gray-500">
                    Created: {new Date(cls.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEdit(cls)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(cls.id)}
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
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add New Class</h2>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Class Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., JSS 1, SS 2, Primary 3"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
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

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowModal(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? 'Saving...' : (editingClass ? 'Update Class' : 'Create Class')}
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
