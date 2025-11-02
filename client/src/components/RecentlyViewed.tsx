import { Clock, X, Building2, MapPin, Briefcase, ExternalLink } from 'lucide-react'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'

export function RecentlyViewed() {
  const { recentJobs, removeRecentJob, clearRecentJobs } = useRecentlyViewed()

  if (recentJobs.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded-lg">
            <Clock className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Recently Viewed</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{recentJobs.length} job{recentJobs.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={clearRecentJobs}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-medium transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {recentJobs.map((job) => (
          <div
            key={job.id}
            className="group bg-white dark:bg-slate-800 rounded-xl p-5 hover:shadow-lg transition-all duration-200 border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 flex flex-col"
          >
            {/* Header - Company Logo & Remove Button */}
            <div className="flex items-start justify-between mb-4">
              <div className="h-12 w-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="h-6 w-6 text-slate-600 dark:text-slate-300" />
              </div>

              <button
                onClick={() => removeRecentJob(job.id)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                title="Remove from recently viewed"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            {/* Job Title */}
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1 line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              {job.title}
            </h3>

            {/* Company Name */}
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{job.company}</p>

            {/* Location & Type */}
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4">
              {job.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{job.location}</span>
                </div>
              )}
              {job.type && (
                <>
                  {job.location && <span>•</span>}
                  <span>{job.type}</span>
                </>
              )}
            </div>

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
        ))}
      </div>
    </div>
  )
}

