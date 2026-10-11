export default function AcademiqueLoading() {
  return (
    <div className="flex flex-col relative w-full animate-pulse space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="w-48 h-8 bg-gray-200 rounded-lg"></div>
          <div className="w-72 h-4 bg-gray-100 rounded"></div>
        </div>
        <div className="w-36 h-10 bg-gray-200 rounded-lg"></div>
      </div>

      {/* Tabs / Filter bar */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {[80, 100, 90, 110, 85].map((w, idx) => (
          <div key={idx} className="h-9 bg-gray-100 rounded-lg" style={{ width: `${w}px` }}></div>
        ))}
      </div>

      {/* Main Content Skeleton Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div className="w-28 h-5 bg-gray-200 rounded"></div>
              <div className="w-16 h-5 bg-gray-100 rounded-full"></div>
            </div>
            <div className="w-full h-12 bg-gray-50 rounded-lg"></div>
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <div className="w-20 h-4 bg-gray-100 rounded"></div>
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
