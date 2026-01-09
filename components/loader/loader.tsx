


// Loading Screen - Updated spinner color
export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-red-50/30 to-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center py-20">
          <div className="w-12 h-12 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    </div>
  )
}