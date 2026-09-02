export default function ElevesLoading() {
  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-4rem)] animate-pulse">
      {/* Header Section Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="w-32 h-8 bg-gray-200 rounded mb-2"></div>
          <div className="w-64 h-5 bg-gray-100 rounded"></div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-40 h-12 bg-gray-200 rounded-lg"></div>
          <div className="w-full sm:w-40 h-12 bg-gray-200 rounded-lg"></div>
          <div className="w-full sm:w-48 h-12 bg-gray-300 rounded-lg"></div>
        </div>
      </div>

      {/* Tabs & Search Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 border-b border-gray-200 pb-3">
        <div className="flex gap-6 w-full sm:w-auto">
          <div className="w-20 h-6 bg-gray-200 rounded"></div>
          <div className="w-20 h-6 bg-gray-200 rounded"></div>
          <div className="w-20 h-6 bg-gray-200 rounded"></div>
        </div>
        <div className="hidden sm:block w-72 h-10 bg-gray-200 rounded-lg mt-4 sm:mt-0"></div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-4 px-6"><div className="w-24 h-4 bg-gray-200 rounded"></div></th>
                <th className="py-4 px-6"><div className="w-32 h-4 bg-gray-200 rounded"></div></th>
                <th className="py-4 px-6"><div className="w-20 h-4 bg-gray-200 rounded"></div></th>
                <th className="py-4 px-6"><div className="w-16 h-4 bg-gray-200 rounded ml-auto"></div></th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-4 px-6"><div className="w-20 h-4 bg-gray-100 rounded"></div></td>
                  <td className="py-4 px-6"><div className="w-48 h-4 bg-gray-100 rounded"></div></td>
                  <td className="py-4 px-6"><div className="w-24 h-4 bg-gray-100 rounded"></div></td>
                  <td className="py-4 px-6"><div className="w-8 h-8 bg-gray-100 rounded-full ml-auto"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
