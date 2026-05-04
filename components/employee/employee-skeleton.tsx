'use client'

import { cn } from '@/lib/utils'

/*
  Employee Screen Skeletons
  Used instead of spinners for loading states (Phase 5 — UX & Accessibility)
*/

export function SkeletonLine({ width = '100%', height = '16px', className }: { width?: string; height?: string; className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-full bg-bg-secondary', className)}
      style={{ width, height }}
    />
  )
}

export function EmployeeHomeSkeleton() {
  return (
    <div className="min-h-full bg-bg-page pb-5 px-4 pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonLine width="60%" height="20px" />
          <SkeletonLine width="40%" height="16px" />
        </div>
        <div className="flex gap-2">
          <SkeletonLine width="48px" height="48px" className="rounded-md" />
          <SkeletonLine width="48px" height="48px" className="rounded-md" />
        </div>
      </div>
      <SkeletonLine width="100%" height="180px" className="rounded-xl" />
      <SkeletonLine width="100%" height="100px" className="rounded-xl" />
      <div className="space-y-2">
        <SkeletonLine width="30%" height="16px" />
        <SkeletonLine width="100%" height="72px" className="rounded-lg" />
        <SkeletonLine width="100%" height="72px" className="rounded-lg" />
      </div>
    </div>
  )
}

export function EmployeeHistorySkeleton() {
  return (
    <div className="min-h-full bg-bg-page px-4 pb-5 pt-4 space-y-4">
      <div className="space-y-2">
        <SkeletonLine width="40%" height="22px" />
        <SkeletonLine width="60%" height="16px" />
      </div>
      <div className="flex gap-2 overflow-hidden">
        <SkeletonLine width="120px" height="64px" className="rounded-lg shrink-0" />
        <SkeletonLine width="120px" height="64px" className="rounded-lg shrink-0" />
        <SkeletonLine width="120px" height="64px" className="rounded-lg shrink-0" />
      </div>
      <SkeletonLine width="100%" height="40px" className="rounded-md" />
      <div className="space-y-2">
        <SkeletonLine width="100%" height="64px" className="rounded-lg" />
        <SkeletonLine width="100%" height="64px" className="rounded-lg" />
        <SkeletonLine width="100%" height="64px" className="rounded-lg" />
      </div>
    </div>
  )
}

export function EmployeeProfileSkeleton() {
  return (
    <div className="min-h-full bg-bg-page pb-5">
      <div className="bg-primary-bg px-4 py-6 text-center space-y-3">
        <SkeletonLine width="80px" height="80px" className="rounded-full mx-auto" />
        <SkeletonLine width="50%" height="22px" className="mx-auto" />
        <SkeletonLine width="40%" height="16px" className="mx-auto" />
      </div>
      <div className="space-y-3 px-4 pt-4">
        <SkeletonLine width="100%" height="120px" className="rounded-lg" />
        <SkeletonLine width="100%" height="140px" className="rounded-lg" />
        <SkeletonLine width="100%" height="160px" className="rounded-lg" />
        <SkeletonLine width="100%" height="56px" className="rounded-lg" />
      </div>
    </div>
  )
}
