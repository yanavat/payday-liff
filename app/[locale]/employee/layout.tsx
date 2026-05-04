// Employee section layout — mobile 390px with bottom tab bar
// Actual BottomTabBar component will be built in Phase 4

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="employee-screen">
      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16">
        {children}
      </main>

      {/* Bottom tab bar — placeholder until Phase 4 */}
      <nav className="employee-bottom-tab" aria-label="Employee Navigation">
        {/* BottomTabBar component will go here */}
      </nav>
    </div>
  )
}
