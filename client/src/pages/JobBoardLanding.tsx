import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Search, 
  MapPin, 
  ArrowRight,
  CheckCircle2,
  User,
  LogOut,
  Code,
  Palette,
  BarChart3,
  Megaphone,
  Briefcase,
  TrendingUp,
  Shield,
  Zap,
  Clock,
  Award,
  Users,
  Building2,
  Sparkles,
  Globe,
  Rocket,
  Star,
  X,
  Bookmark,
  Menu
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { locationService } from '@/services/locationService'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { useTheme } from '@/contexts/ThemeContext'

export default function JobBoardLanding() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { effectiveTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [location, setLocation] = useState('')
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([])
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null)
  const locationInputRef = useRef<HTMLDivElement>(null)
  const [savedJobsCount] = useState(() => {
    const saved = localStorage.getItem('savedJobs')
    return saved ? JSON.parse(saved).length : 0
  })

  // Debounced location search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (location.length >= 2) {
        try {
          const suggestions = await locationService.searchLocations(location)
          setLocationSuggestions(suggestions || [])
          setShowLocationSuggestions(true)
        } catch (error: any) {
          console.error('Location search error:', error)
          // Error will be handled by API interceptor, just clear suggestions on error
          setLocationSuggestions([])
          setShowLocationSuggestions(false)
        }
      } else {
        setLocationSuggestions([])
        setShowLocationSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [location])

  // Update dropdown position state when suggestions are shown (for absolute positioning, we just need a truthy value)
  useEffect(() => {
    if (showLocationSuggestions && locationInputRef.current) {
      setDropdownPosition({ top: 0, left: 0, width: 0 }) // Dummy value since we use absolute positioning
    } else {
      setDropdownPosition(null)
    }
  }, [showLocationSuggestions, locationSuggestions.length])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setShowLocationSuggestions(false) // Close location dropdown before navigation
    navigate(`/browse?q=${searchQuery}&location=${location}`)
  }

  // Close location suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      // Check if click is outside the location input and dropdown
      const locationContainer = target.closest('.location-input-container')
      const suggestionDropdown = target.closest('.location-suggestions-dropdown')
      
      if (!locationContainer && !suggestionDropdown) {
        setShowLocationSuggestions(false)
      }
    }

    if (showLocationSuggestions) {
      // Use a slight delay to allow click events on suggestions to fire first
      const timer = setTimeout(() => {
        document.addEventListener('click', handleClickOutside)
      }, 100)
      
      return () => {
        clearTimeout(timer)
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [showLocationSuggestions])

  const popularSearches = [
    'Remote Developer',
    'Product Manager',
    'UI/UX Designer',
    'Data Scientist',
    'Marketing Manager',
    'Full Stack Engineer'
  ]

  const jobCategories = [
    { name: 'Engineering', icon: Code, count: '12,500+', color: 'from-teal-500 to-teal-600', jobs: 'Software, DevOps, QA' },
    { name: 'Design', icon: Palette, count: '3,400+', color: 'from-purple-500 to-pink-500', jobs: 'UI/UX, Product, Graphics' },
    { name: 'Data & Analytics', icon: BarChart3, count: '8,200+', color: 'from-orange-500 to-red-500', jobs: 'Data Science, Analytics' },
    { name: 'Marketing', icon: Megaphone, count: '5,100+', color: 'from-green-500 to-teal-500', jobs: 'Digital, Content, Growth' },
    { name: 'Management', icon: Briefcase, count: '4,800+', color: 'from-indigo-500 to-purple-500', jobs: 'Product, Project, Team' },
    { name: 'Sales', icon: TrendingUp, count: '6,700+', color: 'from-yellow-500 to-orange-500', jobs: 'Account, Business Dev' }
  ]

  const features = [
    {
      icon: Zap,
      title: 'Instant Results',
      description: 'Search across 50+ job boards in real-time. No more tab switching.',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      icon: Shield,
      title: 'Verified Companies',
      description: 'Every company is verified. Apply with confidence to legitimate opportunities.',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Sparkles,
      title: 'AI Matching',
      description: 'Smart recommendations based on your skills, experience, and preferences.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Clock,
      title: 'Fresh Listings',
      description: 'Jobs updated every hour. Be the first to apply to new opportunities.',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
    }
  ]

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Software Engineer at Google',
      avatar: 'SC',
      content: 'Found my dream job in just 3 days! The multi-source search saved me so much time. I was able to compare opportunities across all major platforms instantly.',
      rating: 5,
      color: 'bg-gradient-to-br from-teal-400 to-teal-500'
    },
    {
      name: 'Michael Rodriguez',
      role: 'Product Manager at Stripe',
      avatar: 'MR',
      content: 'The salary transparency is incredible. No more guessing games. I knew exactly what to expect before applying, which made negotiations so much easier.',
      rating: 5,
      color: 'bg-gradient-to-br from-purple-400 to-pink-400'
    },
    {
      name: 'Jennifer Kim',
      role: 'UX Designer at Airbnb',
      avatar: 'JK',
      content: 'Best job search platform I\'ve ever used. The interface is beautiful and the AI recommendations actually work. Landed 5 interviews in my first week.',
      rating: 5,
      color: 'bg-gradient-to-br from-orange-400 to-red-400'
    }
  ]

  const companies = [
    { name: 'Google', initial: 'G', color: 'from-teal-500 to-teal-600' },
    { name: 'Microsoft', initial: 'M', color: 'from-sky-500 to-sky-600' },
    { name: 'Amazon', initial: 'A', color: 'from-orange-500 to-orange-600' },
    { name: 'Meta', initial: 'F', color: 'from-indigo-500 to-indigo-600' },
    { name: 'Apple', initial: 'A', color: 'from-slate-700 to-slate-800' },
    { name: 'Netflix', initial: 'N', color: 'from-red-500 to-red-600' },
    { name: 'Tesla', initial: 'T', color: 'from-red-600 to-red-700' },
    { name: 'Spotify', initial: 'S', color: 'from-green-500 to-green-600' }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 dark:bg-slate-900">
      {/* Modern Header with Glass Effect */}
      <header className="border-b border-slate-200 dark:border-slate-700 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-900 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="h-10 w-10 bg-teal-600 rounded-lg flex items-center justify-center group-hover:bg-teal-700 transition-colors duration-200">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 dark:text-slate-100">
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
                {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

            <nav className="hidden md:flex items-center space-x-1">
              <Link 
                to="/browse" 
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-slate-100 dark:hover:text-slate-100 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Browse Jobs
              </Link>
              {user && (
                <Link 
                  to="/saved" 
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-slate-100 dark:hover:text-slate-100 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <Bookmark className="h-4 w-4" />
                    Saved ({(() => {
                      const saved = localStorage.getItem('savedJobs')
                      return saved ? JSON.parse(saved).length : 0
                    })()})
                  </Link>
              )}
              <div className="ml-4 pl-4 border-l border-slate-200 dark:border-slate-700 dark:border-slate-700">
                <ThemeSwitcher />
              </div>
              <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-slate-200 dark:border-slate-700 dark:border-slate-700">
                {user && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-teal-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100 dark:text-slate-100">
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
              </div>
            </nav>

            {!user && (
              <div className="hidden md:flex items-center space-x-3">
                <Link 
                  to="/login" 
                  className="px-5 py-2.5 text-slate-700 hover:text-slate-900 dark:text-slate-100 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                >
                  Get Started
                </Link>
              </div>
            )}
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
            {user && (
              <Link 
                to="/saved" 
                onClick={() => setShowMobileMenu(false)}
                className="block px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium"
              >
                <div className="flex items-center justify-between">
                  <span>Saved Jobs</span>
                  <span className="bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {savedJobsCount}
                  </span>
                </div>
              </Link>
            )}
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
                  className="block px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium text-center"
                >
                  Login
                </Link>
                <Link 
                  to="/register"
                  onClick={() => setShowMobileMenu(false)}
                  className="block px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium text-center mt-1"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero Section - Premium & Bold */}
      <section className="relative bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pt-24 pb-20 overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        
        {/* Gradient orbs for depth */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-600/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Main Hero Content */}
          <div className="text-center max-w-5xl mx-auto mb-16">
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold text-slate-900 dark:text-slate-100 dark:text-slate-100 mb-8 leading-[1.05] tracking-tight animate-fadeIn">
              Your dream job is{' '}
              <span className="text-teal-600 dark:text-teal-400">
                one search away
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-300 dark:text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed animate-fadeIn" style={{ animationDelay: '200ms' }}>
              Stop wasting hours visiting 10+ job sites. We instantly search <strong className="text-slate-900 dark:text-slate-100 dark:text-slate-100 font-semibold">Indeed, LinkedIn, Glassdoor, and 50+ more</strong>—delivering every opportunity in seconds.
            </p>

            {/* Search Bar - Modern Design */}
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-8 animate-fadeIn" style={{ animationDelay: '300ms' }}>
              <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 dark:border-slate-700 p-2 hover:shadow-xl transition-shadow duration-300">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-600 transition-colors duration-200" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Job title, skill, or company..."
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all duration-200"
                    />
                </div>

                                    <div className="flex-1 relative group location-input-container" ref={locationInputRef}>                                                       
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-600 transition-colors duration-200 z-10" />                                                                      
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      onFocus={() => locationSuggestions.length > 0 && setShowLocationSuggestions(true)}                                                        
                      placeholder="City or 'Remote'"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all duration-200 relative z-10"                                       
                    />
                    {showLocationSuggestions && locationSuggestions.length > 0 && (                                                         
                      <div
                        className="location-suggestions-dropdown absolute z-[9999] border-2 border-slate-300 dark:border-slate-600 rounded-xl shadow-2xl max-h-60 overflow-y-auto animate-slideDown mt-2"                                               
                        style={{
                          backgroundColor: effectiveTheme === 'dark' ? '#1e293b' : '#ffffff',                                                                   
                          opacity: 1,
                          top: '100%',
                          left: 0,
                          right: 0,
                          width: '100%'
                        }}
                      >
                        {locationSuggestions.map((suggestion, index) => (       
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setLocation(suggestion)
                              setShowLocationSuggestions(false)
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-teal-50 dark:hover:bg-teal-900/30 text-sm text-slate-700 dark:text-slate-200 transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl border-b border-slate-100 dark:border-slate-700 last:border-b-0"                                    
                            style={{
                              backgroundColor: effectiveTheme === 'dark' ? '#1e293b' : '#ffffff',                                                               
                              background: effectiveTheme === 'dark' ? '#1e293b' : '#ffffff'                                                                     
                            }}
                          >
                            <MapPin className="h-4 w-4 inline-block mr-2 text-slate-400 dark:text-slate-400" />                                                 
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                </div>

                  <button
                    type="submit"
                    onClick={() => setShowLocationSuggestions(false)}
                    className="px-8 py-4 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-all duration-200 hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 relative z-10"
                  >
                    <Search className="h-5 w-5" />
                    Search Jobs
                  </button>
                </div>
              </div>
            </form>

            {/* Popular Searches - Modern Pills */}
            <div className="flex flex-wrap gap-2 justify-center items-center mb-12 animate-fadeIn" style={{ animationDelay: '400ms' }}>
              <span className="text-sm text-slate-500 font-medium">Trending:</span>
              {popularSearches.map((search) => (
                <button
                  key={search}
                  onClick={() => {
                    setSearchQuery(search)
                    navigate(`/browse?q=${search}`)
                  }}
                  className="px-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 text-sm font-medium rounded-full hover:border-teal-600 hover:text-teal-600 hover:bg-teal-50 transition-all duration-200"
                >
                  {search}
                </button>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pb-4 animate-fadeIn" style={{ animationDelay: '500ms' }}>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">4.9/5 from 2,000+ reviews</span>
            </div>
              <div className="hidden sm:block h-4 w-px bg-slate-300" />
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="h-5 w-5 text-teal-600" />
                <span className="font-medium">100% Free Forever</span>
            </div>
              <div className="hidden sm:block h-4 w-px bg-slate-300" />
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Shield className="h-5 w-5 text-teal-600" />
                <span className="font-medium">No Account Required</span>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats - Bold Metrics */}
      <section className="border-y border-slate-200 dark:border-slate-700 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-900 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { value: '500K+', label: 'Active Jobs', sublabel: 'Updated hourly', icon: Briefcase },
              { value: '50+', label: 'Job Boards', sublabel: 'All in one search', icon: Globe },
              { value: '2M+', label: 'Searches', sublabel: 'This month', icon: TrendingUp },
              { value: '4.9★', label: 'User Rating', sublabel: 'From 2K+ reviews', icon: Award }
            ].map((stat, index) => {
              const Icon = stat.icon
              return (
                <div 
                  key={index} 
                  className="text-center group animate-fadeIn hover:-translate-y-1 transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-50 rounded-2xl mb-4 group-hover:bg-teal-100 group-hover:scale-110 transition-all duration-300">
                    <Icon className="h-7 w-7 text-teal-600" />
                  </div>
                  <div className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-1 tracking-tight">{stat.value}</div>
                  <div className="text-base font-semibold text-slate-700 mb-1">{stat.label}</div>
                  <div className="text-xs text-slate-500">{stat.sublabel}</div>
            </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Job Categories - Modern Grid */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3 animate-fadeIn">
              Explore jobs by category
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 animate-fadeIn" style={{ animationDelay: '100ms' }}>
              Find opportunities in your field from top companies
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobCategories.map((category, index) => {
              const Icon = category.icon
              return (
                <button
                  key={index}
                  onClick={() => navigate(`/browse?category=${category.name}`)}
                  className="group relative bg-slate-50 dark:bg-slate-800 hover:bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-teal-600 rounded-xl p-6 transition-all duration-200 text-left animate-fadeIn hover:shadow-lg"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 group-hover:border-teal-200 group-hover:bg-teal-50 transition-all duration-200">
                      <Icon className="h-6 w-6 text-slate-600 dark:text-slate-300 group-hover:text-teal-600 transition-colors duration-200" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-teal-600 opacity-0 group-hover:opacity-100 transition-all duration-200" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-1 group-hover:text-teal-600 transition-colors duration-200">
                    {category.name}
                  </h3>
                  <p className="text-sm text-slate-500 mb-2">{category.jobs}</p>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{category.count} jobs available</p>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features - Modern Cards */}
      <section className="py-20 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3 animate-fadeIn">
              Everything you need to find your perfect job
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 animate-fadeIn" style={{ animationDelay: '100ms' }}>
              Search smarter, apply faster, and land your dream role
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div 
                  key={index} 
                  className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:border-teal-600 hover:shadow-lg transition-all duration-200 animate-fadeIn group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`inline-flex p-3 rounded-lg ${feature.bgColor} mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Job Boards We Search - Professional Grid */}
      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 animate-fadeIn">
              We search 50+ job boards so you don't have to
            </h2>
            <p className="text-slate-600 dark:text-slate-300 animate-fadeIn" style={{ animationDelay: '100ms' }}>
              One search. All the best opportunities. Save hours of job hunting.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[
              { name: 'Indeed', type: 'General' },
              { name: 'LinkedIn', type: 'Professional' },
              { name: 'Glassdoor', type: 'Reviews + Jobs' },
              { name: 'ZipRecruiter', type: 'General' },
              { name: 'Monster', type: 'General' },
              { name: 'CareerBuilder', type: 'General' },
              { name: 'Dice', type: 'Tech' },
              { name: 'AngelList', type: 'Startups' },
              { name: 'Stack Overflow', type: 'Developers' },
              { name: 'GitHub Jobs', type: 'Tech' },
              { name: 'Remote.co', type: 'Remote' },
              { name: 'FlexJobs', type: 'Remote/Flex' },
              { name: 'We Work Remotely', type: 'Remote' },
              { name: 'Remotive', type: 'Remote' },
              { name: 'Authentic Jobs', type: 'Design/Tech' },
              { name: 'Behance', type: 'Creative' },
              { name: 'Dribbble', type: 'Design' },
              { name: 'The Muse', type: 'General' },
              { name: 'SimplyHired', type: 'General' },
              { name: 'Snagajob', type: 'Hourly' },
              { name: 'Craigslist', type: 'Local' },
              { name: 'Idealist', type: 'Nonprofit' },
              { name: 'USAJobs', type: 'Government' },
              { name: 'AngelList Talent', type: 'Startups' },
              { name: 'Hired', type: 'Tech' },
              { name: 'Adzuna', type: 'General' },
              { name: 'JobisJob', type: 'General' },
              { name: 'Jooble', type: 'General' },
              { name: 'LinkUp', type: 'General' },
              { name: 'Jobrapido', type: 'General' },
              { name: 'Joblift', type: 'General' },
              { name: 'Neuvoo', type: 'General' },
              { name: 'Trovit', type: 'General' },
              { name: 'Jobijoba', type: 'General' },
              { name: 'Jobvertise', type: 'General' },
              { name: '+ 15 more', type: 'Various' }
            ].map((board, index) => (
              <div
                key={index}
                className="group bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-teal-600 hover:shadow-md transition-all duration-200 animate-fadeIn"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm group-hover:text-teal-600 transition-colors duration-200 mb-1">
                  {board.name}
                </div>
                <div className="text-xs text-slate-500">
                  {board.type}
                </div>
                </div>
              ))}
            </div>

          <div className="mt-10 text-center animate-fadeIn" style={{ animationDelay: '500ms' }}>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Stop wasting time switching between tabs. Search them all at once.
            </p>
            <Link
              to="/browse"
              className="inline-flex items-center text-teal-600 hover:text-teal-700 font-semibold transition-colors duration-200"
            >
              Try it now
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Companies Hiring - Clean Modern */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3 animate-fadeIn">
              Companies hiring now
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 animate-fadeIn" style={{ animationDelay: '100ms' }}>
              Browse opportunities from leading companies in tech, finance, and beyond
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {companies.map((company, index) => (
              <button
                key={index}
                onClick={() => navigate(`/browse?company=${company.name}`)}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-teal-600 rounded-lg p-6 transition-all duration-200 text-left animate-fadeIn hover:shadow-md"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <Building2 className="h-5 w-5 text-slate-400 group-hover:text-teal-600 transition-colors duration-200" />
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-teal-600 opacity-0 group-hover:opacity-100 transition-all duration-200" />
                </div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-1 group-hover:text-teal-600 transition-colors duration-200">
                  {company.name}
                </div>
                <div className="text-sm text-slate-500">
                  View open roles
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Step by Step */}
      <section className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3 animate-fadeIn">
              How JobHunter works
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 animate-fadeIn" style={{ animationDelay: '100ms' }}>
              Find your next job in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Search once',
                description: 'Enter your job title and location. Our AI instantly searches across 50+ job boards including Indeed, LinkedIn, Glassdoor, and more.',
                icon: Search
              },
              {
                step: '02',
                title: 'Get instant results',
                description: 'See all jobs in one clean interface with salaries, company ratings, and direct apply links. Filter by remote, salary, company size, and more.',
                icon: Zap
              },
              {
                step: '03',
                title: 'Apply faster',
                description: 'Click to apply directly on the job board of your choice. Save jobs you like and get alerts when new matches appear.',
                icon: Rocket
              }
            ].map((step, index) => {
              const Icon = step.icon
              return (
                <div 
                  key={index}
                  className="relative animate-fadeIn"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute -top-6 left-0 text-6xl font-bold text-teal-100">
                    {step.step}
                  </div>
                  <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 hover:border-teal-600 hover:shadow-lg transition-all duration-200">
                    <div className="inline-flex p-3 bg-teal-50 rounded-xl mb-4">
                      <Icon className="h-7 w-7 text-teal-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">{step.title}</h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Comparison - Before/After */}
      <section className="py-20 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3 animate-fadeIn">
              Stop wasting time on multiple job sites
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 animate-fadeIn" style={{ animationDelay: '100ms' }}>
              See why thousands switched to JobHunter
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Without JobHunter */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-8 animate-fadeIn">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <X className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Traditional job hunting</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Visit 10+ different job sites',
                  'Repeat the same search everywhere',
                  'Miss jobs posted on lesser-known boards',
                  'No salary information upfront',
                  'Spend 2-3 hours per search',
                  'Forget which jobs you already saw'
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                    <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* With JobHunter */}
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl border-2 border-teal-600 p-8 animate-fadeIn relative overflow-hidden" style={{ animationDelay: '100ms' }}>
              <div className="absolute top-4 right-4 px-3 py-1 bg-teal-600 text-white text-xs font-bold rounded-full">
                RECOMMENDED
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-full bg-teal-600 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">With JobHunter</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'One search across 50+ job boards',
                  'Instant results in seconds',
                  'Never miss a job opportunity',
                  'See salaries before you apply',
                  'Find jobs in under 5 minutes',
                  'Save and track all your favorites'
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-slate-900 dark:text-slate-100 font-medium">
                    <CheckCircle2 className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Premium Design */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3 animate-fadeIn">
              Loved by job seekers everywhere
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 animate-fadeIn" style={{ animationDelay: '100ms' }}>
              Join thousands who found their dream jobs faster
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 animate-fadeIn border border-slate-200 dark:border-slate-700"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>

                <p className="text-slate-700 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-full ${testimonial.color} flex items-center justify-center text-white font-bold shadow-md`}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{testimonial.name}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 pt-16 border-t border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: '4.9/5', label: 'Average rating' },
                { value: '50K+', label: 'Happy users' },
                { value: '1M+', label: 'Jobs found' },
                { value: '99%', label: 'Would recommend' }
              ].map((stat, index) => (
                <div key={index} className="animate-fadeIn" style={{ animationDelay: `${600 + index * 100}ms` }}>
                  <div className="text-3xl font-bold text-teal-600 mb-1">{stat.value}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3 animate-fadeIn">
              Frequently asked questions
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 animate-fadeIn" style={{ animationDelay: '100ms' }}>
              Everything you need to know about JobHunter
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Is JobHunter really free?',
                a: 'Yes! JobHunter is 100% free to use. You can search jobs, save favorites, and apply to as many positions as you want without ever paying a cent.'
              },
              {
                q: 'Which job boards do you search?',
                a: 'We search over 50 job boards including Indeed, LinkedIn, Glassdoor, ZipRecruiter, Monster, Dice, AngelList, Remote.co, and many more. See the full list above.'
              },
              {
                q: 'How is this different from using Google Jobs?',
                a: 'JobHunter searches more job boards, shows salary information upfront, lets you save and track jobs, and provides a cleaner interface designed specifically for job hunting.'
              },
              {
                q: 'Do I need to create an account?',
                a: 'You can search jobs without an account, but creating a free account lets you save jobs, get email alerts, and track your applications.'
              },
              {
                q: 'How up-to-date are the job listings?',
                a: 'We update our job listings every hour from all major job boards, so you\'re always seeing the latest opportunities.'
              },
              {
                q: 'Can I apply directly through JobHunter?',
                a: 'We show you all the details and provide direct links to apply on the original job board. This ensures you\'re applying through the official channels.'
              }
            ].map((faq, index) => (
              <details 
                key={index}
                className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:border-teal-600 transition-all duration-200 animate-fadeIn"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 pr-8">{faq.q}</h3>
                  <div className="flex-shrink-0">
                    <ArrowRight className="h-5 w-5 text-slate-400 group-open:rotate-90 transition-transform duration-200" />
                  </div>
                </summary>
                <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Modern & Bold */}
      <section className="relative py-24 bg-gradient-to-br from-teal-600 to-teal-800 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900/20 backdrop-blur-sm rounded-full mb-6 animate-fadeIn">
            <Rocket className="h-4 w-4 text-white" />
            <span className="text-sm font-medium text-white">Start your job search today</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 animate-fadeIn" style={{ animationDelay: '100ms' }}>
            Ready to find your dream job?
          </h2>
          <p className="text-xl text-teal-50 mb-10 max-w-2xl mx-auto animate-fadeIn" style={{ animationDelay: '200ms' }}>
            Join over 2 million job seekers using JobHunter to discover opportunities across 50+ job boards in one search
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fadeIn" style={{ animationDelay: '300ms' }}>
            <Link
              to="/browse"
              className="px-10 py-4 bg-white dark:bg-slate-900 text-teal-600 font-bold rounded-xl hover:bg-slate-50 dark:bg-slate-800 transition-all duration-200 hover:shadow-2xl hover:scale-105 active:scale-95 inline-flex items-center justify-center gap-2"
            >
              <Search className="h-5 w-5" />
              Start Searching
            </Link>
            {!user && (
              <Link
                to="/register"
                className="px-10 py-4 bg-teal-800 text-white font-bold rounded-xl hover:bg-teal-900 transition-all duration-200 hover:shadow-2xl hover:scale-105 active:scale-95 border-2 border-white/20"
              >
                Create Free Account
              </Link>
            )}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-teal-50 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>Always free to use</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Premium */}
      <footer className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
            {/* Company Info */}
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100">JobHunter</span>
              </Link>
              <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-sm">
                The smartest way to find jobs. Search 50+ job boards in one place and land your dream job faster.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {['bg-teal-600', 'bg-teal-700', 'bg-teal-600', 'bg-indigo-600'].map((color, i) => (
                    <div key={i} className={`h-8 w-8 rounded-full ${color} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-slate-900 dark:text-slate-100">50K+</span> users
                </p>
              </div>
            </div>

            {/* Job Seekers */}
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">For Job Seekers</h3>
              <ul className="space-y-3 text-sm">
                {[
                  { to: '/browse', label: 'Browse Jobs' },
                  { to: '/saved', label: 'Saved Jobs' },
                  { to: '/register', label: 'Create Account' },
                  { to: '/login', label: 'Sign In' }
                ].map((link, i) => (
                  <li key={i}>
                    <Link to={link.to} className="text-slate-600 dark:text-slate-300 hover:text-teal-600 transition-colors inline-flex items-center gap-2 group">
                      {link.label}
                      <ArrowRight className="h-3 w-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Resources</h3>
              <ul className="space-y-3 text-sm">
                {[
                  { label: 'How it Works', href: '#how-it-works' },
                  { label: 'Job Boards', href: '#job-boards' },
                  { label: 'FAQs', href: '#faq' },
                  { label: 'Blog', href: '#' }
                ].map((link, i) => (
                  <li key={i}>
                    <a href={link.href} className="text-slate-600 dark:text-slate-300 hover:text-teal-600 transition-colors inline-flex items-center gap-2 group">
                      {link.label}
                      <ArrowRight className="h-3 w-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Company</h3>
              <ul className="space-y-3 text-sm">
                {[
                  { label: 'About Us', href: '#' },
                  { label: 'Contact', href: '#' },
                  { label: 'Privacy', href: '#' },
                  { label: 'Terms', href: '#' }
                ].map((link, i) => (
                  <li key={i}>
                    <a href={link.href} className="text-slate-600 dark:text-slate-300 hover:text-teal-600 transition-colors inline-flex items-center gap-2 group">
                      {link.label}
                      <ArrowRight className="h-3 w-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              © {new Date().getFullYear()} JobHunter. All rights reserved.
            </p>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-teal-600" />
                <span className="text-slate-600 dark:text-slate-300">100% Secure</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-teal-600" />
                <span className="text-slate-600 dark:text-slate-300">Always Free</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                <span className="text-slate-600 dark:text-slate-300">Verified Jobs</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
