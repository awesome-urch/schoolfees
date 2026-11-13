import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Terms of Service - SchoolFees',
  description: 'The terms governing use of the SchoolFees platform by schools, parents, and students.',
}

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: November 2025</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Agreement</h2>
            <p>
              These Terms of Service govern the use of SchoolFees ("the platform"), operated by Monola
              Technologies Limited (RC 765535), a company registered in Nigeria. By creating an account,
              using the platform to collect or make payments, or accessing any part of the service, you
              agree to these terms. If you do not agree, do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">2. The Service</h2>
            <p>
              SchoolFees provides schools with tools to manage students, fee structures, and payment
              collection, and provides parents and students with a way to view and pay school fees online.
              Payments are processed by third-party payment providers, including Remita and Paystack.
              SchoolFees does not itself hold, transfer, or guarantee settlement of funds except as
              arranged through these providers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">3. School Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Schools must provide accurate student records, fee amounts, and contact details.</li>
              <li>Schools are responsible for the correctness of bank/settlement account details they register on the platform.</li>
              <li>Schools must keep administrator credentials confidential and are responsible for actions taken under their accounts.</li>
              <li>Schools may only upload data they are authorized to use, and are responsible for obtaining any consents required for student data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Parent and Student Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Payers must verify the student's school, name, and fee items before confirming payment.</li>
              <li>Payment details (card, bank, RRR) are entered on the payment provider's secure pages — never share them with third parties claiming to represent the platform.</li>
              <li>Students must keep their portal login credentials confidential.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Payments, Fees, and Settlement</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Payments are processed by Remita, Paystack, or other integrated providers. Transaction or processing charges may apply as displayed at checkout.</li>
              <li>Successful payments are confirmed by the provider before being marked as paid. A payment record may show "pending" until provider confirmation.</li>
              <li>Settlement to schools follows the arrangement configured on the school's registered business account and is subject to the provider's settlement schedule and policies.</li>
              <li>SchoolFees may charge schools a subscription or per-student fee as published on our pricing page; such charges are separate from payment provider fees.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Refunds and Disputes</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Refund requests must be directed to the school that received the payment, since funds settle to the school's account.</li>
              <li>Where a payment fails after a debit, the reversal or refund is handled according to the payment provider's and the payer's bank's processes.</li>
              <li>SchoolFees will reasonably assist in tracing payments using transaction references, but is not liable for the provider's or bank's resolution timeline.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Acceptable Use</h2>
            <p>
              You may not use the platform for fraudulent payments, test attacks against the service,
              unauthorized access to other schools' data, or any unlawful purpose. We may suspend accounts
              involved in misuse, fraud, or activities that endanger other users or the payment ecosystem.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">8. Data and Privacy</h2>
            <p>
              Use of personal data on the platform is described in our{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>,
              which forms part of these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">9. Limitation of Liability</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>The platform is provided "as is". We aim for high availability but do not guarantee uninterrupted service.</li>
              <li>We are not liable for payment failures, settlement delays, or account verification issues caused by payment providers, banks, or telecommunications networks.</li>
              <li>To the extent permitted by Nigerian law, our liability for any claim arising from use of the platform is limited to the fees you paid us in the preceding three months.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">10. Changes and Contact</h2>
            <p>
              We may update these terms from time to time; material changes will be communicated through
              the platform. Continued use after changes means you accept the updated terms.
            </p>
            <p className="mt-2">
              Questions about these terms: <a href="mailto:chinedueya@gmail.com" className="text-blue-600 hover:underline">chinedueya@gmail.com</a> · <a href="tel:+2348135907440" className="text-blue-600 hover:underline">08135907440</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">11. Governing Law</h2>
            <p>
              These terms are governed by the laws of the Federal Republic of Nigeria.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t mt-8 py-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} SchoolFees. All rights reserved. Powered by Monola Technologies Limited (RC 765535).
      </footer>
    </div>
  )
}
