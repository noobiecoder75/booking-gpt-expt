'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Loader2, Mail, Copy, Check } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface InviteTeamMemberFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function InviteTeamMemberForm({ onClose, onSuccess }: InviteTeamMemberFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'agent' | 'client'>('agent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const supabase = getSupabaseBrowserClient();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate email
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // For now, generate a simple invite link
      // In production, you'd create an invite token in the database
      const inviteToken = btoa(`${email}:${role}:${Date.now()}`);
      const link = `${window.location.origin}/auth/invite?token=${inviteToken}`;

      setInviteLink(link);

      // TODO: Send email with invite link
      // This would require a backend endpoint or Supabase Edge Function
      console.log('Invite link generated:', link);
      console.log('Email:', email, 'Role:', role);
    } catch (err: any) {
      console.error('Failed to send invite:', err);
      setError(err.message || 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Invite Team Member</h2>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleInvite} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Invite Link Display */}
          {inviteLink && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-3">
              <div className="flex items-start">
                <Mail className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Invite Link Generated</p>
                  <p className="text-sm text-green-600 mt-1">
                    Share this link with {email} to join your team.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="text-sm font-mono bg-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-600">
                Note: In production, this would be sent via email automatically.
              </p>
            </div>
          )}

          {!inviteLink && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="teammate@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'agent' | 'client')}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="agent">Agent - Can manage their own contacts</option>
                  <option value="admin">Admin - Full access to everything</option>
                  <option value="client">Client - Limited read-only access</option>
                </select>
                <p className="text-xs text-gray-600">
                  You can change this later from the team management page.
                </p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {inviteLink ? 'Close' : 'Cancel'}
            </Button>
            {!inviteLink && (
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Invite Link'
                )}
              </Button>
            )}
            {inviteLink && (
              <Button
                type="button"
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
              >
                Done
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
