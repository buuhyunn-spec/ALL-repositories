import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { Button } from '../components/ui/Button';

/**
 * Auth stub — page is fully designed, logic wires in when auth lands.
 */
export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: call useAuth().login(email, password)
    alert('Auth not implemented yet. Check back soon!');
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#1B6547] flex items-center justify-center mx-auto mb-3">
            <CalendarDays size={22} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to manage your bookings</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B6547] focus:border-transparent"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <button type="button" className="text-xs text-[#1B6547] hover:underline">
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B6547] focus:border-transparent"
            />
          </div>

          <Button type="submit" fullWidth size="lg">
            Sign in
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative text-center">
            <span className="bg-white px-3 text-xs text-gray-400">or continue with</span>
          </div>
        </div>

        {/* OAuth stubs */}
        <div className="space-y-2">
          {['Google', 'Apple'].map((provider) => (
            <button
              key={provider}
              type="button"
              onClick={() => alert(`${provider} OAuth coming soon`)}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Continue with {provider}
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#1B6547] font-medium hover:underline">
            Sign up
          </Link>
        </p>

        <div className="mt-6 text-center">
          <div className="inline-block bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-1.5 rounded-full">
            ⚠️ Auth is a stub — no real login yet
          </div>
        </div>
      </div>
    </div>
  );
}
