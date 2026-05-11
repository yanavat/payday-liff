import { LIFFAuthGate } from '@/components/liff-auth-gate'
import { formatTHB } from '@/lib/utils/format'

export default function HomePage() {
  return (
    <LIFFAuthGate>
      <main className="employee-screen p-5">
        <section className="rounded-xl border border-border bg-primary-bg p-6">
          <p className="mb-2 text-sm text-text-secondary">PayDay+ LIFF</p>
          <h1 className="m-0 text-2xl font-semibold leading-tight">Employee mini app foundation</h1>
          <p className="mt-6 text-4xl font-bold text-primary-dark">{formatTHB(12500)}</p>
        </section>
      </main>
    </LIFFAuthGate>
  )
}
