export default function ParametresLoading() {
  return (
    <div className="flex flex-col relative w-full animate-pulse space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="w-48 h-8 bg-gray-200 rounded-lg"></div>
        <div className="w-80 h-4 bg-gray-100 rounded"></div>
      </div>

      {/* Settings Form Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
          <div className="w-20 h-20 rounded-2xl bg-gray-200"></div>
          <div className="space-y-2">
            <div className="w-36 h-5 bg-gray-200 rounded"></div>
            <div className="w-28 h-9 bg-gray-100 rounded-lg"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="w-28 h-4 bg-gray-200 rounded"></div>
              <div className="w-full h-11 bg-gray-100 rounded-lg"></div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <div className="w-40 h-11 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  )
}
