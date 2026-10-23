import React from 'react'

export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  showAvatar = false 
}: { 
  rows?: number, 
  columns?: number,
  showAvatar?: boolean
}) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      {/* Table Header Skeleton */}
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70 px-6 py-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div 
            key={`header-${i}`} 
            className="h-3.5 rounded-md bg-slate-200/70 animate-pulse" 
            style={{ width: `${Math.max(60, 100 - i * 15)}px` }}
          />
        ))}
      </div>
      
      {/* Table Body Skeleton */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={`row-${i}`} className="flex items-center justify-between px-6 py-4">
            {Array.from({ length: columns }).map((_, j) => (
              <div 
                key={`cell-${i}-${j}`} 
                className={`flex items-center gap-3 ${j === 0 ? 'w-2/5' : 'w-1/5'}`}
              >
                {j === 0 && showAvatar && (
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-slate-200/80 animate-pulse" />
                )}
                <div 
                  className={`h-3.5 rounded-md bg-slate-200/70 animate-pulse ${
                    j === columns - 1 ? 'max-w-[48px] ml-auto' : 'w-full'
                  }`} 
                  style={{ animationDelay: `${(i * columns + j) * 40}ms` }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
