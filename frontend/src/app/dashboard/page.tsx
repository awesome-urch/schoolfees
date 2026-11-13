'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Users, TrendingUp, LogOut, GraduationCap, Clock, CheckCircle2,
  PlusCircle, CreditCard, Wallet, BarChart3, ArrowRight,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import LiveClock from '@/components/LiveClock'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/schools', label: 'Schools' },
  { href: '/dashboard/sessions', label: 'Sessions' },
  { href: '/dashboard/students', label: 'Students' },
  { href: '/dashboard/academics', label: 'Academics' },
  { href: '/dashboard/fees', label: 'Fees' },
  { href: '/dashboard/payments', label: 'Payments' },
  { href: '/dashboard/accounts', label: 'Accounts' },
  { href: '/dashboard/settings', label: 'Settings' },
]

const statusStyles: Record<string, string> = {
  successful: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [schools, setSchools] = useState<any[]>([])
  const [selectedSchool, setSelectedSchool] = useState<number | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [recentPayments, setRecentPayments] = useState<any[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }
    setUser(JSON.parse(userData))
    loadSchools()
  }, [router])

  const loadSchools = async () => {
    try {
      const res = await api.get('/schools')
      setSchools(res.data)
      if (res.data.length > 0) {
        setSelectedSchool(res.data[0].id)
        await loadDashboard(res.data[0].id)
      } else {
        setStats({ totalStudents: 0, totalStaff: 0, totalRevenue: 0, pendingPayments: 0, successfulPayments: 0 })
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setStats({ totalStudents: 0, totalStaff: 0, totalRevenue: 0, pendingPayments: 0, successfulPayments: 0 })
    } finally {
      setLoading(false)
    }
  }

  const loadDashboard = async (schoolId: number) => {
    try {
      const res = await api.get(`/dashboard/school/${schoolId}`)
      setStats(res.data.stats)
      setRecentPayments(res.data.recentPayments || [])
      setMonthlyRevenue(res.data.monthlyRevenue || [])
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    }
  }

  const handleSchoolChange = (id: number) => {
    setSelectedSchool(id)
    loadDashboard(id)
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

  const statCards = [
    { label: 'Total Students', value: stats?.totalStudents ?? 0, icon: GraduationCap, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', sub: 'Active students' },
    { label: 'Total Revenue', value: `₦${(stats?.totalRevenue ?? 0).toLocaleString()}`, icon: Wallet, iconBg: 'bg-green-100', iconColor: 'text-green-600', sub: 'Successful payments' },
    { label: 'Successful Payments', value: stats?.successfulPayments ?? 0, icon: CheckCircle2, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', sub: 'Completed transactions' },
    { label: 'Pending Payments', value: stats?.pendingPayments ?? 0, icon: Clock, iconBg: 'bg-amber-100', iconColor: 'text-amber-600', sub: 'Awaiting confirmation' },
  ]

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
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`py-4 px-2 border-b-2 whitespace-nowrap ${
                  item.href === '/dashboard'
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
            <p className="text-gray-600">Overview of your school's payments and students</p>
          </div>
          {schools.length > 1 && (
            <select
              value={selectedSchool ?? ''}
              onChange={(e) => handleSchoolChange(Number(e.target.value))}
              className="border rounded-lg px-4 py-2 text-sm bg-white shadow-sm"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center shrink-0`}>
                  <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <h3 className="text-2xl font-bold text-gray-900 truncate">{card.value}</h3>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-xl shadow-sm border p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">Revenue — Last 6 Months</h2>
            </div>
            {monthlyRevenue.some((m) => m.revenue > 0) ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₦${(v / 1000).toLocaleString()}k`} />
                  <Tooltip formatter={(v: any) => [`₦${Number(v).toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                <BarChart3 className="h-10 w-10 mb-2" />
                <p className="text-sm">No revenue recorded in the last 6 months</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/dashboard/schools" className="flex items-center justify-between p-3 rounded-lg border hover:border-blue-400 hover:bg-blue-50 transition group">
                <span className="flex items-center gap-3 text-sm font-medium text-gray-700 group-hover:text-blue-700">
                  <PlusCircle className="h-5 w-5 text-blue-600" /> Add School
                </span>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
              </Link>
              <Link href="/dashboard/students" className="flex items-center justify-between p-3 rounded-lg border hover:border-blue-400 hover:bg-blue-50 transition group">
                <span className="flex items-center gap-3 text-sm font-medium text-gray-700 group-hover:text-blue-700">
                  <GraduationCap className="h-5 w-5 text-blue-600" /> Add Student
                </span>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
              </Link>
              <Link href="/dashboard/fees" className="flex items-center justify-between p-3 rounded-lg border hover:border-blue-400 hover:bg-blue-50 transition group">
                <span className="flex items-center gap-3 text-sm font-medium text-gray-700 group-hover:text-blue-700">
                  <CreditCard className="h-5 w-5 text-blue-600" /> Manage Fees
                </span>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
              </Link>
              <Link href="/dashboard/payments" className="flex items-center justify-between p-3 rounded-lg border hover:border-blue-400 hover:bg-blue-50 transition group">
                <span className="flex items-center gap-3 text-sm font-medium text-gray-700 group-hover:text-blue-700">
                  <TrendingUp className="h-5 w-5 text-blue-600" /> View Payments
                </span>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-bold text-gray-900">Recent Payments</h2>
            <Link href="/dashboard/payments" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {recentPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="px-6 py-3 font-medium">Student</th>
                    <th className="px-6 py-3 font-medium">Fee</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">Method</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-6 py-3">
                        {p.student ? `${p.student.firstName} ${p.student.lastName}` : '—'}
                        {p.student?.admissionNumber && (
                          <span className="block text-xs text-gray-400">{p.student.admissionNumber}</span>
                        )}
                      </td>
                      <td className="px-6 py-3">{p.feeType?.name || '—'}</td>
                      <td className="px-6 py-3 font-medium">₦{Number(p.amount).toLocaleString()}</td>
                      <td className="px-6 py-3 capitalize">{p.paymentMethod || '—'}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusStyles[p.status] || 'bg-gray-100 text-gray-600'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {new Date(p.paidAt || p.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-gray-400">
              <CreditCard className="h-10 w-10 mx-auto mb-2" />
              <p className="text-sm">No payments yet — they'll appear here once parents start paying.</p>
            </div>
          )}
        </div>

        {/* Getting Started — only show when school has no students */}
        {(stats?.totalStudents ?? 0) === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
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
        )}
      </main>
    </div>
  )
}
