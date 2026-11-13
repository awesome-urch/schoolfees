import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Privacy Policy - SchoolFees',
  description: 'How SchoolFees collects, uses, and protects personal data for schools, students, and parents.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b bg-white/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/icons/icon-nav.png" alt="SchoolFees" width={168} height={72} className="h-9 w-auto" />
            <span className="hidden sm:inline font-bold text-lg">
              <span className="text-blue-600">School</span>
              <span className="text-orange-500">Fees</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/student/pay" className="text-sm text-blue-600 hover:underline">Pay Fees</Link>
            <Link href="/auth/register" className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition">Register</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: October 2025</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Who We Are</h2>
            <p>
              SchoolFees ("we", "our", "the platform") is a school fees management platform operated in Nigeria.
              Schools use SchoolFees to manage student records, fee structures, payments, and reporting. Parents
              and students use it to view and pay school fees. This policy explains what data we collect, why,
              and how it is protected.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>School account data:</strong> school name, contact details, logo, website, registration/approval documents, and administrator name, email, phone, and password.</li>
              <li><strong>Student data (entered by schools or parents):</strong> name, class/level, admission or matriculation number, parent/guardian contact details, passport photograph, and — for tertiary institutions — WAEC and JAMB registration numbers.</li>
              <li><strong>Payment data:</strong> fee amounts, payment references, transaction status, and settlement details processed through Remita and other payment providers. We do not store card numbers or bank PINs.</li>
              <li><strong>Usage data:</strong> IP address, device/browser type, and pages visited, used for security, diagnostics, and improving the service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">3. How We Use Information</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To provide school accounts, student records, fee billing, payment processing, receipts, and reports.</li>
              <li>To verify schools and prevent fraud.</li>
              <li>To send payment confirmations, receipts, and service notifications.</li>
              <li>To maintain security, troubleshoot issues, and comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Sharing of Information</h2>
            <p>
              We do not sell personal data. Information is shared only with:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong>The student's school</strong> — student and payment records belong to the school that manages them; each school can only see its own data.</li>
              <li><strong>Payment processors</strong> — e.g., Remita and partner banks, strictly to process payments and settlements.</li>
              <li><strong>Service providers</strong> — hosting and infrastructure providers under confidentiality obligations.</li>
              <li><strong>Authorities</strong> — where required by law or lawful request.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Data Security</h2>
            <p>
              Data is stored on secured servers with encryption in transit (HTTPS), access controls, and
              per-school data isolation. Passwords are hashed and never stored in plain text. No method of
              transmission or storage is 100% secure, but we apply industry-standard safeguards.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Data Retention</h2>
            <p>
              We retain records for as long as a school's account is active and as needed to meet legal,
              accounting, and audit obligations. Schools may request deletion of their data; student records
              are managed by the school that owns them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Children's Privacy</h2>
            <p>
              Student records — including those of minors — are created and managed by schools and parents/guardians,
              not by children directly. If you believe a child's data was submitted improperly, contact us and we
              will work with the relevant school to address it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">8. Your Rights</h2>
            <p>
              Under the Nigeria Data Protection Act (NDPA) 2023, you may request access to, correction of, or
              deletion of your personal data, subject to legal retention requirements. Contact us or your school
              administrator to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">9. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. Material changes will be posted on this page with an
              updated date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">10. Contact</h2>
            <p>
              Questions about this policy or your data: contact us through the channels listed on{' '}
              <Link href="/" className="text-blue-600 hover:underline">schoolfees.com.ng</Link> or through your
              school administrator.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t bg-gray-50 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} SchoolFees</span>
          <Link href="/" className="text-blue-600 hover:underline">Back to Home</Link>
        </div>
      </footer>
    </div>
  )
}
