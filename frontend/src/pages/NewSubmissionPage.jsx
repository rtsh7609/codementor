import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import Editor from '@monaco-editor/react'
import Header from '../components/Header'
import api from '../lib/api'

const LANGUAGES = [
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
]

const DEFAULT_CODE = {
  java: '// Paste your Java code here\npublic class Example {\n    public static void main(String[] args) {\n        System.out.println("Hello!");\n    }\n}',
  python: '# Paste your Python code here\ndef hello():\n    print("Hello!")',
  javascript: '// Paste your JavaScript code here\nfunction hello() {\n    console.log("Hello!");\n}',
  typescript: '// Paste your TypeScript code here\nfunction hello(): void {\n    console.log("Hello!");\n}',
  c: '// Paste your C code here\n#include <stdio.h>\nint main() {\n    printf("Hello!\\n");\n    return 0;\n}',
  cpp: '// Paste your C++ code here\n#include <iostream>\nint main() {\n    std::cout << "Hello!" << std::endl;\n    return 0;\n}',
  csharp: '// Paste your C# code here\npublic class Hello {\n    public static void Main() {\n        System.Console.WriteLine("Hello!");\n    }\n}',
  go: '// Paste your Go code here\npackage main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello!")\n}',
  rust: '// Paste your Rust code here\nfn main() {\n    println!("Hello!");\n}',
}

function NewSubmissionPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState('java')
  const [code, setCode] = useState(DEFAULT_CODE.java)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang)
    // Replace boilerplate only if user hasn't customized it much
    if (Object.values(DEFAULT_CODE).includes(code)) {
      setCode(DEFAULT_CODE[newLang])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!code.trim()) {
      setError('Code is required')
      return
    }

    setLoading(true)
    try {
      // 1. Save the submission
      const submitRes = await api.post('/api/submissions', {
        title: title.trim(),
        language,
        code,
      })
      const submissionId = submitRes.data.id

      // 2. Trigger the AI review (this can take 5-15 seconds)
      await api.post(`/api/reviews/submission/${submissionId}`)

      // 3. Navigate to the review page
      navigate(`/review/${submissionId}`)
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        'Failed to submit. Please try again.'
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Back link */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-6 transition"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </button>

        <h1 className="text-3xl font-bold mb-1">New Submission</h1>
        <p className="text-zinc-400 text-sm mb-8">
          Paste your code and our AI will review it for bugs, performance, and best practices.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title input */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              placeholder="e.g., User authentication service"
            />
          </div>

          {/* Language dropdown */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full sm:w-64 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Monaco Editor */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Code
            </label>
            <div className="border border-zinc-700 rounded-lg overflow-hidden">
              <Editor
                height="450px"
                language={language}
                value={code}
                onChange={(newValue) => setCode(newValue || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  wordWrap: 'on',
                }}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          {/* Submit button */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
            <p className="text-xs text-zinc-500">
              {loading
                ? 'Sending your code to Gemini... this can take up to 15 seconds.'
                : 'You\'ll be redirected to the review page after submitting.'}
            </p>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-zinc-950 font-semibold px-6 py-2.5 rounded-lg transition"
            >
              <Sparkles size={18} />
              {loading ? 'Reviewing...' : 'Get AI Review'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default NewSubmissionPage