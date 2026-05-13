export function MetricCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-border bg-bg-canvas p-4 shadow-card">
      <div className="mb-3 h-4 w-24 rounded bg-bg-secondary" />
      <div className="mb-2 h-8 w-16 rounded bg-bg-secondary" />
      <div className="h-3 w-32 rounded bg-bg-secondary" />
    </div>
  );
}
