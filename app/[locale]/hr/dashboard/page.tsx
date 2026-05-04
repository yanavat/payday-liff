import { useTranslations } from 'next-intl'

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-page-title font-semibold text-text-primary mb-6">
        แดชบอร์ด {/* Phase 3: replace with useTranslations */}
      </h1>
      <p className="text-text-secondary text-body">
        Phase 3 — Dashboard content will be built here.
      </p>
    </div>
  )
}
