export default function AbonnementLoading() {
  return (
    <div className="flex flex-col relative w-full animate-pulse space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="w-56 h-8 bg-gray-200 rounded-lg"></div>
        <div className="w-80 h-4 bg-gray-100 rounded"></div>
      </div>

      {/* Subscription Status Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="w-32 h-6 bg-gray-200 rounded"></div>
            <div className="w-48 h-4 bg-gray-100 rounded"></div>
          </div>
          <div className="w-24 h-8 bg-gray-200 rounded-full"></div>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full"></div>
      </div>

      {/* Plans Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 shadow-xs">
            <div className="w-28 h-6 bg-gray-200 rounded"></div>
            <div className="w-36 h-10 bg-gray-200 rounded-lg"></div>
            <div className="space-y-2 pt-2 border-t border-gray-100">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="w-full h-4 bg-gray-100 rounded"></div>
              ))}
            </div>
            <div className="w-full h-11 bg-gray-200 rounded-xl mt-4"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
