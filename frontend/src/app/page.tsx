'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, CheckCircle, CreditCard, BarChart3, Shield, Users, Zap, UserPlus, MapPin, Phone, MessageCircle, GraduationCap } from 'lucide-react'
import StudentRegistrationModal from '@/components/student-registration-modal'

export default function LandingPage() {
  const [showRegistration, setShowRegistration] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md fixed w-full z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
                <img src="/icons/icon-nav.png" alt="SchoolFees" className="h-9 w-auto rounded-md" />
                <span className="text-2xl font-extrabold hidden sm:inline"><span className="text-blue-600">School</span><span className="text-orange-500">Fees</span></span>
              </Link>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition">Pricing</a>
              <a href="#about" className="text-gray-600 hover:text-blue-600 transition">About</a>
              <button
                onClick={() => setShowRegistration(true)}
                className="text-blue-600 font-semibold hover:text-blue-700 transition flex items-center gap-1"
              >
                <UserPlus className="h-4 w-4" />
                Register Child
              </button>
              <Link href="/student/pay" className="text-blue-600 font-semibold hover:text-blue-700 transition flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                Pay Fees
              </Link>
              <a href="https://school-portal.com.ng" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-semibold hover:text-indigo-700 transition flex items-center gap-1">
                <GraduationCap className="h-4 w-4" />
                School Portal
              </a>
              <Link href="/auth/login" className="text-gray-600 hover:text-blue-600 transition">
                School Login
              </Link>
              <Link 
                href="/auth/register"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Get Started
              </Link>
            </div>
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setShowRegistration(true)}
                className="bg-white border border-blue-600 text-blue-600 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition flex items-center gap-1"
              >
                <UserPlus className="h-4 w-4" />
                Register
              </button>
              <Link
                href="/student/pay"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-1"
              >
                <CreditCard className="h-4 w-4" />
                Pay Fees
              </Link>
              <a
                href="https://school-portal.com.ng"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 px-2 py-2 text-sm font-semibold hover:text-indigo-700 transition flex items-center gap-1"
              >
                <GraduationCap className="h-4 w-4" />
                Portal
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium">
            🎉 Digital School Fees Management Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Simplify School Fee
            <br />
            Collection & Management
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Streamline payments, track fees, and manage multiple schools with our comprehensive platform. 
            Powered by Remita and Paystack for secure transactions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/register"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-lg font-semibold"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>
            <button
              onClick={() => setShowRegistration(true)}
              className="bg-white border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition flex items-center justify-center gap-2 text-lg font-semibold"
            >
              Register Your Child
              <UserPlus className="h-5 w-5" />
            </button>
            <Link 
              href="/student/pay"
              className="bg-white border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition flex items-center justify-center gap-2 text-lg font-semibold"
            >
              Pay School Fees
              <CreditCard className="h-5 w-5" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto">
            {[
              { label: 'Schools', value: '500+' },
              { label: 'Students', value: '50K+' },
              { label: 'Transactions', value: '₦2B+' },
              { label: 'Success Rate', value: '99.9%' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600">Everything you need to manage school fees efficiently</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="h-8 w-8" />,
                title: 'Multi-School Management',
                description: 'Manage multiple schools from a single account with ease',
              },
              {
                icon: <CreditCard className="h-8 w-8" />,
                title: 'Secure Payments',
                description: 'Paystack integration for safe and reliable transactions',
              },
              {
                icon: <BarChart3 className="h-8 w-8" />,
                title: 'Real-time Analytics',
                description: 'Track payments, fees, and financial metrics in real-time',
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: 'Role-Based Access',
                description: 'Control permissions with customizable staff roles',
              },
              {
                icon: <Zap className="h-8 w-8" />,
                title: 'Bulk Student Upload',
                description: 'Import students via Excel for quick onboarding',
              },
              {
                icon: <CheckCircle className="h-8 w-8" />,
                title: 'Automated Settlements',
                description: 'Automatic payout tracking and reconciliation',
              },
            ].map((feature) => (
              <div key={feature.title} className="p-6 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:shadow-lg transition">
                <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get started in three simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                title: 'Register Your School',
                description: 'Sign up and wait for admin approval. Add your school details and configure settings.',
              },
              {
                step: '02',
                title: 'Add Students & Fees',
                description: 'Upload students via Excel or add manually. Set up fee structures for different classes.',
              },
              {
                step: '03',
                title: 'Collect Payments',
                description: 'Students pay online via Paystack. Track all transactions in your dashboard.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your School Fee Management?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of schools already using SchoolFees
          </p>
          <Link 
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition text-lg font-semibold"
          >
            Get Started Now
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <img src="/icons/icon-nav.png" alt="SchoolFees" className="h-7 w-auto rounded-md" />
                <span className="text-xl font-extrabold"><span className="text-blue-400">School</span><span className="text-orange-500">Fees</span></span>
              </Link>
              <p className="text-gray-400">
                Digital school fees management platform for the digital age.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><Link href="/student/pay" className="hover:text-white transition">Pay Fees</Link></li>
                <li><a href="https://school-portal.com.ng" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">School Portal</a></li>
                <li><a href="#" className="hover:text-white transition">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>No. 10A Zumini Street, Trans Ekulu, Enugu</span>
                </li>
                <li className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  <a href="https://wa.me/2348066133281" className="hover:text-white transition">
                    08066133281 (WhatsApp)
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0" />
                  <a href="tel:+2348135907440" className="hover:text-white transition">
                    08135907440 (Call)
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal </h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/privacy" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 SchoolFees. All rights reserved. Powered by Monola Technologies Limited (RC 765535).</p>
          </div>
        </div>
      </footer>

      {showRegistration && (
        <StudentRegistrationModal onClose={() => setShowRegistration(false)} />
      )}
    </div>
  )
}
