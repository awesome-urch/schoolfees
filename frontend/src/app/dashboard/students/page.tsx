'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, LogOut, Plus, Users, Edit, Trash2, X, Upload, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'

export default function StudentsManagementPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [schools, setSchools] = useState<any[]>([])
  const [selectedSchool, setSelectedSchool] = useState<string>('')
  const [students, setStudents] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<any>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    schoolId: '',
    classId: '',
    admissionNumber: '',
    firstName: '',
    lastName: '',
    otherNames: '',
    dateOfBirth: '',
    gender: 'male',
    email: '',
    phone: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    address: '',
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
        fetchStudents(response.data[0].id)
        fetchClasses(response.data[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch schools:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async (schoolId: number) => {
    try {
      const response = await api.get(`/students/school/${schoolId}`)
      setStudents(response.data)
    } catch (error) {
      console.error('Failed to fetch students:', error)
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
    fetchStudents(parseInt(schoolId))
    fetchClasses(parseInt(schoolId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        schoolId: parseInt(selectedSchool),
        classId: formData.classId ? parseInt(formData.classId) : null,
      }

      if (editingStudent) {
        await api.patch(`/students/${editingStudent.id}/school/${selectedSchool}`, payload)
        alert('Student updated successfully!')
      } else {
        await api.post('/students', payload)
        alert('Student created successfully!')
      }
      
      setShowModal(false)
      resetForm()
      fetchStudents(parseInt(selectedSchool))
    } catch (error: any) {
      alert(error.response?.data?.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile) {
      alert('Please select a file')
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('file', uploadFile)

    try {
      await api.post(`/students/bulk-upload/${selectedSchool}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      alert('Students uploaded successfully!')
      setShowUploadModal(false)
      setUploadFile(null)
      fetchStudents(parseInt(selectedSchool))
    } catch (error: any) {
      alert(error.response?.data?.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (student: any) => {
    setEditingStudent(student)
    setFormData({
      schoolId: student.schoolId,
      classId: student.classId || '',
      admissionNumber: student.admissionNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      otherNames: student.otherNames || '',
      dateOfBirth: student.dateOfBirth?.split('T')[0] || '',
      gender: student.gender,
      email: student.email || '',
      phone: student.phone || '',
      parentName: student.parentName,
      parentEmail: student.parentEmail || '',
      parentPhone: student.parentPhone,
      address: student.address || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (studentId: number) => {
    if (!confirm('Are you sure you want to delete this student?')) return

    try {
      await api.delete(`/students/${studentId}/school/${selectedSchool}`)
      alert('Student deleted successfully!')
      fetchStudents(parseInt(selectedSchool))
    } catch (error: any) {
      alert(error.response?.data?.message || 'Delete failed')
    }
  }

  const resetForm = () => {
    setFormData({
      schoolId: '',
      classId: '',
      admissionNumber: '',
      firstName: '',
      lastName: '',
      otherNames: '',
      dateOfBirth: '',
      gender: 'male',
      email: '',
      phone: '',
      parentName: '',
      parentEmail: '',
      parentPhone: '',
      address: '',
    })
    setEditingStudent(null)
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    router.push('/auth/login')
  }

  const downloadTemplate = () => {
    const template = `admissionNumber,firstName,lastName,otherNames,dateOfBirth,gender,email,phone,parentName,parentEmail,parentPhone,address,className
STU001,John,Doe,Michael,2010-05-15,male,john@example.com,08012345678,Jane Doe,jane@example.com,08087654321,123 Main St,JSS 1
STU002,Mary,Smith,Jane,2011-03-20,female,mary@example.com,08023456789,Peter Smith,peter@example.com,08098765432,456 Oak Ave,JSS 1
STU003,David,Johnson,Paul,2010-08-12,male,david@example.com,08034567890,Sarah Johnson,sarah@example.com,08076543210,789 Pine Rd,SS 2`
    
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'students_template.csv'
    a.click()
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
            <Link href="/dashboard/students" className="py-4 px-2 border-b-2 border-blue-600 text-blue-600 font-medium">
              Students
            </Link>
            <Link href="/dashboard/classes" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
              Classes
            </Link>
            <Link href="/dashboard/fees" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Students Management</h1>
            <p className="text-gray-600">Manage students across your schools</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowUploadModal(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>
            <Button onClick={() => { resetForm(); setShowModal(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </div>
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

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No students yet</p>
                      <Button onClick={() => { resetForm(); setShowModal(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Student
                      </Button>
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.admissionNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.class?.name || 'Not assigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.parentName}</div>
                        <div className="text-sm text-gray-500">{student.parentPhone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(student)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(student.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingStudent ? 'Edit Student' : 'Add New Student'}
                </h2>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="admissionNumber">Admission Number *</Label>
                    <Input
                      id="admissionNumber"
                      value={formData.admissionNumber}
                      onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="classId">Class</Label>
                    <select
                      id="classId"
                      value={formData.classId}
                      onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select Class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="otherNames">Other Names</Label>
                    <Input
                      id="otherNames"
                      value={formData.otherNames}
                      onChange={(e) => setFormData({ ...formData, otherNames: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="parentName">Parent/Guardian Name *</Label>
                    <Input
                      id="parentName"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="parentEmail">Parent Email</Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      value={formData.parentEmail}
                      onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="parentPhone">Parent Phone *</Label>
                    <Input
                      id="parentPhone"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowModal(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? 'Saving...' : (editingStudent ? 'Update Student' : 'Create Student')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Bulk Upload Students</h2>
                <button onClick={() => { setShowUploadModal(false); setUploadFile(null); }} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <Button variant="outline" onClick={downloadTemplate} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV Template
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  Download the template, fill it with student data, and upload it back.
                </p>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <Label htmlFor="file">Upload CSV/Excel File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowUploadModal(false); setUploadFile(null); }}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading || !uploadFile}>
                    {loading ? 'Uploading...' : 'Upload Students'}
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
