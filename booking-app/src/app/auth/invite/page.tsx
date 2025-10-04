'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function InvitePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [token, setToken] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'agent' | 'client'>('agent');
  const [tokenValid, setTokenValid] = useState(false);

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const inviteToken = searchParams.get('token');
    if (inviteToken) {
      try {
        // Decode the invite token
        const decoded = atob(inviteToken);
        const [email, role, timestamp] = decoded.split(':');

        // Check if token is still valid (24 hours)
        const tokenTime = parseInt(timestamp);
        const now = Date.now();
        const hoursSinceCreation = (now - tokenTime) / (1000 * 60 * 60);

        if (hoursSinceCreation > 24) {
          setError('This invite link has expired. Please request a new one.');
          return;
        }

        setToken(inviteToken);
        setInviteEmail(email);
        setInviteRole(role as 'admin' | 'agent' | 'client');
        setTokenValid(true);
      } catch (err) {
        setError('Invalid invite link. Please check the URL and try again.');
      }
    } else {
      setError('No invite token found. Please use the invite link provided.');
    }
  }, [searchParams]);

  const handleAcceptInvite = async (e: React.FormEvent) => {
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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: inviteEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            invited_role: inviteRole, // Will be picked up by the trigger
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // Update user role to match invite
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: inviteRole })
          .eq('id', data.user.id);

        if (updateError) {
          console.error('Failed to set role:', updateError);
          // Don't fail the whole flow, role can be updated later
        }

        setSuccess(true);
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred while accepting the invite');
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid && error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Invalid Invite</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
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

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <UserPlus className="w-12 h-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Welcome to the Team!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              Your account has been created successfully. Please check your email at{' '}
              <strong>{inviteEmail}</strong> to verify your account.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/auth/login" className="w-full">
              <Button className="w-full">
                Continue to Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Accept Team Invite</CardTitle>
          <CardDescription className="text-center">
            You've been invited to join as {inviteRole}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleAcceptInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={inviteEmail}
                disabled
                className="bg-gray-100"
              />
            </div>

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
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Accept Invite & Create Account'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-center text-sm text-gray-600 w-full">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <InvitePageContent />
    </Suspense>
  );
}
