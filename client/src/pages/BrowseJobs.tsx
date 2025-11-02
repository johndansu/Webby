import { useState, useEffect, lazy, Suspense } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Building2,
  DollarSign,
  Clock,
  Heart,
  ExternalLink,
  Filter,
  X,
  User,
  LogOut,
  RefreshCw,
  SlidersHorizontal,
  TrendingUp,
  Star,
  CheckCircle2,
  Calendar,
  Bookmark,
  Plus,
  GitCompare,
  Share2,
  Save,
  ChevronLeft,
  ChevronRight,
  Target
} from 'lucide-react'
import { searchService } from '@/services/searchService'
import { locationService } from '@/services/locationService'
import { useAuthStore } from '@/store/authStore'
import { cleanDescription } from '@/utils/htmlCleaner'
import { useToast } from '@/components/ToastContainer'
import { celebrate, getMilestone } from '@/utils/confetti'
import { JobCardSkeleton, SearchBarSkeleton } from '@/components/SkeletonLoader'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { useExitIntent } from '@/hooks/useExitIntent'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import { useSearchHistory } from '@/hooks/useSearchHistory'
import { useJobComparison } from '@/hooks/useJobComparison'
import { useSavedSearches } from '@/hooks/useSavedSearches'
import { JobFilters, JobFiltersState, DEFAULT_FILTERS } from '@/components/JobFilters'
import AdSense from '@/components/AdSense'

// Lazy load heavy components
const ExitIntentModal = lazy(() => import('@/components/ExitIntentModal').then(m => ({ default: m.ExitIntentModal })))
const JobRecommendations = lazy(() => import('@/components/JobRecommendations').then(m => ({ default: m.JobRecommendations })))
const SavedSearches = lazy(() => import('@/components/SavedSearches').then(m => ({ default: m.SavedSearches })))
const SearchAutocomplete = lazy(() => import('@/components/SearchAutocomplete').then(m => ({ default: m.SearchAutocomplete })))
const JobComparisonModal = lazy(() => import('@/components/JobComparisonModal').then(m => ({ default: m.JobComparisonModal })))
const ShareJobModal = lazy(() => import('@/components/ShareJobModal').then(m => ({ default: m.ShareJobModal })))

// Read More Description Component - Opens modal for full description
function ReadMoreDescription({ description, title, company }: { description: string; title: string; company: string }) {
  const [showModal, setShowModal] = useState(false)
  const cleanedDescription = cleanDescription(description, 500)
  
  return (
    <>
      <div className="mb-4 flex-1">
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-2 line-clamp-3">
          {cleanedDescription}
        </p>
        {cleanedDescription.length > 150 && (
          <button
            onClick={() => setShowModal(true)}
            className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 text-sm font-semibold transition-colors"
          >
            Show more
          </button>
        )}
      </div>
      
      {/* Job Description Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{company}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                  <X className="h-6 w-6 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-100px)] px-6 py-6">
              <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {description}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function BrowseJobs() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, logout } = useAuthStore()
  const { showSuccess, showInfo } = useToast()
  const { addRecentJob, recentJobs } = useRecentlyViewed()
  const { addSearch } = useSearchHistory()
  const { compareList, addToCompare, removeFromCompare, clearCompare, isInCompare, canAddMore, count: compareCount } = useJobComparison()
  const { saveSearch } = useSavedSearches()
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [location, setLocation] = useState(searchParams.get('location') || '')
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([])
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [showSearchAutocomplete, setShowSearchAutocomplete] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [shareJob, setShareJob] = useState<{ title: string; url: string; company: string } | null>(null)
  const [activeFilters, setActiveFilters] = useState<JobFiltersState>(DEFAULT_FILTERS)
  const [refreshKey, setRefreshKey] = useState(0) // For random refresh
  const [currentPage, setCurrentPage] = useState(1)
  const jobsPerPage = 20
  const [showExitIntent, setShowExitIntent] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [savedJobs, setSavedJobs] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('savedJobs')
    return saved ? new Set(JSON.parse(saved)) : new Set()
  })
  
  // Store full job objects separately
  const [savedJobsObjects, setSavedJobsObjects] = useState<Map<string, any>>(() => {
    const saved = localStorage.getItem('savedJobsObjects')
    return saved ? new Map(Object.entries(JSON.parse(saved))) : new Map()
  })

  // Exit intent - only show if not dismissed and no email captured
  const shouldShowExitIntent = !localStorage.getItem('exitIntentDismissed') && !localStorage.getItem('exitIntentEmail')
  
  useExitIntent({
    onExitIntent: () => {
      if (shouldShowExitIntent) {
        setShowExitIntent(true)
      }
    },
    delay: 3000, // Wait 3 seconds before enabling
    enabled: shouldShowExitIntent
  })

  // Debounced location search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (location.length >= 2) {
        try {
          const suggestions = await locationService.searchLocations(location)
          setLocationSuggestions(suggestions)
          setShowLocationSuggestions(true)
        } catch (error) {
          console.error('Location search error:', error)
        }
      } else {
        setLocationSuggestions([])
        setShowLocationSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [location])

  // Fetch jobs directly from APIs, not from admin's database
  const { data: jobsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['browse-jobs', searchQuery, location, refreshKey],
    queryFn: () => searchService.searchJobs(searchQuery, location),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes - much longer for better performance
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData, // Keep previous data while loading
    gcTime: 30 * 60 * 1000 // Keep in cache for 30 minutes
  })

  const toggleSaveJob = (jobKey: string, jobTitle?: string, jobObject?: any) => {
    const wasSaved = savedJobs.has(jobKey)
    
    // Store previous state for undo
    const previousState = new Set(savedJobs)
    const previousObjects = new Map(savedJobsObjects)
    
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
    
    // Also update the saved objects Map
    setSavedJobsObjects(prev => {
      const newMap = new Map(prev)
      if (wasSaved) {
        newMap.delete(jobKey)
      } else if (jobObject) {
        newMap.set(jobKey, jobObject)
      }
      localStorage.setItem('savedJobsObjects', JSON.stringify(Object.fromEntries(newMap)))
      return newMap
    })

    if (!wasSaved) {
      // Job was saved
      const newCount = savedJobs.size + 1
      const milestone = getMilestone(newCount)
      
      if (milestone) {
        // Celebrate milestone
        const message = celebrate(milestone)
        if (message) {
          showSuccess(message)
        }
      } else {
        showSuccess(
          jobTitle ? `Saved "${jobTitle}"` : 'Job saved!',
          {
            label: 'Undo',
            onClick: () => {
              setSavedJobs(previousState)
              setSavedJobsObjects(previousObjects)
              localStorage.setItem('savedJobs', JSON.stringify([...previousState]))
              localStorage.setItem('savedJobsObjects', JSON.stringify(Object.fromEntries(previousObjects)))
              showInfo('Job unsaved')
            }
          }
        )
      }
    } else {
      // Job was removed
      showInfo(
        jobTitle ? `Removed "${jobTitle}"` : 'Job removed from saved',
        {
          label: 'Undo',
          onClick: () => {
            setSavedJobs(previousState)
            setSavedJobsObjects(previousObjects)
            localStorage.setItem('savedJobs', JSON.stringify([...previousState]))
            localStorage.setItem('savedJobsObjects', JSON.stringify(Object.fromEntries(previousObjects)))
            showSuccess('Job saved again')
          }
        }
      )
    }
  }

  const parseData = (data: any) => {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data)
      } catch (e) {
        return null
      }
    }
    return data
  }

  // Jobs come directly from APIs, already filtered by backend
  const jobs = jobsData?.data || []
  
  // Fisher-Yates shuffle for randomization when browsing without search
  const shuffleArray = (array: any[]) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Apply filters
  const applyFilters = (jobList: any[]) => {
    return jobList.filter((job: any) => {
      // Salary filter - only apply if custom range is set (not default 0-300k)
      const hasCustomSalaryRange = activeFilters.salaryRange[0] > 0 || activeFilters.salaryRange[1] < 300000
      if (hasCustomSalaryRange && job.salary) {
        const salaryStr = String(job.salary).replace(/[^0-9]/g, '')
        const jobSalary = parseInt(salaryStr)
        if (!isNaN(jobSalary)) {
          if (jobSalary < activeFilters.salaryRange[0] || jobSalary > activeFilters.salaryRange[1]) {
            return false
          }
        }
      }

      // Job type filter
      if (activeFilters.jobTypes.length > 0) {
        const jobType = (job.type || '').toLowerCase()
        const matchesJobType = activeFilters.jobTypes.some(type => jobType.includes(type.toLowerCase()))
        if (!matchesJobType) {
          return false
        }
      }

      // Work mode filter
      if (activeFilters.workMode.length > 0) {
        const jobLocation = (job.location || '').toLowerCase()
        const jobTitle = (job.title || '').toLowerCase()
        const jobDescription = (job.description || '').toLowerCase()
        const hasRemote = jobLocation.includes('remote') || jobTitle.includes('remote') || jobDescription.includes('remote')
        const hasHybrid = jobLocation.includes('hybrid') || jobTitle.includes('hybrid') || jobDescription.includes('hybrid')
        const hasOnsite = !hasRemote && !hasHybrid

        const matchesMode = activeFilters.workMode.some(mode => {
          if (mode === 'Remote') return hasRemote
          if (mode === 'Hybrid') return hasHybrid
          if (mode === 'On-site') return hasOnsite
          return false
        })

        if (!matchesMode) return false
      }

      // Experience level filter
      if (activeFilters.experienceLevel.length > 0) {
        const jobTitle = (job.title || '').toLowerCase()
        const jobDescription = (job.description || '').toLowerCase()
        const matchesLevel = activeFilters.experienceLevel.some(level => {
          const levelLower = level.toLowerCase()
          return jobTitle.includes(levelLower) || jobDescription.includes(levelLower)
        })

        if (!matchesLevel) return false
      }

      return true
    })
  }

  // Helper function to extract city from location string
  const extractCity = (loc: string): string => {
    if (!loc) return ''
    // Try to extract city name before comma or from common formats
    const cityMatch = loc.match(/^([^,]+)/)
    return cityMatch ? cityMatch[1].trim().toLowerCase() : loc.toLowerCase()
  }

  // Sort jobs by location proximity when user has entered a location
  const sortJobsByLocation = (jobList: any[]) => {
    if (!location) return jobList
    
    const userCity = extractCity(location)
    
    return jobList.sort((a, b) => {
      const locA = a.location || ''
      const locB = b.location || ''
      
      const cityA = extractCity(locA)
      const cityB = extractCity(locB)
      
      // Exact city match gets highest priority
      if (cityA === userCity && cityB !== userCity) return -1
      if (cityA !== userCity && cityB === userCity) return 1
      
      // Partial match gets second priority
      const partialMatchA = locA.toLowerCase().includes(userCity) && cityA !== userCity
      const partialMatchB = locB.toLowerCase().includes(userCity) && cityB !== userCity
      
      if (partialMatchA && !partialMatchB) return -1
      if (!partialMatchA && partialMatchB) return 1
      
      // Remote jobs get lower priority when searching with location
      if (locA.toLowerCase().includes('remote') && !locB.toLowerCase().includes('remote')) return 1
      if (!locA.toLowerCase().includes('remote') && locB.toLowerCase().includes('remote')) return -1
      
      return 0
    })
  }

  // Randomize when not searching, then apply filters and sort by location
  const shuffledJobs = (!searchQuery && !location) ? shuffleArray(jobs) : jobs
  const filteredJobs = applyFilters(shuffledJobs)
  const sortedJobs = sortJobsByLocation(filteredJobs)
  const allJobs = sortedJobs
  
  // Pagination calculations
  const totalPages = Math.ceil(allJobs.length / jobsPerPage)
  const startIndex = (currentPage - 1) * jobsPerPage
  const endIndex = startIndex + jobsPerPage
  const displayJobs = allJobs.slice(startIndex, endIndex)

  // Count active filters
  const activeFilterCount = 
    (activeFilters.jobTypes.length > 0 ? 1 : 0) +
    (activeFilters.workMode.length > 0 ? 1 : 0) +
    (activeFilters.experienceLevel.length > 0 ? 1 : 0) +
    (activeFilters.salaryRange[0] > 0 || activeFilters.salaryRange[1] < 300000 ? 1 : 0)

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1) // Trigger new random shuffle
    setCurrentPage(1) // Reset to first page
  }

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Reset to first page when search/filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, location, refreshKey, activeFilters])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Professional Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="h-10 w-10 bg-teal-600 rounded-lg flex items-center justify-center group-hover:bg-teal-700 transition-colors duration-200">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                Job<span className="text-teal-600">Hunter</span>
              </span>
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
                className="px-4 py-2 text-white font-semibold bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
              >
                Browse Jobs
              </Link>
              <Link 
                to="/saved" 
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-2"
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
              className="block px-4 py-2.5 text-white font-semibold bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors text-center"
            >
              Browse Jobs
            </Link>
            <Link 
              to="/saved" 
              onClick={() => setShowMobileMenu(false)}
              className="block px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium"
            >
              <div className="flex items-center justify-between">
                <span>Saved Jobs</span>
                <span className="bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full text-xs font-semibold">
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
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">
            Discover your next opportunity
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Search across <span className="font-semibold text-slate-900 dark:text-slate-100">500,000+ jobs</span> from 50+ job boards
          </p>
        </div>

        {/* Saved Searches */}
        <Suspense fallback={null}>
          <SavedSearches
            onApply={(query, loc, filters) => {
              setSearchQuery(query)
              setLocation(loc || '')
              setActiveFilters(filters)
              setCurrentPage(1)
              showSuccess('Search applied!')
            }}
          />
        </Suspense>

        {/* AI Job Recommendations - Only show on desktop for better mobile performance */}
        {!searchQuery && !location && (
          <div className="hidden md:block">
            <Suspense fallback={null}>
              <JobRecommendations
                allJobs={allJobs}
                savedJobIds={savedJobs}
                viewedJobs={recentJobs}
                onSaveJob={toggleSaveJob}
                onViewJob={(job) => {
                  const jobKey = `${job.title || 'untitled'}-${job.company || 'company'}`
                  addRecentJob({
                    id: jobKey,
                    title: job.title || 'No Title',
                    company: job.company || 'Company',
                    location: job.location || 'Remote',
                    type: job.type,
                    salary: job.salary,
                    url: job.url
                  })
                }}
              />
            </Suspense>
          </div>
        )}

        {/* Professional Search Bar */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8 border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                What job are you looking for?
              </label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-600 transition-colors z-10" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchAutocomplete(true)}
                  placeholder="Job title, keywords, or company..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all"
                />
                {showSearchAutocomplete && (
                  <Suspense fallback={null}>
                    <SearchAutocomplete
                      isOpen={showSearchAutocomplete}
                      onClose={() => setShowSearchAutocomplete(false)}
                      onSelect={(query, loc) => {
                        setSearchQuery(query)
                        if (loc) setLocation(loc)
                        addSearch(query, loc)
                      }}
                      currentQuery={searchQuery}
                    />
                  </Suspense>
                )}
              </div>
            </div>

            <div className="md:col-span-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Where?
              </label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 z-10 group-focus-within:text-teal-600 transition-colors" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onFocus={() => locationSuggestions.length > 0 && setShowLocationSuggestions(true)}
                  placeholder="City, state, or remote"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all"
                />
                {/* Location Suggestions Dropdown */}
                {showLocationSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-slideDown">
                    {locationSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setLocation(suggestion)
                          setShowLocationSuggestions(false)
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors flex items-center space-x-2 first:rounded-t-xl last:rounded-b-xl"
                      >
                        <MapPin className="h-4 w-4 text-teal-600 flex-shrink-0" />
                        <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-3 flex flex-col justify-end gap-2">
              <button 
                onClick={() => {
                  if (searchQuery.trim()) {
                    addSearch(searchQuery, location)
                  }
                }}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white px-6 py-4 rounded-lg font-bold shadow-sm hover:shadow-md transition-all inline-flex items-center justify-center gap-2"
              >
                <Search className="h-5 w-5" />
                Search Jobs
              </button>
              <button
                onClick={() => {
                  const name = prompt('Name this search:', `${searchQuery || 'All Jobs'}${location ? ` in ${location}` : ''}`)
                  if (name) {
                    saveSearch(name, searchQuery, location, activeFilters, false)
                    showSuccess('Search saved! Find it below.')
                  }
                }}
                className="w-full border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all inline-flex items-center justify-center gap-2 text-sm"
              >
                <Save className="h-4 w-4" />
                Save Search
              </button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-700">Quick Filters:</span>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 dark:bg-teal-900/30 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors relative"
              >
                <SlidersHorizontal className="h-4 w-4" />
                All Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-teal-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Remote', type: 'workMode' as const, value: 'Remote' },
                { label: 'Full-time', type: 'jobTypes' as const, value: 'Full-time' },
                { label: 'Part-time', type: 'jobTypes' as const, value: 'Part-time' },
                { label: 'Contract', type: 'jobTypes' as const, value: 'Contract' },
                { label: '$100k+', type: 'salary' as const, value: 100000 },
                { label: 'Entry Level', type: 'experienceLevel' as const, value: 'Entry Level' },
                { label: 'Senior Level', type: 'experienceLevel' as const, value: 'Senior Level' }
              ].map((filter, index) => {
                const isActive = filter.type === 'salary' 
                  ? activeFilters.salaryRange[0] >= 100000
                  : (activeFilters[filter.type] as string[]).includes(filter.value as string)
                
                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (filter.type === 'salary') {
                        setActiveFilters(prev => ({
                          ...prev,
                          salaryRange: isActive ? [0, 300000] : [100000, 300000]
                        }))
                      } else {
                        setActiveFilters(prev => {
                          const currentArray = prev[filter.type] as string[]
                          const newArray = isActive 
                            ? currentArray.filter(v => v !== filter.value)
                            : [...currentArray, filter.value as string]
                          return {
                            ...prev,
                            [filter.type]: newArray
                          }
                        })
                      }
                    }}
                    className={`px-4 py-2 border rounded-full text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-teal-600 border-teal-600 text-white hover:bg-teal-700' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-600 hover:text-teal-700'
                    }`}
                  >
                    {filter.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Results Header with Sorting */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {displayJobs.length.toLocaleString()} Jobs Found
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {searchQuery && <span>for "<strong className="text-slate-900 dark:text-slate-100">{searchQuery}</strong>"</span>}
              {location && <span> in <strong className="text-slate-900 dark:text-slate-100">{location}</strong></span>}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {!searchQuery && !location && (
              <button
                onClick={handleRefresh}
                disabled={isFetching}
                className="flex items-center gap-2 px-4 py-2 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}
            
            {/* Loading indicator for background refreshes */}
            {isFetching && !isLoading && displayJobs.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-teal-50 dark:bg-teal-900/30 rounded-lg">
                <RefreshCw className="h-3 w-3 animate-spin text-teal-600" />
                <span className="text-xs text-teal-700 dark:text-teal-300 font-medium">Updating...</span>
              </div>
            )}
            
            <select className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors bg-white dark:bg-slate-800">
              <option>Most Relevant</option>
              <option>Most Recent</option>
              <option>Salary: High to Low</option>
              <option>Salary: Low to High</option>
            </select>
          </div>
        </div>

        {/* Top Banner Ad */}
        <div className="mb-6">
          <AdSense 
            adSlot="0000000000"
            adFormat="horizontal"
            className="min-h-[90px] bg-slate-50 dark:bg-slate-800/50 rounded-lg"
          />
        </div>

        {/* Job Listings */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        ) : displayJobs.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700">
            <div className="inline-flex p-6 bg-slate-100 dark:bg-slate-700 rounded-full mb-6">
              <Briefcase className="h-16 w-16 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">No jobs found</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Try adjusting your search criteria or filters</p>
            <button 
              onClick={() => {
                setSearchQuery('')
                setLocation('')
              }}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold shadow-sm transition-colors"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayJobs.map((job: any, index: number) => {
              if (!job) return null
              // Use job.id if available (from API), otherwise construct a unique key
              const jobKey = job.id || `${job.title || 'untitled'}-${job.company || 'company'}-${job.source || 'unknown'}-${index}`

              // Insert AdSense ad after every 8 jobs
              const showAdAfter = (index + 1) % 8 === 0 && index > 0
              
              return (
                <>
                  <div
                    key={jobKey}
                    className="group bg-white dark:bg-slate-800 rounded-lg p-5 hover:shadow-lg transition-all duration-200 border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 flex flex-col animate-fadeIn"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                  {/* Header - Company Logo & Actions */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 bg-teal-50 dark:bg-teal-900/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-teal-100 dark:border-teal-800">
                      <Building2 className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Compare Checkbox */}
                      <button
                        onClick={() => {
                          if (isInCompare(jobKey)) {
                            removeFromCompare(jobKey)
                            showInfo('Removed from comparison')
                          } else if (canAddMore) {
                            addToCompare({
                              id: jobKey,
                              title: job.title || 'No Title',
                              company: job.company || 'Company',
                              location: job.location || 'Remote',
                              type: job.type,
                              salary: job.salary,
                              description: job.description,
                              url: job.url
                            })
                            showSuccess('Added to comparison')
                          } else {
                            showInfo('Maximum 3 jobs can be compared')
                          }
                        }}
                        disabled={!canAddMore && !isInCompare(jobKey)}
                        className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                          isInCompare(jobKey)
                            ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600'
                            : 'hover:bg-teal-50 dark:hover:bg-teal-900/20 text-slate-400'
                        } ${!canAddMore && !isInCompare(jobKey) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isInCompare(jobKey) ? 'Remove from comparison' : 'Add to comparison'}
                      >
                        <GitCompare className={`h-5 w-5 ${isInCompare(jobKey) ? 'text-teal-600' : ''}`} />
                      </button>

                      {/* Save Button */}
                      <button
                        onClick={() => toggleSaveJob(jobKey, job.title, job)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all flex-shrink-0 group/save"
                      >
                        <Heart
                          className={`h-5 w-5 transition-all ${
                            savedJobs.has(jobKey)
                              ? 'fill-red-500 text-red-500 scale-110'
                              : 'text-slate-300 group-hover/save:text-red-400 group-hover/save:scale-110'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Job Title */}
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1 group-hover:text-teal-600 transition-colors line-clamp-2">
                    {job.title || 'No Title'}
                  </h3>
                  
                  {/* Company Name */}
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">{job.company || 'Company'}</p>
                  
                  {/* Location */}
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-3">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{job.location || 'Remote'}</span>
                  </div>

                  {/* Tags & Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.type && (
                      <span className="px-3 py-1.5 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800 rounded-lg text-xs font-semibold">
                        {job.type}
                      </span>
                    )}
                    {job.salary && job.salary !== 'Not specified' && (
                      <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        {job.salary}
                      </span>
                    )}
                    {job.experience && (
                      <span className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-semibold">
                        {job.experience}
                      </span>
                    )}
                  </div>

                  {/* Description with read more */}
                  {job.description && (
                    <ReadMoreDescription 
                      description={job.description} 
                      title={job.title || 'No Title'}
                      company={job.company || 'Company'}
                    />
                  )}

                  {/* Footer - Source & Apply */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-700 mt-auto">
                    {job.source && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
                        <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                        <span className="truncate">via <span className="font-semibold text-slate-700 dark:text-slate-300">{job.source}</span></span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          // Debug log for The Muse jobs
                          if (job.source === 'The Muse') {
                            console.log(`[The Muse Click] Title: "${job.title}", URL: ${job.url}`)
                          }
                          addRecentJob({
                            id: jobKey,
                            title: job.title || 'No Title',
                            company: job.company || 'Company',
                            location: job.location || 'Remote',
                            type: job.type,
                            salary: job.salary,
                            url: job.url
                          })
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all text-sm"
                      >
                        <span>Apply Now</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => setShareJob({
                          title: job.title || 'No Title',
                          url: job.url,
                          company: job.company || 'Company'
                        })}
                        className="px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all border border-slate-200 dark:border-slate-600"
                        title="Share this job"
                      >
                        <Share2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* AdSense Ad - appears after every 8 jobs */}
                {showAdAfter && (
                  <div key={`ad-${index}`} className="col-span-full my-4">
                    <AdSense 
                      adSlot="0000000000"
                      adFormat="auto"
                      className="min-h-[100px]"
                    />
                  </div>
                )}
              </>
              )
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && displayJobs.length > 0 && totalPages > 1 && (
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Showing <span className="font-semibold text-slate-900 dark:text-slate-100">{startIndex + 1}</span> to{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">{Math.min(endIndex, allJobs.length)}</span> of{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">{allJobs.length}</span> jobs
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
        {!isLoading && displayJobs.length > 0 && currentPage === totalPages && totalPages > 1 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full">
              <CheckCircle2 className="h-4 w-4 text-teal-600" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                You've viewed all {allJobs.length} jobs
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Exit Intent Modal */}
      {showExitIntent && (
        <Suspense fallback={null}>
          <ExitIntentModal 
            isOpen={showExitIntent} 
            onClose={() => setShowExitIntent(false)} 
          />
        </Suspense>
      )}

      {/* Job Filters Panel */}
      <JobFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={activeFilters}
        onFiltersChange={(newFilters) => {
          setActiveFilters(newFilters)
          setCurrentPage(1) // Reset pagination when filters change
        }}
        onClear={() => {
          setActiveFilters(DEFAULT_FILTERS)
          setCurrentPage(1)
        }}
      />

      {/* Floating Compare Bar */}
      {compareCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-auto md:bottom-6 md:left-1/2 md:transform md:-translate-x-1/2 z-50 animate-slideUp md:max-w-md">
          <div className="bg-teal-600 text-white rounded-lg shadow-xl px-4 md:px-6 py-3 md:py-4 flex items-center gap-3 md:gap-4 border border-teal-500">
            <div className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              <span className="font-semibold text-sm md:text-base">
                {compareCount} {compareCount === 1 ? 'job' : 'jobs'}
              </span>
            </div>
            <div className="h-6 w-px bg-white/30 hidden md:block" />
            <button
              onClick={() => setShowCompareModal(true)}
              className="px-3 md:px-4 py-2 bg-white text-teal-600 hover:bg-teal-50 rounded-lg font-semibold transition-colors text-sm md:text-base whitespace-nowrap"
            >
              Compare Now
            </button>
            <button
              onClick={clearCompare}
              className="p-2 hover:bg-teal-700 rounded-lg transition-colors ml-auto md:ml-0"
              title="Clear all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Job Comparison Modal */}
      {showCompareModal && (
        <Suspense fallback={null}>
          <JobComparisonModal
            isOpen={showCompareModal}
            onClose={() => setShowCompareModal(false)}
            jobs={compareList}
            onRemove={removeFromCompare}
          />
        </Suspense>
      )}

      {/* Share Job Modal */}
      {shareJob && (
        <Suspense fallback={null}>
          <ShareJobModal
            isOpen={!!shareJob}
            onClose={() => setShareJob(null)}
            jobTitle={shareJob.title}
            jobUrl={shareJob.url}
            company={shareJob.company}
          />
        </Suspense>
      )}
    </div>
  )
}

