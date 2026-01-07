'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company_name: companyName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      if (data.user) {
        // User profile is automatically created by database trigger
        setSuccess(true);
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignUp = async (provider: 'google' | 'github') => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message || `Failed to sign up with ${provider}`);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-clio-gray-50 dark:bg-clio-gray-950">
        <Card className="w-full max-w-md bg-white dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center uppercase tracking-tight">Check Your Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-clio-gray-600 dark:text-clio-gray-400 font-medium">
              We've sent you a confirmation email to <strong className="text-clio-gray-900 dark:text-white">{email}</strong>.
              Please click the link in the email to verify your account.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/auth/login" className="w-full">
              <Button className="w-full" variant="outline">
                Back to Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-clio-gray-50 dark:bg-clio-gray-950 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center uppercase tracking-tight">Create Account</CardTitle>
          <CardDescription className="text-center text-clio-gray-500 dark:text-clio-gray-400">
            Create your workspace as the admin
          </CardDescription>
          <div className="mt-3 p-3 bg-clio-blue/10 border border-clio-blue/20 rounded-xl">
            <p className="text-sm text-clio-blue font-bold">
              First user? <span className="font-normal opacity-90">You'll become the admin automatically.</span>
            </p>
            <p className="text-xs text-clio-blue/70 mt-1">
              Already have a workspace? Ask your admin for an invite link.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company</Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="ACME Inc."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-clio-blue hover:bg-clio-blue-hover text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-clio-gray-100 dark:border-clio-gray-800" />
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
              <span className="bg-white dark:bg-clio-gray-900 px-3 text-clio-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => handleOAuthSignUp('google')}
              disabled={loading}
              className="border-clio-gray-200 dark:border-clio-gray-700"
            >
              Google
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOAuthSignUp('github')}
              disabled={loading}
              className="border-clio-gray-200 dark:border-clio-gray-700"
            >
              GitHub
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-center text-sm text-clio-gray-600 dark:text-clio-gray-400 w-full font-medium">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-clio-blue hover:underline font-bold">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}