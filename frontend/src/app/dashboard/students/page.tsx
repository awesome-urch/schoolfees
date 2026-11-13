'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Plus, Users, Edit, Trash2, X, Upload, Download, Camera, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'
import LiveClock from '@/components/LiveClock'

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')

function StudentAvatar({ student }: { student: any }) {
  const [imgError, setImgError] = useState(false)
  const initials = `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`.toUpperCase()

  if (!student.passportUrl || imgError) {
    return (
      <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium shrink-0">
        {initials || '?'}
      </div>
    )
  }

  return (
    <img
      src={`${API_ORIGIN}${student.passportUrl}`}
      alt={`${student.firstName} ${student.lastName}`}
      className="h-10 w-10 rounded-full object-cover shrink-0"
      onError={() => setImgError(true)}
    />
  )
}

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
  const [passportFile, setPassportFile] = useState<File | null>(null)
  const [passportPreview, setPassportPreview] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [page, setPage] = useState(1)

  const PAGE_SIZE = 20
  const query = searchTerm.trim().toLowerCase()
  const filteredStudents = students.filter((s) => {
    const matchesQuery =
      !query ||
      s.admissionNumber?.toLowerCase().includes(query) ||
      s.firstName?.toLowerCase().includes(query) ||
      s.lastName?.toLowerCase().includes(query) ||
      s.otherNames?.toLowerCase().includes(query) ||
      s.email?.toLowerCase().includes(query)
    const matchesClass = !classFilter || String(s.classId) === classFilter
    return matchesQuery && matchesClass
  })
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )
  const [formData, setFormData] = useState({
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
    waecNumber: '',
    jambNumber: '',
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

  const handlePassportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Passport photo must be an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Passport photo must be under 5MB')
      return
    }
    setPassportFile(file)
    setPassportPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = new FormData()
      for (const [key, value] of Object.entries(formData)) {
        if (value !== '' && value != null) payload.append(key, String(value))
      }
      if (passportFile) payload.append('passport', passportFile)

      const config = { headers: { 'Content-Type': 'multipart/form-data' } }
      if (editingStudent) {
        await api.patch(`/students/${editingStudent.id}/school/${selectedSchool}`, payload, config)
        alert('Student updated successfully!')
      } else {
        payload.append('schoolId', selectedSchool)
        await api.post('/students', payload, config)
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
            classId: student.classId || '',
      admissionNumber: student.admissionNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      otherNames: student.otherNames || '',
      dateOfBirth: student.dateOfBirth?.split('T')[0] || '',
      gender: student.gender || 'male',
      email: student.email || '',
      phone: student.phone || '',
      parentName: student.parentName,
      parentEmail: student.parentEmail || '',
      parentPhone: student.parentPhone,
      address: student.address || '',
      waecNumber: student.waecNumber || '',
      jambNumber: student.jambNumber || '',
    })
    setPassportFile(null)
    setPassportPreview(student.passportUrl ? `${API_ORIGIN}${student.passportUrl}` : '')
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
      waecNumber: '',
      jambNumber: '',
    })
    setPassportFile(null)
    setPassportPreview('')
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
            <Link href="/dashboard/students" className="py-4 px-2 border-b-2 border-blue-600 text-blue-600 font-medium">
              Students
            </Link>
            <Link href="/dashboard/academics" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
              Academics
            </Link>
            <Link href="/dashboard/fees" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
              Fees
            </Link>
            <Link href="/dashboard/payments" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
              Payments
            </Link>
            <Link href="/dashboard/accounts" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 whitespace-nowrap">
              Accounts
            </Link>
            <Link href="/dashboard/settings" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 whitespace-nowrap">
              Settings
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

        {/* Search + Class Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, admission no, or email..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
              className="pl-9"
            />
          </div>
          <select
            value={classFilter}
            onChange={(e) => { setClassFilter(e.target.value); setPage(1) }}
            className="flex h-10 w-full sm:w-64 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All Departments</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
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
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No students match your search
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.admissionNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <StudentAvatar student={student} />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{student.email}</div>
                          </div>
                        </div>
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
          {filteredStudents.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filteredStudents.length)} of{' '}
                {filteredStudents.length} students
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
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
                {/* Passport photo */}
                <div className="space-y-2">
                  <Label>Passport Photo</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                      {passportPreview ? (
                        <img
                          src={passportPreview}
                          alt="Passport preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        id="student-passport"
                        type="file"
                        accept="image/*"
                        onChange={handlePassportChange}
                        className="hidden"
                      />
                      <input
                        id="student-passport-camera"
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={handlePassportChange}
                        className="hidden"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('student-passport')?.click()}
                        >
                          {passportPreview ? 'Change Photo' : 'Upload Photo'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('student-passport-camera')?.click()}
                        >
                          <Camera className="h-4 w-4 mr-1.5" />
                          Take Photo
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Upload a file or take a photo with your camera (image, max 5MB)
                      </p>
                    </div>
                  </div>
                </div>

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
                    <Label htmlFor="classId">Department</Label>
                    <select
                      id="classId"
                      value={formData.classId}
                      onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select Department</option>
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

                  <div>
                    <Label htmlFor="jambNumber">JAMB Reg. Number <span className="text-gray-400 font-normal">(universities)</span></Label>
                    <Input
                      id="jambNumber"
                      placeholder="e.g., 202612345678AB"
                      value={formData.jambNumber}
                      onChange={(e) => setFormData({ ...formData, jambNumber: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="waecNumber">WAEC Exam Number <span className="text-gray-400 font-normal">(universities)</span></Label>
                    <Input
                      id="waecNumber"
                      placeholder="e.g., 4251234567"
                      value={formData.waecNumber}
                      onChange={(e) => setFormData({ ...formData, waecNumber: e.target.value })}
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
