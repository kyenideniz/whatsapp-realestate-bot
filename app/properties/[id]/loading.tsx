// app/properties/[id]/loading.tsx
export default function Loading() {
    return (
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar Skeleton */}
        <div className="w-64 bg-white border-r border-gray-200 animate-pulse"></div>
        
        {/* Main Content Loading State */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="h-8 w-8 bg-gray-300 rounded"></div>
          </div>
  
          <div className="space-y-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-1/5"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
            
            {/* Calendar Loading */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
            
            {/* Description Loading */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }