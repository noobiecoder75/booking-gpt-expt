import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  BookingTask,
  TaskAttachment,
  TaskStatus,
  TaskPriority,
  TaskType,
  TaskFilters,
  TaskSummary,
} from '@/types/task';

interface TaskStore {
  // Local cache
  tasks: BookingTask[];
  attachments: TaskAttachment[];

  // Sync status
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSyncTime: Date | null;

  // Actions
  fetchTasks: () => Promise<void>;
  createTask: (taskData: Omit<BookingTask, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTask: (id: string, updates: Partial<BookingTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  getTaskById: (id: string) => BookingTask | undefined;

  // Task status management
  updateTaskStatus: (id: string, status: TaskStatus, notes?: string) => Promise<void>;
  assignTask: (id: string, agentId: string, agentName: string) => Promise<void>;
  completeTask: (id: string, completionNotes?: string) => Promise<void>;
  blockTask: (id: string, reason: string) => Promise<void>;
  unblockTask: (id: string) => Promise<void>;

  // Bulk operations
  bulkUpdateStatus: (ids: string[], status: TaskStatus) => Promise<void>;
  bulkAssign: (ids: string[], agentId: string, agentName: string) => Promise<void>;

  // Filtering and querying
  getTasksByStatus: (status: TaskStatus) => BookingTask[];
  getTasksByAssignee: (agentId: string) => BookingTask[];
  getTasksByQuote: (quoteId: string) => BookingTask[];
  getTasksByCustomer: (customerId: string) => BookingTask[];
  getOverdueTasks: () => BookingTask[];
  getDueToday: () => BookingTask[];
  getDueSoon: (days?: number) => BookingTask[];
  filterTasks: (filters: TaskFilters) => BookingTask[];

  // Task summary
  getTaskSummary: (agentId?: string) => TaskSummary;

  // Attachment operations (local only)
  addAttachment: (attachmentData: Omit<TaskAttachment, 'id' | 'uploadedAt'>) => string;
  deleteAttachment: (id: string) => void;
  getAttachmentsByTask: (taskId: string) => TaskAttachment[];

  // Auto-generation helpers
  generateTasksFromQuoteItem: (quoteItem: {
    id: string;
    quoteId: string;
    type: string;
    name: string;
    supplierSource?: string;
    details: any;
    customerId: string;
    customerName: string;
  }) => Promise<string[]>;

  // Sync
  syncTasks: () => Promise<void>;
  clearLocalCache: () => void;
}

// Helper: Convert database row to BookingTask
function dbRowToTask(row: any): BookingTask {
  return {
    id: row.id,
    type: row.type as TaskType,
    title: row.title,
    description: row.description || undefined,
    priority: row.priority as TaskPriority,
    status: row.status as TaskStatus,
    quoteId: row.quote_id || undefined,
    quoteItemId: row.quote_item_id || undefined,
    customerId: row.contact_id || undefined,
    customerName: row.customer_name || undefined,
    assignedTo: row.assigned_to || undefined,
    assignedToName: row.assigned_to_name || undefined,
    itemType: row.item_type || undefined,
    itemName: row.item_name || undefined,
    itemDetails: row.item_details || undefined,
    dueDate: row.due_date || undefined,
    completedAt: row.completed_at || undefined,
    blockedReason: row.blocked_reason || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Helper: Convert BookingTask to database insert
function taskToDbInsert(task: Omit<BookingTask, 'id' | 'createdAt' | 'updatedAt'>, userId: string): any {
  return {
    user_id: userId,
    contact_id: task.customerId || null,
    quote_id: task.quoteId || null,
    booking_id: null,
    type: task.type,
    title: task.title,
    description: task.description || null,
    status: task.status,
    priority: task.priority,
    due_date: task.dueDate || null,
    completed_at: task.completedAt || null,
    attachments: null,
    quote_item_id: task.quoteItemId || null,
    assigned_to: task.assignedTo || null,
    assigned_to_name: task.assignedToName || null,
    customer_name: task.customerName || null,
    item_type: task.itemType || null,
    item_name: task.itemName || null,
    item_details: task.itemDetails || null,
    blocked_reason: task.blockedReason || null,
    notes: task.notes || null,
  };
}

// Helper: Convert BookingTask updates to database update
function taskToDbUpdate(updates: Partial<BookingTask>): any {
  const dbUpdate: any = {};

  if (updates.title !== undefined) dbUpdate.title = updates.title;
  if (updates.description !== undefined) dbUpdate.description = updates.description;
  if (updates.status !== undefined) dbUpdate.status = updates.status;
  if (updates.priority !== undefined) dbUpdate.priority = updates.priority;
  if (updates.dueDate !== undefined) dbUpdate.due_date = updates.dueDate;
  if (updates.completedAt !== undefined) dbUpdate.completed_at = updates.completedAt;
  if (updates.assignedTo !== undefined) dbUpdate.assigned_to = updates.assignedTo;
  if (updates.assignedToName !== undefined) dbUpdate.assigned_to_name = updates.assignedToName;
  if (updates.blockedReason !== undefined) dbUpdate.blocked_reason = updates.blockedReason;
  if (updates.notes !== undefined) dbUpdate.notes = updates.notes;

  return dbUpdate;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      attachments: [],
      syncStatus: 'idle',
      lastSyncTime: null,

      fetchTasks: async () => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.warn('No authenticated user, skipping fetch');
            set({ syncStatus: 'idle' });
            return;
          }

          const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          const tasks = data.map(dbRowToTask);

          set({
            tasks,
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          });
        } catch (error) {
          console.error('Failed to fetch tasks:', error);
          set({ syncStatus: 'error' });
        }
      },

      createTask: async (taskData) => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('No authenticated user');

          const dbInsert = taskToDbInsert(taskData, user.id);

          const { data, error } = await supabase
            .from('tasks')
            .insert(dbInsert)
            .select()
            .single();

          if (error) throw error;

          const newTask = dbRowToTask(data);

          set((state) => ({
            tasks: [newTask, ...state.tasks],
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          }));

          return newTask.id;
        } catch (error) {
          console.error('Failed to create task:', error);
          set({ syncStatus: 'error' });

          // Fallback to local
          const id = crypto.randomUUID();
          const now = new Date().toISOString();

          const localTask: BookingTask = {
            ...taskData,
            id,
            createdAt: now,
            updatedAt: now,
          };

          set((state) => ({
            tasks: [localTask, ...state.tasks],
          }));

          return id;
        }
      },

      updateTask: async (id, updates) => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const dbUpdate = taskToDbUpdate(updates);

          const { data, error } = await supabase
            .from('tasks')
            .update(dbUpdate)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          const updatedTask = dbRowToTask(data);

          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === id ? updatedTask : task
            ),
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          }));
        } catch (error) {
          console.error('Failed to update task:', error);
          set({ syncStatus: 'error' });

          // Update local cache only
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === id
                ? { ...task, ...updates, updatedAt: new Date().toISOString() }
                : task
            ),
          }));
        }
      },

      deleteTask: async (id) => {
        const supabase = getSupabaseBrowserClient();

        try {
          set({ syncStatus: 'syncing' });

          const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            tasks: state.tasks.filter((task) => task.id !== id),
            syncStatus: 'idle',
            lastSyncTime: new Date(),
          }));
        } catch (error) {
          console.error('Failed to delete task:', error);
          set({ syncStatus: 'error' });

          // Delete from local cache only
          set((state) => ({
            tasks: state.tasks.filter((task) => task.id !== id),
          }));
        }
      },

      getTaskById: (id) => {
        return get().tasks.find((task) => task.id === id);
      },

      updateTaskStatus: async (id, status, notes) => {
        const updates: Partial<BookingTask> = { status };

        if (notes) {
          updates.notes = notes;
        }

        if (status === 'completed') {
          updates.completedAt = new Date().toISOString();
        }

        await get().updateTask(id, updates);
      },

      assignTask: async (id, agentId, agentName) => {
        await get().updateTask(id, {
          assignedTo: agentId,
          assignedToName: agentName,
        });
      },

      completeTask: async (id, completionNotes) => {
        const updates: Partial<BookingTask> = {
          status: 'completed',
          completedAt: new Date().toISOString(),
        };

        if (completionNotes) {
          updates.notes = completionNotes;
        }

        await get().updateTask(id, updates);
      },

      blockTask: async (id, reason) => {
        await get().updateTask(id, {
          status: 'blocked',
          blockedReason: reason,
        });
      },

      unblockTask: async (id) => {
        await get().updateTask(id, {
          status: 'pending',
          blockedReason: undefined,
        });
      },

      bulkUpdateStatus: async (ids, status) => {
        for (const id of ids) {
          await get().updateTaskStatus(id, status);
        }
      },

      bulkAssign: async (ids, agentId, agentName) => {
        for (const id of ids) {
          await get().assignTask(id, agentId, agentName);
        }
      },

      getTasksByStatus: (status) => {
        return get().tasks.filter((task) => task.status === status);
      },

      getTasksByAssignee: (agentId) => {
        return get().tasks.filter((task) => task.assignedTo === agentId);
      },

      getTasksByQuote: (quoteId) => {
        return get().tasks.filter((task) => task.quoteId === quoteId);
      },

      getTasksByCustomer: (customerId) => {
        return get().tasks.filter((task) => task.customerId === customerId);
      },

      getOverdueTasks: () => {
        const now = new Date();
        return get().tasks.filter((task) => {
          if (!task.dueDate || task.status === 'completed' || task.status === 'cancelled') {
            return false;
          }
          return new Date(task.dueDate) < now;
        });
      },

      getDueToday: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return get().tasks.filter((task) => {
          if (!task.dueDate || task.status === 'completed' || task.status === 'cancelled') {
            return false;
          }
          const dueDate = new Date(task.dueDate);
          return dueDate >= today && dueDate < tomorrow;
        });
      },

      getDueSoon: (days = 3) => {
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        return get().tasks.filter((task) => {
          if (!task.dueDate || task.status === 'completed' || task.status === 'cancelled') {
            return false;
          }
          const dueDate = new Date(task.dueDate);
          return dueDate >= now && dueDate <= futureDate;
        });
      },

      filterTasks: (filters) => {
        let filtered = get().tasks;

        if (filters.status && filters.status.length > 0) {
          filtered = filtered.filter((task) => filters.status!.includes(task.status));
        }

        if (filters.priority && filters.priority.length > 0) {
          filtered = filtered.filter((task) => filters.priority!.includes(task.priority));
        }

        if (filters.type && filters.type.length > 0) {
          filtered = filtered.filter((task) => filters.type!.includes(task.type));
        }

        if (filters.assignedTo) {
          filtered = filtered.filter((task) => task.assignedTo === filters.assignedTo);
        }

        if (filters.customerId) {
          filtered = filtered.filter((task) => task.customerId === filters.customerId);
        }

        if (filters.quoteId) {
          filtered = filtered.filter((task) => task.quoteId === filters.quoteId);
        }

        if (filters.dueDateFrom) {
          filtered = filtered.filter(
            (task) => task.dueDate && task.dueDate >= filters.dueDateFrom!
          );
        }

        if (filters.dueDateTo) {
          filtered = filtered.filter(
            (task) => task.dueDate && task.dueDate <= filters.dueDateTo!
          );
        }

        return filtered;
      },

      getTaskSummary: (agentId) => {
        let tasks = get().tasks;

        if (agentId) {
          tasks = tasks.filter((task) => task.assignedTo === agentId);
        }

        const now = new Date();
        const overdueTasks = tasks.filter((task) => {
          if (!task.dueDate || task.status === 'completed' || task.status === 'cancelled') {
            return false;
          }
          return new Date(task.dueDate) < now;
        });

        const dueToday = get().getDueToday().filter((task) =>
          agentId ? task.assignedTo === agentId : true
        );

        const dueSoon = get().getDueSoon(3).filter((task) =>
          agentId ? task.assignedTo === agentId : true
        );

        return {
          total: tasks.length,
          pending: tasks.filter((task) => task.status === 'pending').length,
          inProgress: tasks.filter((task) => task.status === 'in_progress').length,
          completed: tasks.filter((task) => task.status === 'completed').length,
          cancelled: tasks.filter((task) => task.status === 'cancelled').length,
          blocked: tasks.filter((task) => task.status === 'blocked').length,
          overdue: overdueTasks.length,
          dueToday: dueToday.length,
          dueSoon: dueSoon.length,
        };
      },

      // Attachment operations (local only)
      addAttachment: (attachmentData) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const attachment: TaskAttachment = {
          ...attachmentData,
          id,
          uploadedAt: now,
        };

        set((state) => ({
          attachments: [...state.attachments, attachment],
        }));

        return id;
      },

      deleteAttachment: (id) => {
        set((state) => ({
          attachments: state.attachments.filter((attachment) => attachment.id !== id),
        }));
      },

      getAttachmentsByTask: (taskId) => {
        return get().attachments.filter((attachment) => attachment.taskId === taskId);
      },

      generateTasksFromQuoteItem: async (quoteItem) => {
        const taskIds: string[] = [];

        const taskTypeMap: Record<string, TaskType> = {
          flight: 'book_flight',
          hotel: 'book_hotel',
          activity: 'book_activity',
          transfer: 'book_transfer',
        };

        const taskType = taskTypeMap[quoteItem.type] || 'book_hotel';

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 2);

        const bookingTaskId = await get().createTask({
          type: taskType,
          title: `Book ${quoteItem.name}`,
          description: `Complete booking for ${quoteItem.type}: ${quoteItem.name}`,
          priority: 'high',
          status: 'pending',
          quoteId: quoteItem.quoteId,
          quoteItemId: quoteItem.id,
          customerId: quoteItem.customerId,
          customerName: quoteItem.customerName,
          itemType: quoteItem.type as any,
          itemName: quoteItem.name,
          itemDetails: quoteItem.details,
          dueDate: dueDate.toISOString(),
        });

        taskIds.push(bookingTaskId);

        const uploadDueDate = new Date(dueDate);
        uploadDueDate.setDate(uploadDueDate.getDate() + 1);

        const uploadTaskId = await get().createTask({
          type: 'upload_confirmation',
          title: `Upload confirmation for ${quoteItem.name}`,
          description: `Upload booking confirmation documents`,
          priority: 'medium',
          status: 'pending',
          quoteId: quoteItem.quoteId,
          quoteItemId: quoteItem.id,
          customerId: quoteItem.customerId,
          customerName: quoteItem.customerName,
          itemType: quoteItem.type as any,
          itemName: quoteItem.name,
          dueDate: uploadDueDate.toISOString(),
        });

        taskIds.push(uploadTaskId);

        return taskIds;
      },

      syncTasks: async () => {
        await get().fetchTasks();
      },

      clearLocalCache: () => {
        set({
          tasks: [],
          attachments: [],
          syncStatus: 'idle',
          lastSyncTime: null,
        });
      },
    }),
    {
      name: 'task-store-supabase',
      partialize: (state) => ({
        tasks: state.tasks,
        attachments: state.attachments,
      }),
    }
  )
);
