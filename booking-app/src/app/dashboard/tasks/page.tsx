'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTasksQuery } from '@/hooks/queries/useTasksQuery';
import { useTaskMutations } from '@/hooks/mutations/useTaskMutations';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { cn } from '@/lib/utils';
import { TaskStatus, TaskPriority, TaskType, BookingTask } from '@/types/task';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  XCircle,
  Filter,
  Search,
  Upload,
  User,
} from 'lucide-react';

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
    assignTask,
    completeTask,
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

  useEffect(() => {
    console.log('[TasksPage] Component mounted, tasks loaded:', tasks.length);
    return () => {
      console.log('[TasksPage] Component unmounted');
    };
  }, []);

  useEffect(() => {
    console.log('[TasksPage] Tasks updated:', {
      totalTasks: tasks.length,
      statusFilter,
      priorityFilter,
      searchQuery
    });
  }, [tasks, statusFilter, priorityFilter, searchQuery]);

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
          task.description?.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => {
      // Sort by priority first
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
    const cancelled = tasks.filter(t => t.status === 'cancelled').length;

    const now = new Date();
    const overdue = tasks.filter(t => {
      if (t.dueDate && t.status !== 'completed' && t.status !== 'cancelled') {
        return new Date(t.dueDate) < now;
      }
      return false;
    }).length;

    const dueToday = tasks.filter(t => {
      if (t.dueDate && t.status !== 'completed' && t.status !== 'cancelled') {
        const dueDate = new Date(t.dueDate);
        return dueDate.toDateString() === now.toDateString();
      }
      return false;
    }).length;

    const dueSoon = tasks.filter(t => {
      if (t.dueDate && t.status !== 'completed' && t.status !== 'cancelled') {
        const dueDate = new Date(t.dueDate);
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        return dueDate > now && dueDate <= threeDaysFromNow;
      }
      return false;
    }).length;

    return {
      total,
      pending,
      inProgress,
      completed,
      blocked,
      cancelled,
      overdue,
      dueToday,
      dueSoon,
    };
  }, [tasks]);

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'blocked':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-400" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return null;

    const date = new Date(dueDate);
    const now = new Date();
    const isOverdue = date < now;
    const isToday = date.toDateString() === now.toDateString();

    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    if (isOverdue) {
      return <span className="text-red-600 font-semibold">Overdue ({dateStr})</span>;
    }
    if (isToday) {
      return <span className="text-orange-600 font-semibold">Due Today</span>;
    }
    return <span className="text-gray-600">Due {dateStr}</span>;
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">Booking Tasks</h1>
          <p className="text-clio-gray-600 dark:text-clio-gray-400 font-medium mt-2">
            Manage manual booking tasks and upload confirmations
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-clio-gray-900 p-6 rounded-2xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400 mb-1">Pending</div>
            <div className="text-3xl font-bold text-clio-gray-900 dark:text-white">{summary.pending}</div>
          </div>
          <div className="bg-white dark:bg-clio-gray-900 p-6 rounded-2xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400 mb-1">In Progress</div>
            <div className="text-3xl font-bold text-clio-blue">{summary.inProgress}</div>
          </div>
          <div className="bg-white dark:bg-clio-gray-900 p-6 rounded-2xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400 mb-1">Overdue</div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{summary.overdue}</div>
          </div>
          <div className="bg-white dark:bg-clio-gray-900 p-6 rounded-2xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400 mb-1">Completed</div>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{summary.completed}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-clio-gray-900 p-6 rounded-2xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-sm mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-clio-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-clio-gray-50 dark:bg-clio-gray-950 border border-clio-gray-200 dark:border-clio-gray-800 text-clio-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all font-medium"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
              className="h-12 px-4 bg-clio-gray-50 dark:bg-clio-gray-950 border border-clio-gray-200 dark:border-clio-gray-800 text-clio-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all font-bold uppercase tracking-tight text-xs min-w-[160px]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
              className="h-12 px-4 bg-clio-gray-50 dark:bg-clio-gray-950 border border-clio-gray-200 dark:border-clio-gray-800 text-clio-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-clio-blue/20 focus:border-clio-blue transition-all font-bold uppercase tracking-tight text-xs min-w-[160px]"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="bg-white dark:bg-clio-gray-900 p-24 rounded-2xl border border-clio-gray-200 dark:border-clio-gray-800 text-center">
              <div className="w-16 h-16 bg-clio-gray-50 dark:bg-clio-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-clio-gray-400" />
              </div>
              <p className="text-xl font-bold text-clio-gray-900 dark:text-white mb-1">No tasks found</p>
              <p className="text-sm font-medium text-clio-gray-500 dark:text-clio-gray-400">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white dark:bg-clio-gray-900 p-6 rounded-2xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">
                    <div className="p-2 rounded-xl bg-clio-gray-50 dark:bg-clio-gray-800 group-hover:bg-clio-gray-100 dark:group-hover:bg-clio-gray-700 transition-colors">
                      {getStatusIcon(task.status)}
                    </div>
                  </div>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm font-medium text-clio-gray-600 dark:text-clio-gray-400 mt-1">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Priority Badge */}
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-none ${getPriorityColor(
                          task.priority
                        ).replace('bg-', 'bg-').replace('100', '50 dark:bg-opacity-20').replace('text-', 'dark:text-').replace('800', '400')}`}
                      >
                        {task.priority.toUpperCase()}
                      </span>
                    </div>

                    {/* Task Meta */}
                    <div className="flex flex-wrap items-center gap-6 mt-4">
                      <div className="flex items-center gap-2 text-clio-gray-600 dark:text-clio-gray-400">
                        <div className="w-8 h-8 rounded-full bg-clio-blue/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-clio-blue" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-tight">{task.customerName}</span>
                      </div>

                      {task.itemName && (
                        <div className="text-clio-gray-500 dark:text-clio-gray-400 flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{task.itemType}:</span>
                          <span className="text-xs font-bold text-clio-gray-700 dark:text-clio-gray-300">{task.itemName}</span>
                        </div>
                      )}

                      {task.dueDate && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-clio-gray-400" />
                          <span className="text-xs font-bold uppercase tracking-tight">{formatDueDate(task.dueDate)}</span>
                        </div>
                      )}

                      {task.assignedToName && (
                        <div className="px-3 py-1 bg-clio-blue/5 dark:bg-clio-blue/10 rounded-lg text-clio-blue text-[10px] font-black uppercase tracking-widest border border-clio-blue/20">
                          Assignee: {task.assignedToName}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-clio-gray-50 dark:border-clio-gray-800">
                      {task.status === 'pending' && (
                        <button
                          onClick={() => updateTaskStatus.mutate({ id: task.id, status: 'in_progress' })}
                          className="px-6 py-2 bg-clio-blue text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-clio-blue/90 shadow-sm shadow-clio-blue/20 transition-all"
                        >
                          Start Task
                        </button>
                      )}

                      {task.status === 'in_progress' && (
                        <button
                          onClick={() => completeTask.mutate({ id: task.id })}
                          className="px-6 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition-all"
                        >
                          Mark Complete
                        </button>
                      )}

                      {/* Execute API Booking Button (Human in the Loop) */}
                      {(task.attachments as any)?.executionType === 'api' && task.status !== 'completed' && (
                        <button
                          onClick={() => handleExecuteBooking(task.id)}
                          disabled={executingTaskId === task.id || !(task.attachments as any)?.isReady}
                          className={`px-6 py-2 text-white text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 transition-all ${
                            (task.attachments as any)?.isReady 
                              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20' 
                              : 'bg-clio-gray-300 dark:bg-clio-gray-800 text-clio-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {executingTaskId === task.id ? (
                            <Clock className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          {(task.attachments as any)?.isReady ? 'Execute API Booking' : 'Waiting for Funds'}
                        </button>
                      )}

                      {task.type === 'upload_confirmation' && task.status !== 'completed' && (
                        <button
                          onClick={() => {
                            // TODO: Open upload modal
                            alert('Upload modal coming soon!');
                          }}
                          className="px-6 py-2 bg-clio-navy dark:bg-clio-blue text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
                        >
                          <Upload className="w-4 h-4" />
                          Upload Document
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
