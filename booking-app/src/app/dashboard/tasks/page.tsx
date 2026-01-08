'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTasksQuery } from '@/hooks/queries/useTasksQuery';
import { useTaskMutations } from '@/hooks/mutations/useTaskMutations';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { TaskStatus, TaskPriority } from '@/types/task';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { TaskRow } from '@/components/tasks/TaskRow';
import { ModernCard } from '@/components/ui/modern-card';
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Package,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TasksPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <TasksContent />
      </MainLayout>
    </ProtectedRoute>
  );
}

function TasksContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: tasks = [] } = useTasksQuery();
  const {
    updateTaskStatus,
  } = useTaskMutations();

  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);

  const handleExecuteBooking = async (taskId: string) => {
    if (!confirm('Are you sure you want to execute this API booking? This will confirm the booking with the supplier.')) {
      return;
    }

    try {
      setExecutingTaskId(taskId);
      const response = await fetch('/api/bookings/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Successfully executed booking! Confirmation: ${data.confirmationNumber}`);
        queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
      } else {
        alert(`Execution failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Execution failed:', error);
      alert('An unexpected error occurred during execution.');
    } finally {
      setExecutingTaskId(null);
    }
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.customerName.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.itemName?.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => {
      // Sort by status first (in_progress first, then pending, then others)
      const statusOrder = { in_progress: 0, pending: 1, blocked: 2, completed: 3, cancelled: 4 };
      const statusDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
      if (statusDiff !== 0) return statusDiff;

      // Then by priority
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by due date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return 0;
    });
  }, [tasks, statusFilter, priorityFilter, searchQuery]);

  // Calculate task summary
  const summary = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const blocked = tasks.filter(t => t.status === 'blocked').length;
    const apiReady = tasks.filter(t => (t.attachments as any)?.executionType === 'api' && t.status !== 'completed').length;

    return {
      total,
      pending,
      inProgress,
      completed,
      blocked,
      apiReady,
    };
  }, [tasks]);

  return (
    <div className="p-4 sm:p-8 bg-clio-gray-50/30 dark:bg-clio-gray-950/30 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-black text-clio-gray-900 dark:text-white uppercase tracking-tighter leading-none">
              Operations <span className="text-clio-blue">Center</span>
            </h1>
            <p className="text-clio-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2 flex items-center gap-2">
              <Package className="w-3 h-3" />
              Global Task Fulfillment & Supply Chain
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-clio-gray-400">
            <Clock className="w-3 h-3" />
            Last Updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Modern Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <ModernCard variant="default" className="p-5 border-l-4 border-l-clio-blue hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Total Active</div>
              <ArrowUpRight className="w-3 h-3 text-clio-gray-300" />
            </div>
            <div className="text-3xl font-black text-clio-gray-900 dark:text-white mt-1">
              {summary.pending + summary.inProgress}
            </div>
            <div className="text-[10px] font-bold text-clio-blue mt-1 uppercase tracking-tight">
              {summary.inProgress} in progress
            </div>
          </ModernCard>

          <ModernCard variant="default" className="p-5 border-l-4 border-l-emerald-500 hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400">API Ready</div>
              <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />
            </div>
            <div className="text-3xl font-black text-emerald-600 mt-1">
              {summary.apiReady}
            </div>
            <div className="text-[10px] font-bold text-emerald-600/70 mt-1 uppercase tracking-tight">
              Awaiting execution
            </div>
          </ModernCard>

          <ModernCard variant="default" className="p-5 border-l-4 border-l-orange-500 hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Blocked</div>
              <AlertCircle className="w-3 h-3 text-orange-500/50" />
            </div>
            <div className="text-3xl font-black text-orange-600 mt-1">
              {summary.blocked}
            </div>
            <div className="text-[10px] font-bold text-orange-600/70 mt-1 uppercase tracking-tight">
              Needs attention
            </div>
          </ModernCard>

          <ModernCard variant="default" className="p-5 border-l-4 border-l-clio-gray-200 hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Completed</div>
              <CheckCircle2 className="w-3 h-3 text-clio-gray-300" />
            </div>
            <div className="text-3xl font-black text-clio-gray-900 dark:text-white mt-1">
              {summary.completed}
            </div>
            <div className="text-[10px] font-bold text-clio-gray-400 mt-1 uppercase tracking-tight">
              Lifetime fulfilled
            </div>
          </ModernCard>
        </div>

        {/* Filters Bar */}
        <div className="bg-white dark:bg-clio-gray-900 p-2 sm:p-3 rounded-2xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-sm mb-6 flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-clio-gray-400" />
            <input 
              type="text"
              placeholder="Search by task, customer, or item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-clio-gray-50/50 dark:bg-clio-gray-950/50 pl-11 pr-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-tight outline-none focus:ring-2 focus:ring-clio-blue/10 border border-transparent focus:border-clio-blue/20 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-clio-gray-50/50 dark:bg-clio-gray-950/50 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none border border-transparent focus:border-clio-blue/20 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="bg-clio-gray-50/50 dark:bg-clio-gray-950/50 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none border border-transparent focus:border-clio-blue/20 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Tasks List Container */}
        <div className="bg-white dark:bg-clio-gray-900 rounded-2xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-xl overflow-hidden min-h-[400px]">
          <div className="bg-clio-gray-50/50 dark:bg-clio-gray-950/50 border-b border-clio-gray-100 dark:border-clio-gray-800 px-6 py-3 hidden sm:flex items-center gap-4">
            <div className="w-8"></div>
            <div className="flex-1 text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Task Details & Priority</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 opacity-0 group-hover:opacity-100">Actions</div>
          </div>
          
          {filteredTasks.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 bg-clio-gray-50 dark:bg-clio-gray-800 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-clio-gray-200 dark:text-clio-gray-700" />
              </div>
              <h3 className="text-lg font-black text-clio-gray-900 dark:text-white uppercase tracking-tighter">No tasks found</h3>
              <p className="text-sm font-bold text-clio-gray-400 uppercase tracking-tight mt-1">Adjust your filters or check back later</p>
            </div>
          ) : (
            <div className="divide-y divide-clio-gray-100 dark:divide-clio-gray-800">
              {filteredTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onStatusChange={(id, status) => updateTaskStatus.mutate({ id, status })}
                  onExecuteAPI={handleExecuteBooking}
                  isExecuting={executingTaskId === task.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
