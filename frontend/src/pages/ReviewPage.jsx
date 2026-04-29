import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  AlertTriangle,
  Lightbulb,
  Activity,
  CheckCircle2,
  Loader2,
  Check,
  RotateCcw,
  Copy,
  Download,
  AlertCircle,
} from 'lucide-react'
import { DiffEditor } from '@monaco-editor/react'
import Header from '../components/Header'
import api from '../lib/api'

function ReviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [submission, setSubmission] = useState(null)
  const [review, setReview] = useState(null)
  const [parsedReview, setParsedReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Track which suggestions are applied (by index)
  const [appliedFixes, setAppliedFixes] = useState(new Set())
  // Toast/banner messages
  const [notice, setNotice] = useState('')

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const subRes = await api.get(`/api/submissions/${id}`)
      setSubmission(subRes.data)

      const reviewsRes = await api.get(`/api/reviews/submission/${id}`)
      const reviews = reviewsRes.data
      if (reviews.length > 0) {
        const latestReview = reviews[0]
        setReview(latestReview)
        try {
          setParsedReview(JSON.parse(latestReview.rawJson))
        } catch (e) {
          console.error('Failed to parse review JSON', e)
        }
      }
    } catch (err) {
      setError('Failed to load review')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Compute the fixed code by applying all selected suggestions in order
  const fixedCode = useMemo(() => {
    if (!submission || !parsedReview) return ''
    let code = submission.code

    parsedReview.suggestions?.forEach((sug, idx) => {
      if (appliedFixes.has(idx) && sug.current && sug.suggested) {
        if (code.includes(sug.current)) {
          code = code.replace(sug.current, sug.suggested)
        }
      }
    })

    return code
  }, [submission, parsedReview, appliedFixes])

  const toggleFix = (idx) => {
    const sug = parsedReview.suggestions[idx]
    const isApplied = appliedFixes.has(idx)

    if (!isApplied) {
      if (!sug.current || !sug.suggested) {
        showNotice("This suggestion doesn't have an exact code replacement.")
        return
      }
      if (!submission.code.includes(sug.current)) {
        showNotice(
          "Couldn't apply automatically — Gemini's snippet doesn't exactly match the original. You can copy the suggested code manually."
        )
        return
      }
    }

    setAppliedFixes((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const showNotice = (msg) => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 4000)
  }

  const copyFixedCode = async () => {
    try {
      await navigator.clipboard.writeText(fixedCode)
      showNotice('✓ Fixed code copied to clipboard')
    } catch (err) {
      showNotice('Failed to copy')
    }
  }

  const downloadFixedCode = () => {
    const ext = getFileExtension(submission.language)
    const filename = `fixed-${submission.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${ext}`
    const blob = new Blob([fixedCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const getFileExtension = (lang) => {
    const map = {
      java: 'java',
      python: 'py',
      javascript: 'js',
      typescript: 'ts',
      c: 'c',
      cpp: 'cpp',
      csharp: 'cs',
      go: 'go',
      rust: 'rs',
    }
    return map[lang] || 'txt'
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

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
    if (score >= 60) return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
    if (score >= 40) return 'text-orange-400 border-orange-500/30 bg-orange-500/10'
    return 'text-red-400 border-red-500/30 bg-red-500/10'
  }

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-300 border-red-500/40'
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40'
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
      case 'LOW':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40'
      default:
        return 'bg-zinc-700 text-zinc-300 border-zinc-600'
    }
  }

  const getSuggestionStyle = (type) => {
    switch (type) {
      case 'PERFORMANCE':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40'
      case 'REFACTOR':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
      case 'READABILITY':
        return 'bg-pink-500/20 text-pink-300 border-pink-500/40'
      default:
        return 'bg-zinc-700 text-zinc-300 border-zinc-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white animate-fade-in">
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-20 text-center">
          <Loader2 size={32} className="animate-spin mx-auto text-emerald-400 mb-4" />
          <p className="text-zinc-400">Loading review...</p>
        </main>
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white animate-fade-in">
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-xl p-6">
            {error || 'Submission not found'}
          </div>
        </main>
      </div>
    )
  }

  const hasAppliedFixes = appliedFixes.size > 0

  return (
    <div className="min-h-screen bg-zinc-950 text-white animate-fade-in">
      <Header />

      {/* Floating notice */}
      {notice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm shadow-lg z-50 animate-slide-in-top">
          {notice}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-6 transition"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{submission.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
            <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono uppercase text-xs">
              {submission.language}
            </span>
            <span>{formatDate(submission.createdAt)}</span>
          </div>
        </div>

        {!review && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <Loader2 size={32} className="mx-auto text-zinc-600 mb-3" />
            <p className="text-zinc-400 mb-1">No AI review for this submission</p>
            <p className="text-zinc-500 text-sm">
              This submission was created without triggering a review (e.g. via API directly).
            </p>
          </div>
        )}

        {review && !parsedReview && (
          <div className="bg-yellow-900/30 border border-yellow-800 text-yellow-400 rounded-xl p-6 mb-6">
            The review was generated but couldn't be parsed. Raw response below.
            <pre className="mt-4 text-xs whitespace-pre-wrap text-zinc-400">
              {review.rawJson}
            </pre>
          </div>
        )}

        {parsedReview && (
          <div className="space-y-6">
            {/* Score + Summary */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
                <div
                  className={`flex flex-col items-center justify-center w-28 h-28 rounded-full border-2 ${getScoreColor(
                    parsedReview.overall_score
                  )} flex-shrink-0 animate-scale-in`}
                >
                  <span className="text-3xl font-bold">{parsedReview.overall_score}</span>
                  <span className="text-xs uppercase tracking-wider opacity-70">Score</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold mb-2">Summary</h2>
                  <p className="text-zinc-300 leading-relaxed">{parsedReview.summary}</p>
                </div>
              </div>
            </div>

            {/* Bugs */}
            {parsedReview.bugs && parsedReview.bugs.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 animate-slide-up stagger-1">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={20} className="text-red-400" />
                  <h2 className="text-lg font-semibold">
                    Bugs Found ({parsedReview.bugs.length})
                  </h2>
                </div>
                <div className="space-y-4">
                  {parsedReview.bugs.map((bug, idx) => (
                    <div key={idx} className="border border-zinc-800 rounded-lg p-4 bg-zinc-950/50">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded border font-mono ${getSeverityStyle(bug.severity)}`}>
                          {bug.severity}
                        </span>
                        {bug.line != null && (
                          <span className="text-xs text-zinc-500 font-mono">Line {bug.line}</span>
                        )}
                      </div>
                      <p className="text-zinc-200 mb-2">{bug.issue}</p>
                      <p className="text-sm text-zinc-400">
                        <span className="text-emerald-400 font-medium">Fix: </span>
                        {bug.fix}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions with Apply/Revert */}
            {parsedReview.suggestions && parsedReview.suggestions.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 animate-slide-up stagger-2">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb size={20} className="text-cyan-400" />
                  <h2 className="text-lg font-semibold">
                    Suggestions ({parsedReview.suggestions.length})
                  </h2>
                  {hasAppliedFixes && (
                    <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full px-2 py-0.5">
                      {appliedFixes.size} applied
                    </span>
                  )}
                </div>
                <div className="space-y-4">
                  {parsedReview.suggestions.map((sug, idx) => {
                    const isApplied = appliedFixes.has(idx)
                    const canApply = sug.current && sug.suggested && submission.code.includes(sug.current)

                    return (
                      <div
                        key={idx}
                        className={`border rounded-lg p-4 transition ${
                          isApplied
                            ? 'border-emerald-500/40 bg-emerald-500/5'
                            : 'border-zinc-800 bg-zinc-950/50'
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded border font-mono ${getSuggestionStyle(sug.type)}`}>
                            {sug.type}
                          </span>
                          {sug.line != null && (
                            <span className="text-xs text-zinc-500 font-mono">Line {sug.line}</span>
                          )}
                          {isApplied && (
                            <span className="text-xs px-2 py-0.5 rounded border bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-mono flex items-center gap-1">
                              <Check size={12} /> APPLIED
                            </span>
                          )}
                          {!canApply && !isApplied && (
                            <span className="text-xs px-2 py-0.5 rounded border bg-zinc-800 text-zinc-400 border-zinc-700 font-mono flex items-center gap-1">
                              <AlertCircle size={12} /> manual
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-300 mb-3">{sug.reason}</p>
                        {sug.current && (
                          <div className="mb-2">
                            <p className="text-xs text-zinc-500 mb-1">Current</p>
                            <pre className="text-xs bg-zinc-950 border border-zinc-800 rounded p-3 overflow-x-auto text-red-300/80 font-mono whitespace-pre-wrap">
                              {sug.current}
                            </pre>
                          </div>
                        )}
                        {sug.suggested && (
                          <div className="mb-3">
                            <p className="text-xs text-zinc-500 mb-1">Suggested</p>
                            <pre className="text-xs bg-zinc-950 border border-zinc-800 rounded p-3 overflow-x-auto text-emerald-300/80 font-mono whitespace-pre-wrap">
                              {sug.suggested}
                            </pre>
                          </div>
                        )}
                        <button
                          onClick={() => toggleFix(idx)}
                          disabled={!isApplied && !canApply}
                          className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg font-medium transition ${
                            isApplied
                              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                              : canApply
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-zinc-950'
                              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                          }`}
                        >
                          {isApplied ? (
                            <>
                              <RotateCcw size={14} /> Revert
                            </>
                          ) : (
                            <>
                              <Check size={14} /> Apply Fix
                            </>
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Complexity */}
            {parsedReview.complexity && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 animate-slide-up stagger-3">
                <div className="flex items-center gap-2 mb-4">
                  <Activity size={20} className="text-purple-400" />
                  <h2 className="text-lg font-semibold">Complexity Analysis</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4">
                    <p className="text-xs text-zinc-500 mb-1">Time</p>
                    <p className="font-mono text-emerald-300">{parsedReview.complexity.time}</p>
                  </div>
                  <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4">
                    <p className="text-xs text-zinc-500 mb-1">Space</p>
                    <p className="font-mono text-emerald-300">{parsedReview.complexity.space}</p>
                  </div>
                </div>
                {parsedReview.complexity.explanation && (
                  <p className="text-sm text-zinc-400">{parsedReview.complexity.explanation}</p>
                )}
              </div>
            )}

            {/* Best practices */}
            {parsedReview.best_practices && parsedReview.best_practices.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 animate-slide-up stagger-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 size={20} className="text-emerald-400" />
                  <h2 className="text-lg font-semibold">Best Practices</h2>
                </div>
                <ul className="space-y-2">
                  {parsedReview.best_practices.map((bp, idx) => (
                    <li key={idx} className="flex gap-3 text-zinc-300 text-sm">
                      <span className="text-emerald-400 mt-1">•</span>
                      <span>{bp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Side-by-side diff */}
        {review && (
          <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden animate-slide-up stagger-5">
            <div className="px-6 py-3 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Code Comparison</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {hasAppliedFixes
                    ? `${appliedFixes.size} fix${appliedFixes.size > 1 ? 'es' : ''} applied`
                    : 'Apply suggestions above to see changes'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyFixedCode}
                  disabled={!hasAppliedFixes}
                  className="flex items-center gap-2 text-sm bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:cursor-not-allowed text-zinc-300 px-3 py-1.5 rounded-lg transition"
                >
                  <Copy size={14} /> Copy
                </button>
                <button
                  onClick={downloadFixedCode}
                  disabled={!hasAppliedFixes}
                  className="flex items-center gap-2 text-sm bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-zinc-950 font-medium px-3 py-1.5 rounded-lg transition"
                >
                  <Download size={14} /> Download
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 text-xs px-6 py-2 bg-zinc-950/50 border-b border-zinc-800 font-mono uppercase tracking-wider text-zinc-500">
              <div>Original</div>
              <div>Fixed</div>
            </div>
            <DiffEditor
              height="500px"
              language={submission.language}
              original={submission.code}
              modified={fixedCode}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: 'on',
                renderSideBySide: true,
              }}
            />
          </div>
        )}
      </main>
    </div>
  )
}

export default ReviewPage