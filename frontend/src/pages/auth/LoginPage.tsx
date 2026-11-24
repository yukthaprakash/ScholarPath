import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Eye, EyeOff, LogIn, Sparkles, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loginAsDemoUser, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/home';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed. Please verify your credentials.');
      }
    }
  };

  const handleDemoSignIn = () => {
    loginAsDemoUser();
    navigate('/home');
  };

  return (
    <div className="max-w-md mx-auto py-6 sm:py-10 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-ink text-paper flex items-center justify-center mx-auto shadow-subtle">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6"
          >
            <path d="M4 18 L9 10 L14 15 L20 6" />
            <circle cx="20" cy="6" r="2" fill="#D9A441" stroke="none" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-ink font-serif tracking-tight">
          Sign In to ScholarPath
        </h1>
        <p className="text-xs text-muted max-w-xs mx-auto">
          Access your verified eligibility DNA, receipts, and deadline planner.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Student Login</CardTitle>
          <CardDescription>Enter your email and password to access your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md mb-4 flex items-center gap-2">
              <span className="font-bold">•</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. vraj@scholarpath.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <div className="space-y-1">
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[34px] text-muted hover:text-ink transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex justify-end pt-1">
                <Link
                  to="/forgot-password"
                  className="text-xs text-muted hover:text-ink underline decoration-dotted transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              variant="primary"
              size="lg"
              isLoading={isLoading}
              leftIcon={<LogIn className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Mode Login Option */}
          <div className="mt-6 pt-5 border-t border-line text-center space-y-3">
            <span className="text-xs text-muted font-medium">Or explore instantly in Demo Mode:</span>
            <Button
              type="button"
              fullWidth
              variant="gold"
              size="md"
              onClick={handleDemoSignIn}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              One-Click Demo Student Sign In
            </Button>
            <div className="flex items-center justify-center gap-1 text-[11px] text-muted">
              <ShieldCheck className="w-3.5 h-3.5 text-green" />
              <span>Uses verified local criteria (Academic Year 2026–27)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-muted">
        Don&apos;t have a ScholarPath account?{' '}
        <Link to="/register" className="font-bold text-ink hover:underline">
          Create an Account
        </Link>
      </div>
    </div>
  );
};
