export default function RapportsLoading() {
  return (
    <div className="flex flex-col relative w-full animate-pulse space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="w-48 h-8 bg-gray-200 rounded-lg"></div>
        <div className="w-72 h-4 bg-gray-100 rounded"></div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100"></div>
            <div className="space-y-2">
              <div className="w-36 h-5 bg-gray-200 rounded"></div>
              <div className="w-full h-4 bg-gray-100 rounded"></div>
            </div>
            <div className="w-28 h-9 bg-gray-200 rounded-lg mt-4"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
