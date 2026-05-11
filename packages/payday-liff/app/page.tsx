import { formatTHB } from '@payday/shared'

import { LIFFAuthGate } from '@/components/liff-auth-gate'

export default function HomePage() {
  return (
    <LIFFAuthGate>
      <main className="employee-screen">
        <section className="hero">
          <p className="eyebrow">PayDay+ LIFF</p>
          <h1>Employee mini app foundation</h1>
          <p className="balance">{formatTHB(12500)}</p>
        </section>
      </main>
    </LIFFAuthGate>
  )
}
