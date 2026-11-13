'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, Search, CheckCircle, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { publicApi } from '@/lib/api'

const emptyForm = {
  firstName: '',
  lastName: '',
  otherNames: '',
  gender: '',
  dateOfBirth: '',
  email: '',
  phone: '',
  admissionNumber: '',
  waecNumber: '',
  jambNumber: '',
  parentName: '',
  parentPhone: '',
  parentEmail: '',
  address: '',
}

export default function StudentRegistrationModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [schools, setSchools] = useState<any[]>([])
  const [filteredSchools, setFilteredSchools] = useState<any[]>([])
  const [schoolSearch, setSchoolSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedSchool, setSelectedSchool] = useState<any>(null)
  const [classes, setClasses] = useState<any[]>([])
  const [classesLoading, setClassesLoading] = useState(false)
  const [classId, setClassId] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [passportFile, setPassportFile] = useState<File | null>(null)
  const [passportPreview, setPassportPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [registered, setRegistered] = useState<any>(null)

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await publicApi.get('/schools/public/list')
        setSchools(response.data)
        setFilteredSchools(response.data)
      } catch {
        setError('Failed to load schools. Please close and try again.')
      }
    }
    fetchSchools()
  }, [])

  useEffect(() => {
    if (schoolSearch) {
      setFilteredSchools(
        schools.filter((school) =>
          school.name.toLowerCase().includes(schoolSearch.toLowerCase())
        )
      )
    } else {
      setFilteredSchools(schools)
    }
  }, [schoolSearch, schools])

  const handleSelectSchool = async (school: any) => {
    setSelectedSchool(school)
    setSchoolSearch(school.name)
    setShowDropdown(false)
    setClassId('')
    setClasses([])
    setClassesLoading(true)
    try {
      const response = await publicApi.get(`/students/classes/school/${school.id}`)
      setClasses(response.data)
    } catch {
      // Class list is optional — registration still works without it
    } finally {
      setClassesLoading(false)
    }
  }

  const handlePassportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Passport photo must be an image file')
      return
    }
    setPassportFile(file)
    setPassportPreview(URL.createObjectURL(file))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSchool) {
      setError('Please select a school')
      return
    }
    if (classes.length > 0 && !classId) {
      setError('Please select the child\'s academic level / class')
      return
    }
    setLoading(true)
    setError('')

    try {
      const payload = new FormData()
      payload.append('schoolId', String(selectedSchool.id))
      payload.append('firstName', form.firstName)
      payload.append('lastName', form.lastName)
      payload.append('parentName', form.parentName)
      payload.append('parentPhone', form.parentPhone)
      if (classId) payload.append('classId', classId)
      if (form.admissionNumber.trim()) payload.append('admissionNumber', form.admissionNumber.trim())
      if (form.otherNames.trim()) payload.append('otherNames', form.otherNames.trim())
      if (form.gender) payload.append('gender', form.gender)
      if (form.dateOfBirth) payload.append('dateOfBirth', form.dateOfBirth)
      if (form.email.trim()) payload.append('email', form.email.trim())
      if (form.phone.trim()) payload.append('phone', form.phone.trim())
      if (form.parentEmail.trim()) payload.append('parentEmail', form.parentEmail.trim())
      if (form.address.trim()) payload.append('address', form.address.trim())
      if (form.waecNumber.trim()) payload.append('waecNumber', form.waecNumber.trim())
      if (form.jambNumber.trim()) payload.append('jambNumber', form.jambNumber.trim())
      if (passportFile) payload.append('passport', passportFile)

      const response = await publicApi.post('/students/self-register', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setRegistered(response.data)
    } catch (err: any) {
      const message = err.response?.data?.message
      setError(Array.isArray(message) ? message.join('\n') : message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Register Your Child</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {registered ? (
          <div className="p-6 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-900">Registration Successful!</h3>
            <p className="text-sm text-gray-600">
              {registered.firstName} {registered.lastName} has been registered at{' '}
              {selectedSchool?.name}.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Admission Number</p>
              <p className="text-2xl font-bold text-blue-600 tracking-wide">
                {registered.admissionNumber}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Save this number — you'll need it to pay fees.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Close
              </Button>
              <Button
                className="flex-1"
                onClick={() =>
                  router.push(
                    `/student/pay?school=${selectedSchool?.id}&admission=${encodeURIComponent(registered.admissionNumber)}`
                  )
                }
              >
                Proceed to Pay Fees
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm whitespace-pre-line">
                {error}
              </div>
            )}

            {/* School selection */}
            <div className="space-y-2 relative">
              <Label htmlFor="reg-school">School *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="reg-school"
                  type="text"
                  placeholder="Search for a school..."
                  value={schoolSearch}
                  onChange={(e) => {
                    setSchoolSearch(e.target.value)
                    setShowDropdown(true)
                    if (selectedSchool && e.target.value !== selectedSchool.name) {
                      setSelectedSchool(null)
                      setClasses([])
                      setClassId('')
                    }
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="pl-10"
                  required
                />
              </div>
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredSchools.map((school) => (
                    <button
                      key={school.id}
                      type="button"
                      onClick={() => handleSelectSchool(school)}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm"
                    >
                      {school.name}
                    </button>
                  ))}
                  {filteredSchools.length === 0 && (
                    <p className="px-4 py-2 text-xs text-amber-600">No schools found.</p>
                  )}
                </div>
              )}
            </div>

            {selectedSchool && (
              <div className="space-y-2">
                <Label htmlFor="reg-class">Academic Level / Class *</Label>
                <select
                  id="reg-class"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  disabled={classesLoading}
                  required={classes.length > 0}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  <option value="">
                    {classesLoading
                      ? 'Loading classes...'
                      : classes.length === 0
                        ? 'No classes set up for this school yet — contact the school'
                        : 'Select level / class — e.g., JSS1, SS2A, Primary 3, 200 Level'}
                  </option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.department ? ` — ${c.department}` : ''}{c.faculty ? ` (${c.faculty})` : ''}
                    </option>
                  ))}
                </select>
                {classes.length > 0 && (
                  <p className="text-xs text-gray-500">
                    Pick the exact class the child is in (e.g., JSS 1A vs JSS 1B). This determines the correct fees.
                  </p>
                )}
              </div>
            )}

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
                    id="reg-passport"
                    type="file"
                    accept="image/*"
                    onChange={handlePassportChange}
                    className="hidden"
                  />
                  <input
                    id="reg-passport-camera"
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
                      onClick={() => document.getElementById('reg-passport')?.click()}
                    >
                      {passportFile ? 'Change Photo' : 'Upload Photo'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('reg-passport-camera')?.click()}
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

            {/* Child details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reg-firstName">Child's First Name *</Label>
                <Input
                  id="reg-firstName"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-lastName">Child's Last Name *</Label>
                <Input
                  id="reg-lastName"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reg-otherNames">Other Names</Label>
                <Input
                  id="reg-otherNames"
                  value={form.otherNames}
                  onChange={(e) => setForm({ ...form, otherNames: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-gender">Gender</Label>
                <select
                  id="reg-gender"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reg-dob">Date of Birth</Label>
                <Input
                  id="reg-dob"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-admission">Admission Number</Label>
                <Input
                  id="reg-admission"
                  placeholder="If already assigned"
                  value={form.admissionNumber}
                  onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })}
                />
              </div>
            </div>

            {selectedSchool?.institutionType === 'UNIVERSITY' && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-4">
                <p className="text-sm font-semibold text-indigo-800">University Entrance Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-jamb">JAMB Registration Number</Label>
                    <Input
                      id="reg-jamb"
                      placeholder="e.g., 202612345678AB"
                      value={form.jambNumber}
                      onChange={(e) => setForm({ ...form, jambNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-waec">WAEC Result / Exam Number</Label>
                    <Input
                      id="reg-waec"
                      placeholder="e.g., 4251234567"
                      value={form.waecNumber}
                      onChange={(e) => setForm({ ...form, waecNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Parent details */}
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Parent / Guardian Details</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-parentName">Full Name *</Label>
                  <Input
                    id="reg-parentName"
                    value={form.parentName}
                    onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-parentPhone">Phone Number *</Label>
                    <Input
                      id="reg-parentPhone"
                      type="tel"
                      value={form.parentPhone}
                      onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-parentEmail">Email</Label>
                    <Input
                      id="reg-parentEmail"
                      type="email"
                      value={form.parentEmail}
                      onChange={(e) => setForm({ ...form, parentEmail: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-address">Address</Label>
                  <Input
                    id="reg-address"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !selectedSchool}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register Child'
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
