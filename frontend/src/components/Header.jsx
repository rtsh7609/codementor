import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Code2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function Header() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition">
          <Code2 size={24} />
          <span className="text-xl font-bold">CodeMentor</span>
        </Link>

        {/* User info + logout */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400 hidden sm:inline">
            {user?.name}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition text-sm"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header