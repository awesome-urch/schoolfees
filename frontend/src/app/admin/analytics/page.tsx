'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, LogOut, TrendingUp, Building2, Users, DollarSign, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

export default function AnalyticsPage() {
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
    if (parsedUser.userType !== 'super_admin') {
      router.push('/dashboard')
      return
    }

    setUser(parsedUser)
    fetchAnalytics()
  }, [router])

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/dashboard/super-admin')
      setStats(response.data.stats)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
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
                SchoolFees Admin
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Super Admin: {user?.fullName}</span>
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
            <Link
              href="/admin/dashboard"
              className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/school-owners"
              className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            >
              School Owners
            </Link>
            <Link
              href="/admin/schools"
              className="py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            >
              Schools
            </Link>
            <Link
              href="/admin/analytics"
              className="py-4 px-2 border-b-2 border-blue-600 text-blue-600 font-medium"
            >
              Analytics
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Platform Analytics</h1>
          <p className="text-gray-600">Detailed insights and statistics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Building2 className="h-8 w-8 opacity-80" />
              <Activity className="h-5 w-5 opacity-60" />
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats?.totalSchools || 0}</h3>
            <p className="text-blue-100 text-sm">Total Schools</p>
            <p className="text-xs text-blue-200 mt-2">
              {stats?.activeSchools || 0} active schools
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 opacity-80" />
              <TrendingUp className="h-5 w-5 opacity-60" />
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats?.totalStudents || 0}</h3>
            <p className="text-purple-100 text-sm">Total Students</p>
            <p className="text-xs text-purple-200 mt-2">
              Across all schools
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-8 w-8 opacity-80" />
              <TrendingUp className="h-5 w-5 opacity-60" />
            </div>
            <h3 className="text-3xl font-bold mb-1">
              ₦{(stats?.totalRevenue || 0).toLocaleString()}
            </h3>
            <p className="text-green-100 text-sm">Total Revenue</p>
            <p className="text-xs text-green-200 mt-2">
              All-time platform revenue
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Activity className="h-8 w-8 opacity-80" />
              <TrendingUp className="h-5 w-5 opacity-60" />
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats?.totalPayments || 0}</h3>
            <p className="text-orange-100 text-sm">Total Transactions</p>
            <p className="text-xs text-orange-200 mt-2">
              Successful payments
            </p>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Growth</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Total Schools</p>
                  <p className="text-2xl font-bold text-blue-600">{stats?.totalSchools || 0}</p>
                </div>
                <Building2 className="h-10 w-10 text-blue-600" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Active Schools</p>
                  <p className="text-2xl font-bold text-green-600">{stats?.activeSchools || 0}</p>
                </div>
                <Activity className="h-10 w-10 text-green-600" />
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-purple-600">{stats?.totalStudents || 0}</p>
                </div>
                <Users className="h-10 w-10 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue Analytics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₦{(stats?.totalRevenue || 0).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-10 w-10 text-green-600" />
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Total Payments</p>
                  <p className="text-2xl font-bold text-blue-600">{stats?.totalPayments || 0}</p>
                </div>
                <Activity className="h-10 w-10 text-blue-600" />
              </div>

              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Average per Payment</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ₦{stats?.totalPayments > 0 
                      ? Math.round((stats?.totalRevenue || 0) / stats?.totalPayments).toLocaleString()
                      : 0
                    }
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Platform Health</h3>
          <p className="text-blue-700 mb-4">
            The platform is operating smoothly with {stats?.activeSchools || 0} active schools 
            and {stats?.totalStudents || 0} students enrolled.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">School Activation Rate</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats?.totalSchools > 0 
                  ? Math.round((stats?.activeSchools / stats?.totalSchools) * 100)
                  : 0
                }%
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Avg Students per School</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats?.activeSchools > 0 
                  ? Math.round(stats?.totalStudents / stats?.activeSchools)
                  : 0
                }
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Avg Revenue per School</p>
              <p className="text-2xl font-bold text-green-600">
                ₦{stats?.activeSchools > 0 
                  ? Math.round((stats?.totalRevenue || 0) / stats?.activeSchools).toLocaleString()
                  : 0
                }
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
