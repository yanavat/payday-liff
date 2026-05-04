// HR section layout — wraps all HR screens with sidebar + topbar
// Actual HRSidebar and HRTopbar components will be built in Phase 3

export default function HRLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="hr-layout">
      {/* Sidebar — placeholder until Phase 3 */}
      <aside className="hr-sidebar" aria-label="HR Navigation">
        <div className="flex items-center gap-2 h-14 mb-4">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xs">P+</span>
          </div>
          <span className="font-semibold text-sm text-text-primary">PayDay+</span>
        </div>
        {/* Nav items will be rendered by HRSidebar component */}
      </aside>

      {/* Main content area */}
      <div className="hr-main">
        {/* Topbar — placeholder until Phase 3 */}
        <header className="hr-topbar">
          <div className="text-sm text-text-muted">HR Portal</div>
        </header>

        {/* Page content */}
        <main className="hr-content">
          {children}
        </main>
      </div>
    </div>
  )
}
