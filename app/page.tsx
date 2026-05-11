import { LIFFAuthGate } from '@/components/liff-auth-gate'
import { LiffHomePage } from '@/components/liff-home-page'

export default function HomePage() {
  return (
    <LIFFAuthGate>
      <LiffHomePage />
    </LIFFAuthGate>
  )
}
