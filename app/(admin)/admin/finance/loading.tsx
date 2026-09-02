export default function FinanceLoading() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-8 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="w-48 h-8 bg-gray-200 rounded mb-2"></div>
          <div className="w-64 h-5 bg-gray-100 rounded"></div>
        </div>
        <div className="w-40 h-10 bg-gray-200 rounded-lg"></div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col h-32">
            <div className="flex w-full items-center justify-between mb-4">
              <div className="w-32 h-4 bg-gray-200 rounded"></div>
              <div className="w-10 h-10 rounded-xl bg-gray-100"></div>
            </div>
            <div className="w-24 h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-100 shadow-sm h-96">
          <div className="w-48 h-6 bg-gray-200 rounded mb-6"></div>
          <div className="w-full h-64 bg-gray-100 rounded"></div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm h-96">
          <div className="w-40 h-6 bg-gray-200 rounded mb-6"></div>
          <div className="w-48 h-48 rounded-full bg-gray-100 mx-auto my-4"></div>
          <div className="w-32 h-4 bg-gray-100 rounded mx-auto mt-6"></div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm h-64">
             <div className="flex justify-between items-center mb-6">
               <div className="w-40 h-6 bg-gray-200 rounded"></div>
               <div className="w-20 h-4 bg-gray-100 rounded"></div>
             </div>
             <div className="space-y-4">
               {[1, 2, 3].map((j) => (
                 <div key={j} className="flex justify-between items-center">
                   <div className="flex gap-3 items-center">
                     <div className="w-10 h-10 rounded-lg bg-gray-100"></div>
                     <div>
                       <div className="w-32 h-4 bg-gray-100 rounded mb-2"></div>
                       <div className="w-20 h-3 bg-gray-100 rounded"></div>
                     </div>
                   </div>
                   <div className="w-20 h-5 bg-gray-100 rounded"></div>
                 </div>
               ))}
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}
