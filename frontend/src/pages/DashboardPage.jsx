import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FileCode, Calendar, Search, X, Filter } from 'lucide-react'
import Header from '../components/Header'
import api from '../lib/api'

function DashboardPage() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('all')

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    try {
      const response = await api.get('/api/submissions')
      setSubmissions(response.data)
    } catch (err) {
      setError('Failed to load submissions')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Get unique languages from existing submissions for the filter dropdown
  const availableLanguages = useMemo(() => {
    const langs = new Set(submissions.map((s) => s.language))
    return Array.from(langs).sort()
  }, [submissions])

  // Filtered submissions: applies search + language filter
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const matchesSearch = submission.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase().trim())
      const matchesLanguage =
        selectedLanguage === 'all' || submission.language === selectedLanguage
      return matchesSearch && matchesLanguage
    })
  }, [submissions, searchQuery, selectedLanguage])

  const hasActiveFilters = searchQuery.trim() !== '' || selectedLanguage !== 'all'

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedLanguage('all')
  }

  const formatDate = (isoString) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Your Submissions</h1>
            <p className="text-zinc-400 text-sm">
              Review your past code reviews and submit new ones
            </p>
          </div>
          <Link
            to="/new"
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold px-4 py-2.5 rounded-lg transition whitespace-nowrap"
          >
            <Plus size={18} />
            <span>New Submission</span>
          </Link>
        </div>

        {/* Search + Filter bar — only shows when there are submissions */}
        {!loading && !error && submissions.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-10 pr-10 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition"
                    tabIndex={-1}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Language filter */}
              <div className="relative sm:w-52">
                <Filter
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                />
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-10 pr-3 py-2 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition appearance-none cursor-pointer"
                >
                  <option value="all">All Languages</option>
                  {availableLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active filter info */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
                <p className="text-xs text-zinc-400">
                  Showing{' '}
                  <span className="text-emerald-400 font-semibold">
                    {filteredSubmissions.length}
                  </span>{' '}
                  of {submissions.length} submissions
                </p>
                <button
                  onClick={clearFilters}
                  className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1"
                >
                  <X size={12} /> Clear filters
                </button>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <p className="text-zinc-400">Loading...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-xl p-6">
            {error}
          </div>
        )}

        {/* Empty state — no submissions at all */}
        {!loading && !error && submissions.length === 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <FileCode size={48} className="mx-auto text-zinc-600 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No submissions yet</h3>
            <p className="text-zinc-400 text-sm mb-6">
              Submit your first piece of code to get an AI-powered review
            </p>
            <Link
              to="/new"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold px-4 py-2.5 rounded-lg transition"
            >
              <Plus size={18} />
              <span>Create your first submission</span>
            </Link>
          </div>
        )}

        {/* Empty state — filters returned nothing */}
        {!loading &&
          submissions.length > 0 &&
          filteredSubmissions.length === 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
              <Search size={48} className="mx-auto text-zinc-600 mb-4" />
              <h3 className="text-lg font-semibold mb-1">No matches found</h3>
              <p className="text-zinc-400 text-sm mb-6">
                Try a different search term or language
              </p>
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium px-4 py-2 rounded-lg transition"
              >
                <X size={16} /> Clear filters
              </button>
            </div>
          )}

        {/* Submissions list */}
        {!loading && filteredSubmissions.length > 0 && (
          <div className="grid gap-3">
            {filteredSubmissions.map((submission) => (
              <Link
                key={submission.id}
                to={`/review/${submission.id}`}
                className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800/50 rounded-xl p-5 transition group"
              >
                <h3 className="text-lg font-semibold mb-2 group-hover:text-emerald-400 transition truncate">
                  {submission.title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500">
                  <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono uppercase">
                    {submission.language}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(submission.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default DashboardPage