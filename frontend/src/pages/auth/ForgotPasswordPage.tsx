import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      setSubmitted(true);
    }
  };

  return (
    <div className="max-w-md mx-auto py-6 sm:py-10 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-extrabold text-ink font-serif tracking-tight">
          Reset Your Password
        </h1>
        <p className="text-xs text-muted max-w-xs mx-auto">
          We&apos;ll send password reset instructions to your registered student email address.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Recovery</CardTitle>
          <CardDescription>Enter the email associated with your ScholarPath account.</CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-surface text-green flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-ink">Reset Link Dispatched</h3>
              <p className="text-xs text-muted leading-relaxed max-w-xs mx-auto">
                If an account exists for <strong className="text-ink">{email}</strong>, you will receive an email with instructions shortly.
              </p>
              <Link to="/login">
                <Button variant="outline" size="md" className="mt-2" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Registered Email Address"
                type="email"
                placeholder="e.g. vraj@scholarpath.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button type="submit" fullWidth variant="primary" size="lg" leftIcon={<Mail className="w-4 h-4" />}>
                Send Password Reset Email
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-muted hover:text-ink inline-flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
