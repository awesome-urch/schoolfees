import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Refund Policy - SchoolFees',
  description: 'How refunds, reversals, and payment disputes are handled on SchoolFees.',
}

export default function RefundPolicyPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Refund Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: November 2025</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Who Receives Your Money</h2>
            <p>
              When you pay school fees through SchoolFees, the payment is processed by our payment
              providers (Remita, Paystack) and settles into the <strong>school's own bank account</strong>.
              SchoolFees does not hold school fees. Because of this, the school is the party responsible
              for approving and making refunds of fees it has collected.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">2. How to Request a Refund</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Contact the school first.</strong> Only the school that received the payment can approve a refund. Reach the school directly with your payment reference (the code on your receipt, e.g. PAY-... or the RRR).</li>
              <li><strong>Keep your receipt.</strong> The payment confirmation page, SMS, or email receipt contains the reference needed to trace the payment.</li>
              <li>If the school cannot locate the payment, contact us at <a href="mailto:chinedueya@gmail.com" className="text-blue-600 hover:underline">chinedueya@gmail.com</a> or <a href="tel:+2348135907440" className="text-blue-600 hover:underline">08135907440</a> and we will help trace it with the provider.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Common Cases</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Paid the wrong amount or wrong student:</strong> report to the school immediately with your reference. The school decides the correction or refund.</li>
              <li><strong>Duplicate payment:</strong> where the same fee is paid twice, the school refunds or carries the extra payment forward per its policy.</li>
              <li><strong>Account debited but payment shows failed/pending:</strong> this is usually a bank or provider delay, not a lost payment. The status typically resolves within 24–48 hours; the amount is either confirmed or automatically reversed by your bank.</li>
              <li><strong>Withdrawal after paying:</strong> refund of school fees on withdrawal is governed by the school's own refund policy, not SchoolFees.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">4. What SchoolFees Does Not Refund</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Gateway/processing charges collected by the payment provider or banks at checkout.</li>
              <li>Fees the school has legally earned under its own published policies — those are disputes between parent and school.</li>
              <li>Payments made to an account whose details the school itself registered incorrectly — the school bears responsibility for the settlement details it provides.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">5. School Subscription and Per-Student Fees</h2>
            <p>
              Fees SchoolFees charges schools for use of the platform (subscription or per-student
              charges) are separate from school fees payments. Subscription refunds are reviewed case by
              case — contact us within 7 days of the charge if you believe it was made in error.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Timelines</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Failed-transaction reversals are handled by banks/providers — typically within 24–72 hours, occasionally up to 10 working days.</li>
              <li>School-approved refunds follow the school's internal process; SchoolFees can assist with payment verification to speed it up.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Contact</h2>
            <p>
              Refund assistance: <a href="mailto:chinedueya@gmail.com" className="text-blue-600 hover:underline">chinedueya@gmail.com</a> · <a href="tel:+2348135907440" className="text-blue-600 hover:underline">08135907440</a> · WhatsApp: <a href="https://wa.me/2348066133281" className="text-blue-600 hover:underline">08066133281</a>.
              Always include your payment reference when contacting us about a payment.
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
