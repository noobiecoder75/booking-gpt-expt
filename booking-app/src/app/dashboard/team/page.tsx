'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
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
          <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 border-none shadow-none text-[10px] font-bold uppercase tracking-tight">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      case 'agent':
        return (
          <Badge className="bg-clio-blue/10 dark:bg-clio-blue/20 text-clio-blue border-none shadow-none text-[10px] font-bold uppercase tracking-tight">
            <Briefcase className="w-3 h-3 mr-1" />
            Agent
          </Badge>
        );
      case 'client':
        return (
          <Badge className="bg-clio-gray-100 dark:bg-clio-gray-800 text-clio-gray-600 dark:text-clio-gray-400 border-none shadow-none text-[10px] font-bold uppercase tracking-tight">
            <UserIcon className="w-3 h-3 mr-1" />
            Client
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tight">Unknown</Badge>;
    }
  };

  if (roleLoading || loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-12 h-12 animate-spin text-clio-blue" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-clio-gray-900 rounded-2xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-sm">
            <AlertCircle className="w-16 h-16 text-red-600 dark:text-red-400 mb-6" />
            <h2 className="text-3xl font-bold text-clio-gray-900 dark:text-white mb-2 uppercase tracking-tight">Access Denied</h2>
            <p className="text-clio-gray-600 dark:text-clio-gray-400 font-medium">You must be an admin to view this page.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">Team Management</h1>
            <p className="text-clio-gray-600 dark:text-clio-gray-400 font-medium mt-2">
              Manage your team members and their permissions
            </p>
          </div>

          <Button
            className="mt-4 md:mt-0 font-bold uppercase tracking-tight"
            onClick={() => setShowInviteForm(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Team Member
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-6 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-start">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 mr-4 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-red-900 dark:text-red-400 uppercase tracking-tight">Failed to load team members</h3>
              <p className="text-sm font-medium text-red-700 dark:text-red-400/80 mt-1">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-900 dark:text-red-400 font-bold"
                onClick={() => fetchTeamMembers()}
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400">Total Members</CardTitle>
              <Users className="h-4 w-4 text-clio-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-clio-gray-900 dark:text-white">{teamMembers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400">Admins</CardTitle>
              <Shield className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-clio-gray-900 dark:text-white">
                {teamMembers.filter((m) => m.role === 'admin').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400">Agents</CardTitle>
              <Briefcase className="h-4 w-4 text-clio-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-clio-gray-900 dark:text-white">
                {teamMembers.filter((m) => m.role === 'agent').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">Team Members ({teamMembers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-clio-gray-50 dark:bg-clio-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-clio-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-clio-gray-900 dark:text-white mb-2 uppercase tracking-tight">No team members</h3>
                <p className="text-sm font-medium text-clio-gray-500 dark:text-clio-gray-400">Start by inviting your first team member.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-clio-gray-50/50 dark:bg-clio-gray-900/50 border border-clio-gray-100 dark:border-clio-gray-800 rounded-2xl hover:border-clio-blue dark:hover:border-clio-blue/50 transition-all group"
                  >
                    <div className="flex items-center space-x-5 mb-4 sm:mb-0">
                      <div className="w-14 h-14 bg-clio-blue rounded-full flex items-center justify-center text-white text-xl font-black uppercase shadow-lg shadow-clio-blue/20">
                        {member.full_name?.[0] || member.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-lg font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight group-hover:text-clio-blue transition-colors">
                          {member.full_name || 'No Name'}
                        </div>
                        <div className="text-sm font-medium text-clio-gray-500 dark:text-clio-gray-400">{member.email}</div>
                        {member.company_name && (
                          <div className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 mt-1">{member.company_name}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="flex-shrink-0">
                        {getRoleBadge(member.role)}
                      </div>

                      {/* Role Selector */}
                      <select
                        value={member.role || 'agent'}
                        onChange={(e) =>
                          handleUpdateRole(member.id, e.target.value as 'admin' | 'agent' | 'client')
                        }
                        className="h-10 px-4 bg-white dark:bg-clio-gray-950 border border-clio-gray-200 dark:border-clio-gray-800 text-clio-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all font-bold uppercase tracking-tight text-xs flex-1 sm:flex-none min-w-[120px]"
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
    </ProtectedRoute>
  );
}
