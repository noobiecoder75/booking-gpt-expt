import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  BookingTask,
  TaskStatus,
  TaskPriority,
  TaskType,
} from '@/types/task';

export function useTaskMutations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();

  const createTask = useMutation({
    mutationFn: async (taskData: Omit<BookingTask, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          type: taskData.type,
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          status: taskData.status,
          quote_id: taskData.quoteId,
          quote_item_id: taskData.quoteItemId,
          contact_id: taskData.customerId,
          customer_name: taskData.customerName,
          assigned_to: taskData.assignedTo,
          assigned_to_name: taskData.assignedToName,
          item_type: taskData.itemType,
          item_name: taskData.itemName,
          item_details: taskData.itemDetails,
          due_date: taskData.dueDate,
          completed_at: taskData.completedAt,
          blocked_reason: taskData.blockedReason,
          notes: taskData.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BookingTask> }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const updateData: any = {};
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.quoteId !== undefined) updateData.quote_id = updates.quoteId;
      if (updates.quoteItemId !== undefined) updateData.quote_item_id = updates.quoteItemId;
      if (updates.customerId !== undefined) updateData.contact_id = updates.customerId;
      if (updates.customerName !== undefined) updateData.customer_name = updates.customerName;
      if (updates.assignedTo !== undefined) updateData.assigned_to = updates.assignedTo;
      if (updates.assignedToName !== undefined) updateData.assigned_to_name = updates.assignedToName;
      if (updates.itemType !== undefined) updateData.item_type = updates.itemType;
      if (updates.itemName !== undefined) updateData.item_name = updates.itemName;
      if (updates.itemDetails !== undefined) updateData.item_details = updates.itemDetails;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
      if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt;
      if (updates.blockedReason !== undefined) updateData.blocked_reason = updates.blockedReason;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: TaskStatus; notes?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (notes) updateData.notes = notes;

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
  });

  const assignTask = useMutation({
    mutationFn: async ({ id, agentId, agentName }: { id: string; agentId: string; agentName: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tasks')
        .update({
          assigned_to: agentId,
          assigned_to_name: agentName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
  });

  const completeTask = useMutation({
    mutationFn: async ({ id, completionNotes }: { id: string; completionNotes?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const updateData: any = {
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (completionNotes) {
        updateData.notes = completionNotes;
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
  });

  const blockTask = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'blocked',
          blocked_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
  });

  const unblockTask = useMutation({
    mutationFn: async (taskId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'pending',
          blocked_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
  });

  const bulkUpdateStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: TaskStatus }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .in('id', ids)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
  });

  const bulkAssign = useMutation({
    mutationFn: async ({ ids, agentId, agentName }: { ids: string[]; agentId: string; agentName: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tasks')
        .update({
          assigned_to: agentId,
          assigned_to_name: agentName,
          updated_at: new Date().toISOString(),
        })
        .in('id', ids)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
  });

  const generateTasksFromQuoteItem = useMutation({
    mutationFn: async (quoteItem: {
      id: string;
      quoteId: string;
      type: string;
      name: string;
      supplierSource?: string;
      details: any;
      customerId: string;
      customerName: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const tasks: any[] = [];
      const supplierSource = typeof quoteItem.supplierSource === 'string'
        ? quoteItem.supplierSource
        : 'offline_platform';
      const isOfflineBooking = supplierSource.startsWith('offline_');

      if (isOfflineBooking) {
        // Create manual booking task
        tasks.push({
          user_id: user.id,
          type: 'manual_booking',
          title: `Book ${quoteItem.name}`,
          description: `Manually book ${quoteItem.name} via ${supplierSource}`,
          priority: 'high',
          status: 'pending',
          quote_id: quoteItem.quoteId,
          quote_item_id: quoteItem.id,
          contact_id: quoteItem.customerId,
          customer_name: quoteItem.customerName,
          item_type: quoteItem.type,
          item_name: quoteItem.name,
          item_details: quoteItem.details,
          due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Due in 24 hours
        });

        // Create follow-up task
        tasks.push({
          user_id: user.id,
          type: 'follow_up',
          title: `Confirm booking for ${quoteItem.name}`,
          description: `Follow up and confirm the booking status`,
          priority: 'medium',
          status: 'pending',
          quote_id: quoteItem.quoteId,
          quote_item_id: quoteItem.id,
          contact_id: quoteItem.customerId,
          customer_name: quoteItem.customerName,
          item_type: quoteItem.type,
          item_name: quoteItem.name,
          due_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Due in 48 hours
        });
      }

      // Create document collection task for all bookings
      tasks.push({
        user_id: user.id,
        type: 'document_collection',
        title: `Collect documents for ${quoteItem.name}`,
        description: `Collect and verify travel documents, vouchers, and confirmations`,
        priority: 'medium',
        status: 'pending',
        quote_id: quoteItem.quoteId,
        quote_item_id: quoteItem.id,
        contact_id: quoteItem.customerId,
        customer_name: quoteItem.customerName,
        item_type: quoteItem.type,
        item_name: quoteItem.name,
        due_date: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // Due in 72 hours
      });

      const { data, error } = await supabase
        .from('tasks')
        .insert(tasks)
        .select();

      if (error) throw error;
      return data.map(task => task.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
  });

  return {
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    assignTask,
    completeTask,
    blockTask,
    unblockTask,
    bulkUpdateStatus,
    bulkAssign,
    generateTasksFromQuoteItem,
  };
}
