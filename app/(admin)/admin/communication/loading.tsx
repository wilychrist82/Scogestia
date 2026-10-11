export default function CommunicationLoading() {
  return (
    <div className="flex flex-col relative w-full animate-pulse space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="w-52 h-8 bg-gray-200 rounded-lg"></div>
          <div className="w-80 h-4 bg-gray-100 rounded"></div>
        </div>
        <div className="w-36 h-10 bg-gray-200 rounded-lg"></div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100"></div>
            <div className="space-y-1.5 flex-1">
              <div className="w-16 h-3 bg-gray-100 rounded"></div>
              <div className="w-24 h-6 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Messages list card skeleton */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <div className="w-40 h-8 bg-gray-200 rounded-lg"></div>
          <div className="w-24 h-4 bg-gray-100 rounded"></div>
        </div>
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                <div className="space-y-1.5">
                  <div className="w-32 h-4 bg-gray-200 rounded"></div>
                  <div className="w-48 h-3 bg-gray-100 rounded"></div>
                </div>
              </div>
              <div className="w-20 h-4 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
