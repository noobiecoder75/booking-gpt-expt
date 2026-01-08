'use client';

import { useState } from 'react';
import { BookingTask, TaskStatus, TaskPriority } from '@/types/task';
import { Badge } from '@/components/ui/badge';
import { ModernButton } from '@/components/ui/modern-button';
import { 
  CheckCircle2, Circle, Clock, AlertCircle, XCircle, 
  ExternalLink, User, Calendar, Plane, Hotel, MapPin, Car, FileText 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { BookingReviewModal } from './BookingReviewModal';

interface TaskRowProps {
  task: BookingTask;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onExecuteAPI?: (id: string) => void;
  isExecuting?: boolean;
}

export function TaskRow({ task, onStatusChange, onExecuteAPI, isExecuting }: TaskRowProps) {
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'blocked': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Circle className="w-4 h-4 text-clio-gray-300" />;
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    const colors = {
      urgent: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
      high: 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
      medium: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
      low: 'bg-clio-gray-50 text-clio-gray-700 border-clio-gray-100 dark:bg-clio-gray-800 dark:text-clio-gray-400 dark:border-clio-gray-700',
    };
    return (
      <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0", colors[priority])}>
        {priority}
      </Badge>
    );
  };

  const getItemIcon = (type?: string) => {
    switch (type) {
      case 'flight': return <Plane className="w-3.5 h-3.5" />;
      case 'hotel': return <Hotel className="w-3.5 h-3.5" />;
      case 'activity': return <MapPin className="w-3.5 h-3.5" />;
      case 'transfer': return <Car className="w-3.5 h-3.5" />;
      default: return <FileText className="w-3.5 h-3.5" />;
    }
  };

  const isAPIBooking = (task.attachments as any)?.executionType === 'api';

  return (
    <>
      <div className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white dark:bg-clio-gray-900 border-b border-clio-gray-100 dark:border-clio-gray-800 hover:bg-clio-gray-50 dark:hover:bg-clio-gray-800/50 transition-all">
        {/* Status & Icon */}
        <div className="flex-shrink-0 w-8 flex justify-center mt-1 sm:mt-0">
          {getStatusIcon(task.status)}
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="font-bold text-sm text-clio-gray-900 dark:text-white uppercase tracking-tight truncate">
              {task.title}
            </span>
            {getPriorityBadge(task.priority)}
            {isAPIBooking && (
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800 text-[10px] uppercase font-bold">API Ready</Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-clio-gray-500 dark:text-clio-gray-400">
            <div className="flex items-center gap-1.5">
              <User className="w-3 h-3" />
              <span>{task.customerName}</span>
            </div>
            {task.itemName && (
              <div className="flex items-center gap-1.5 text-clio-blue dark:text-clio-blue/80">
                {getItemIcon(task.itemType)}
                <span className="truncate max-w-[200px]">{task.itemName}</span>
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Smart Actions */}
        <div className="flex items-center gap-2 mt-3 sm:mt-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          {task.quoteId && (
            <Link href={`/dashboard/quote-wizard?edit=${task.quoteId}`}>
              <ModernButton variant="outline" size="sm" className="h-8 text-[10px] gap-1.5 uppercase font-bold">
                <ExternalLink className="w-3.5 h-3.5" />
                Open Quote
              </ModernButton>
            </Link>
          )}
          
          {isAPIBooking && task.status !== 'completed' && (
            <ModernButton 
              variant="default" 
              size="sm" 
              className="h-8 text-[10px] gap-1.5 uppercase font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setIsReviewOpen(true)}
              disabled={isExecuting || !(task.attachments as any)?.isReady}
            >
              {isExecuting ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Review & Book
            </ModernButton>
          )}

          {task.status === 'pending' && (
            <ModernButton 
              variant="ghost" 
              size="sm" 
              className="h-8 text-[10px] uppercase font-bold text-clio-blue hover:bg-clio-blue/10"
              onClick={() => onStatusChange(task.id, 'in_progress')}
            >
              Start
            </ModernButton>
          )}
          
          {task.status === 'in_progress' && (
            <ModernButton 
              variant="ghost" 
              size="sm" 
              className="h-8 text-[10px] uppercase font-bold text-emerald-600 hover:bg-emerald-50"
              onClick={() => onStatusChange(task.id, 'completed')}
            >
              Complete
            </ModernButton>
          )}
        </div>
      </div>

      <BookingReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        task={task}
        onConfirm={() => {
          if (onExecuteAPI) {
            onExecuteAPI(task.id);
          }
          setIsReviewOpen(false);
        }}
        isExecuting={isExecuting}
      />
    </>
  );
}
