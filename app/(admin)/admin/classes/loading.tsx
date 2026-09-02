export default function ClassesLoading() {
  return (
    <div className="flex flex-col relative w-full animate-pulse">
      {/* Page Header Skeleton */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="w-32 h-8 bg-gray-200 rounded mb-2"></div>
          <div className="w-64 h-5 bg-gray-100 rounded"></div>
        </div>
        <div className="w-40 h-12 bg-gray-200 rounded-lg"></div>
      </div>

      {/* Data Table Card Skeleton */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Table Controls */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <div className="w-32 h-8 bg-gray-200 rounded-lg"></div>
          <div className="w-24 h-4 bg-gray-100 rounded"></div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-6"><div className="w-24 h-4 bg-gray-200 rounded"></div></th>
                <th className="py-3 px-6"><div className="w-20 h-4 bg-gray-200 rounded"></div></th>
                <th className="py-3 px-6"><div className="w-16 h-4 bg-gray-200 rounded ml-auto"></div></th>
                <th className="py-3 px-6"><div className="w-16 h-4 bg-gray-200 rounded ml-auto"></div></th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-3 px-6"><div className="w-20 h-4 bg-gray-100 rounded"></div></td>
                  <td className="py-3 px-6"><div className="w-16 h-4 bg-gray-100 rounded"></div></td>
                  <td className="py-3 px-6"><div className="w-12 h-4 bg-gray-100 rounded ml-auto"></div></td>
                  <td className="py-3 px-6"><div className="w-8 h-8 bg-gray-100 rounded-full ml-auto"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
