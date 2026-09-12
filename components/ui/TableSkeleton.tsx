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
    <div className="w-full bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-sm overflow-hidden animate-pulse">
      {/* Table Header Skeleton */}
      <div className="bg-[#eff4ff] border-b border-[var(--color-outline-variant)] px-6 py-4 flex items-center justify-between">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={`header-${i}`} className="h-4 bg-gray-200 rounded w-24"></div>
        ))}
      </div>
      
      {/* Table Body Skeleton */}
      <div className="divide-y divide-[var(--color-outline-variant)]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={`row-${i}`} className="px-6 py-4 flex items-center justify-between">
            {Array.from({ length: columns }).map((_, j) => (
              <div key={`cell-${i}-${j}`} className={`flex items-center gap-3 ${j === 0 ? 'w-1/3' : 'w-1/5'}`}>
                {j === 0 && showAvatar && (
                  <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0"></div>
                )}
                <div className={`h-4 bg-gray-200 rounded w-full ${j === columns - 1 ? 'max-w-[40px] ml-auto' : ''}`}></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
