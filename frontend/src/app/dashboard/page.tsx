'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, Users, DollarSign, TrendingUp, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    fetchDashboardData()
  }, [router])

  const fetchDashboardData = async () => {
    try {
      // Fetch schools first
      const schoolsResponse = await api.get('/schools')
      if (schoolsResponse.data.length > 0) {
        const firstSchool = schoolsResponse.data[0]
        // Fetch dashboard stats for first school
        const dashboardResponse = await api.get(`/dashboard/school/${firstSchool.id}`)
        setStats(dashboardResponse.data.stats)
      } else {
        setStats({
          totalStudents: 0,
          totalStaff: 0,
          totalRevenue: 0,
          pendingPayments: 0,
        })
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setStats({
        totalStudents: 0,
        totalStaff: 0,
        totalRevenue: 0,
        pendingPayments: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    router.push('/auth/login')
  }

  if (loading) {
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
          <div className="flex space-x-8">
            <Link href="/dashboard" className="py-4 px-2 border-b-2 border-blue-600 text-blue-600 font-medium">
              Dashboard
            </Link>
            <Link href="/dashboard/schools" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300">
              Schools
            </Link>
            <Link href="/dashboard/sessions" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300">
              Sessions
            </Link>
            <Link href="/dashboard/students" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300">
              Students
            </Link>
            <Link href="/dashboard/classes" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300">
              Classes
            </Link>
            <Link href="/dashboard/fees" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300">
              Fees
            </Link>
            <Link href="/dashboard/payments" className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300">
              Payments
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Overview of your school management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.totalStudents || 0}</h3>
            <p className="text-gray-600 text-sm">Total Students</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              ₦{stats?.totalRevenue?.toLocaleString() || 0}
            </h3>
            <p className="text-gray-600 text-sm">Total Revenue</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.pendingPayments || 0}</h3>
            <p className="text-gray-600 text-sm">Pending Payments</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.totalStaff || 0}</h3>
            <p className="text-gray-600 text-sm">Total Staff</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/schools" className="w-full">
              <Button className="w-full">Add School</Button>
            </Link>
            <Link href="/dashboard/students" className="w-full">
              <Button className="w-full" variant="outline">Add Student</Button>
            </Link>
            <Link href="/dashboard/payments" className="w-full">
              <Button className="w-full" variant="outline">View Payments</Button>
            </Link>
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-2">Getting Started</h2>
          <p className="text-blue-700 mb-4">
            Complete these steps to set up your school management system:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Create your school profile</li>
            <li>Add classes and academic sessions</li>
            <li>Upload students (via Excel or manually)</li>
            <li>Set up fee structures</li>
            <li>Configure business account for settlements</li>
          </ol>
        </div>
      </main>
    </div>
  )
}
