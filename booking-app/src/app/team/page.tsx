'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRole } from '@/hooks/useRole';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Database } from '@/types/database-contacts';
import { InviteTeamMemberForm } from '@/components/team/InviteForm';
import { Users, UserPlus, Shield, Briefcase, User as UserIcon, Loader2, AlertCircle } from 'lucide-react';

type User = Database['public']['Tables']['users']['Row'];

export default function TeamPage() {
  const { role, isAdmin, loading: roleLoading } = useRole();
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);

  const supabase = getSupabaseBrowserClient();

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setTeamMembers(data || []);
    } catch (err: any) {
      console.error('Failed to fetch team members:', err);
      setError(err.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!roleLoading && isAdmin) {
      fetchTeamMembers();
    } else if (!roleLoading && !isAdmin) {
      setLoading(false);
    }
  }, [roleLoading, isAdmin]);

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'agent' | 'client') => {
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Refresh team members
      await fetchTeamMembers();
    } catch (err: any) {
      console.error('Failed to update role:', err);
      alert(`Failed to update role: ${err.message}`);
    }
  };

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      case 'agent':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Briefcase className="w-3 h-3 mr-1" />
            Agent
          </Badge>
        );
      case 'client':
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <UserIcon className="w-3 h-3 mr-1" />
            Client
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (roleLoading || loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You must be an admin to view this page.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
            <p className="text-gray-600 mt-2">
              Manage your team members and their permissions
            </p>
          </div>

          <Button
            className="mt-4 md:mt-0"
            onClick={() => setShowInviteForm(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Team Member
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Failed to load team members</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => fetchTeamMembers()}
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamMembers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Shield className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teamMembers.filter((m) => m.role === 'admin').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agents</CardTitle>
              <Briefcase className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teamMembers.filter((m) => m.role === 'agent').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members List */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members ({teamMembers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No team members</h3>
                <p className="text-gray-600">Start by inviting your first team member.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {member.full_name?.[0] || member.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {member.full_name || 'No Name'}
                        </div>
                        <div className="text-sm text-gray-600">{member.email}</div>
                        {member.company_name && (
                          <div className="text-sm text-gray-500">{member.company_name}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getRoleBadge(member.role)}

                      {/* Role Selector */}
                      <select
                        value={member.role || 'agent'}
                        onChange={(e) =>
                          handleUpdateRole(member.id, e.target.value as 'admin' | 'agent' | 'client')
                        }
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="admin">Admin</option>
                        <option value="agent">Agent</option>
                        <option value="client">Client</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invite Form Modal */}
        {showInviteForm && (
          <InviteTeamMemberForm
            onClose={() => setShowInviteForm(false)}
            onSuccess={() => {
              setShowInviteForm(false);
              fetchTeamMembers();
            }}
          />
        )}
      </div>
    </MainLayout>
  );
}
