export default function AdminLoading() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-8 p-4 md:p-6 lg:p-8 animate-pulse">
      {/* Filters Row Skeleton */}
      <div className="flex justify-end mb-2">
        <div className="w-48 h-8 bg-gray-200 rounded-lg"></div>
      </div>

      {/* Top Stats Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm flex flex-col items-start gap-3 h-28">
            <div className="flex w-full items-center justify-between">
              <div className="w-20 h-3 bg-gray-200 rounded"></div>
              <div className="w-8 h-8 rounded-full bg-gray-100"></div>
            </div>
            <div className="w-16 h-8 bg-gray-200 rounded mt-auto"></div>
          </div>
        ))}
      </div>

      {/* Middle Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm h-80">
          <div className="w-48 h-6 bg-gray-200 rounded mb-6"></div>
          <div className="w-full h-40 bg-gray-100 rounded mb-4"></div>
          <div className="flex justify-between items-end border-t border-gray-100 pt-4">
             <div className="flex gap-4">
               <div className="w-24 h-10 bg-gray-100 rounded"></div>
               <div className="w-24 h-10 bg-gray-100 rounded"></div>
             </div>
             <div className="w-12 h-12 rounded-full bg-gray-100"></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm h-80">
           <div className="w-32 h-6 bg-gray-200 rounded mb-6"></div>
           <div className="space-y-4">
             {[1, 2, 3, 4].map((i) => (
               <div key={i} className="flex justify-between">
                 <div className="w-24 h-4 bg-gray-100 rounded"></div>
                 <div className="w-16 h-4 bg-gray-100 rounded"></div>
                 <div className="w-20 h-4 bg-gray-100 rounded"></div>
               </div>
             ))}
           </div>
        </div>
      </div>

      {/* Bottom Row Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm h-64">
            <div className="w-40 h-6 bg-gray-200 rounded mb-6"></div>
            <div className="flex gap-4 items-center">
              <div className="w-32 h-32 rounded-full bg-gray-100 shrink-0"></div>
              <div className="space-y-3 flex-1">
                <div className="w-full h-4 bg-gray-100 rounded"></div>
                <div className="w-3/4 h-4 bg-gray-100 rounded"></div>
                <div className="w-1/2 h-4 bg-gray-100 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
