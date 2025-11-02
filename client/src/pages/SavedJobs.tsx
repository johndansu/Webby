import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Heart, 
  Briefcase, 
  Building2,
  MapPin,
  ExternalLink,
  User,
  LogOut,
  Bookmark,
  CheckCircle2,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cleanDescription } from '@/utils/htmlCleaner'
import { useToast } from '@/components/ToastContainer'
import { JobCardSkeleton } from '@/components/SkeletonLoader'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { useExitIntent } from '@/hooks/useExitIntent'
import { ExitIntentModal } from '@/components/ExitIntentModal'
import { RecentlyViewed } from '@/components/RecentlyViewed'

export default function SavedJobs() {
  const { user, logout } = useAuthStore()
  const { showInfo, showSuccess } = useToast()
  const [savedJobs, setSavedJobs] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('savedJobs')
    return saved ? new Set(JSON.parse(saved)) : new Set()
  })
  const [currentPage, setCurrentPage] = useState(1)
  const jobsPerPage = 20
  const [showExitIntent, setShowExitIntent] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
  // Load saved jobs from localStorage - no need for API call
  const [savedJobsObjects, setSavedJobsObjects] = useState(() => {
    const saved = localStorage.getItem('savedJobsObjects')
    return saved ? JSON.parse(saved) : {}
  })
  
  // Sync localStorage changes and cleanup orphaned keys
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('savedJobsObjects')
      if (saved) {
        setSavedJobsObjects(JSON.parse(saved))
      }
    }
    
    const handleFocus = () => {
      // Reload when tab regains focus to pick up changes from BrowseJobs
      const saved = localStorage.getItem('savedJobsObjects')
      if (saved) {
        setSavedJobsObjects(JSON.parse(saved))
      }
    }
    
    // Cleanup: Remove orphaned keys from savedJobs that don't have corresponding objects
    const saved = localStorage.getItem('savedJobsObjects')
    if (saved) {
      const objects = JSON.parse(saved)
      const objectKeys = new Set(Object.keys(objects))
      const currentSavedJobs = new Set(savedJobs)
      const orphanedKeys = [...currentSavedJobs].filter(key => !objectKeys.has(key))
      
      if (orphanedKeys.length > 0) {
        const cleanedSet = new Set([...currentSavedJobs].filter(key => objectKeys.has(key)))
        setSavedJobs(cleanedSet)
        localStorage.setItem('savedJobs', JSON.stringify([...cleanedSet]))
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [savedJobs])

  const toggleSaveJob = (jobKey: string, jobTitle?: string) => {
    const wasSaved = savedJobs.has(jobKey)
    const previousState = new Set(savedJobs)
    const previousObjects = { ...savedJobsObjects }
    
    setSavedJobs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(jobKey)) {
        newSet.delete(jobKey)
      } else {
        newSet.add(jobKey)
      }
      localStorage.setItem('savedJobs', JSON.stringify([...newSet]))
      return newSet
    })
    
    setSavedJobsObjects(prev => {
      const updated = { ...prev }
      if (wasSaved) {
        delete updated[jobKey]
      }
      localStorage.setItem('savedJobsObjects', JSON.stringify(updated))
      return updated
    })

    if (wasSaved) {
      // Job was removed
      showInfo(
        jobTitle ? `Removed "${jobTitle}"` : 'Job removed from saved',
        {
          label: 'Undo',
          onClick: () => {
            setSavedJobs(previousState)
            setSavedJobsObjects(previousObjects)
            localStorage.setItem('savedJobs', JSON.stringify([...previousState]))
            localStorage.setItem('savedJobsObjects', JSON.stringify(previousObjects))
            showSuccess('Job saved again')
          }
        }
      )
    }
  }

  // Get saved jobs from localStorage objects
  const allSavedJobs = Object.entries(savedJobsObjects).map(([jobKey, job]: [string, any]) => ({
    ...job,
    jobKey
  }))
  
  // Pagination calculations
  const totalPages = Math.ceil(allSavedJobs.length / jobsPerPage)
  const startIndex = (currentPage - 1) * jobsPerPage
  const endIndex = startIndex + jobsPerPage
  const filteredSavedJobs = allSavedJobs.slice(startIndex, endIndex)
  
  const isLoading = false
  
  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Simple Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Job<span className="text-teal-600">Hunter</span>
            </Link>

            {/* Mobile - Always show user info if logged in */}
            <div className="md:hidden flex items-center gap-2">
              {user && (
                <>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate max-w-[100px]">
                    {user.username}
                  </span>
                  <button 
                    onClick={logout} 
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </>
              )}
              {/* Hamburger Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative"
                aria-label="Toggle menu"
              >
                <Filter className="h-6 w-6" />
              </button>
            </div>

            <nav className="hidden md:flex items-center space-x-1">
              <Link 
                to="/browse" 
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Browse Jobs
              </Link>
              <Link 
                to="/saved" 
                className="px-4 py-2 text-white font-semibold bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <Bookmark className="h-4 w-4" />
                Saved ({savedJobs.size})
              </Link>
              <div className="ml-4 pl-4 border-l border-slate-200 dark:border-slate-700">
                <ThemeSwitcher />
              </div>
              <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-slate-200 dark:border-slate-700">
                {user && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-teal-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {user.username}
                      </span>
                    </div>
                    <button 
                      onClick={logout} 
                      className="inline-flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:text-white hover:bg-red-600 dark:hover:bg-red-600 rounded-lg transition-all font-medium"
                      title="Logout"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="text-sm">Logout</span>
                    </button>
                  </>
                )}
                {!user && (
                  <Link 
                    to="/login"
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Login
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Dropdown Menu */}
      {showMobileMenu && (
        <div className="md:hidden fixed top-20 right-4 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-[60]">
          <div className="p-3 space-y-1">
            <Link 
              to="/browse" 
              onClick={() => setShowMobileMenu(false)}
              className="block px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium"
            >
              Browse Jobs
            </Link>
            <Link 
              to="/saved" 
              onClick={() => setShowMobileMenu(false)}
              className="block px-4 py-2.5 text-white font-semibold bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors text-center"
            >
              <div className="flex items-center justify-between">
                <span>Saved Jobs</span>
                <span className="bg-teal-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                  {savedJobs.size}
                </span>
              </div>
            </Link>
            <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Theme</span>
                <ThemeSwitcher />
              </div>
            </div>
            {!user && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                <Link 
                  to="/login"
                  onClick={() => setShowMobileMenu(false)}
                  className="block px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium text-center"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Clean Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                Saved Jobs
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {savedJobs.size} {savedJobs.size === 1 ? 'job' : 'jobs'} saved
              </p>
            </div>

            {filteredSavedJobs.length > 0 && (
              <Link
                to="/browse"
                className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors inline-flex items-center gap-2"
              >
                <Briefcase className="h-4 w-4" />
                Browse More Jobs
              </Link>
            )}
          </div>
        </div>

        {/* Recently Viewed Jobs */}
        <RecentlyViewed />

        {/* Saved Jobs List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredSavedJobs.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <Heart className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No saved jobs yet</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Browse jobs and save the ones you like
            </p>
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
            >
              <Briefcase className="h-5 w-5" />
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSavedJobs.map((job: any, index: number) => {
              if (!job) return null

                return (
                  <div
                    key={job.jobKey || index}
                    className="group bg-white dark:bg-slate-800 rounded-xl p-5 hover:shadow-lg transition-all duration-200 border border-slate-200 dark:border-slate-700 hover:border-slate-300 flex flex-col"
                  >
                    {/* Header - Company Logo & Unsave Button */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-12 w-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                      </div>

                      <button
                        onClick={() => toggleSaveJob(job.jobKey, job.title)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                        title="Remove from saved"
                      >
                        <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                      </button>
                    </div>

                    {/* Job Title */}
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1 line-clamp-2">
                      {job.title || 'No Title'}
                    </h3>

                    {/* Company Name */}
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{job.company || 'Company'}</p>

                    {/* Location & Type */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate">{job.location || 'Remote'}</span>
                      </div>
                      {job.type && (
                        <>
                          <span>•</span>
                          <span>{job.type}</span>
                        </>
                      )}
                    </div>

                    {/* Description */}
                    {job.description && (
                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
                        {cleanDescription(job.description, 150)}
                      </p>
                    )}

                    {/* Salary */}
                    {job.salary && job.salary !== 'Not specified' && (
                      <div className="mb-4">
                        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                          {job.salary}
                        </span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-700">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-teal-700 transition-colors text-sm"
                      >
                        Apply
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                )
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && filteredSavedJobs.length > 0 && totalPages > 1 && (
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Showing <span className="font-semibold text-slate-900 dark:text-slate-100">{startIndex + 1}</span> to{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">{Math.min(endIndex, allSavedJobs.length)}</span> of{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">{allSavedJobs.length}</span> jobs
            </div>
            
            <div className="flex items-center gap-1">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        currentPage === pageNum
                          ? 'bg-teal-600 border-teal-600 text-white'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              
              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
        
        {/* Show end message if on last page */}
        {!isLoading && filteredSavedJobs.length > 0 && currentPage === totalPages && totalPages > 1 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full">
              <CheckCircle2 className="h-4 w-4 text-teal-600" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                You've viewed all {allSavedJobs.length} saved jobs
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Exit Intent Modal */}
      <ExitIntentModal 
        isOpen={showExitIntent} 
        onClose={() => setShowExitIntent(false)} 
      />
    </div>
  )
}

