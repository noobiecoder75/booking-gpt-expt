// This file contains the updated database types after migration
// Generated based on the schema after running 001_fix_schema_mismatches.sql

export interface Database {
  public: {
    Tables: {
      // ... (other tables remain the same)

      expenses: {
        Row: {
          id: string
          user_id: string
          category: string
          subcategory: string | null
          amount: number
          currency: string
          description: string
          date: string
          vendor: string | null
          supplier_id: string | null
          receipt_url: string | null
          approved_by: string | null
          approved_date: string | null
          status: 'pending' | 'paid' | 'cancelled'
          payment_method: 'credit_card' | 'bank_transfer' | 'cash' | 'check' | 'paypal' | 'stripe' | 'auto_deducted' | null
          is_recurring: boolean
          recurring_frequency: 'monthly' | 'quarterly' | 'yearly' | null
          booking_id: string | null
          agent_id: string | null
          tags: string[] | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          subcategory?: string | null
          amount: number
          currency?: string
          description: string
          date: string
          vendor?: string | null
          supplier_id?: string | null
          receipt_url?: string | null
          approved_by?: string | null
          approved_date?: string | null
          status?: 'pending' | 'paid' | 'cancelled'
          payment_method?: 'credit_card' | 'bank_transfer' | 'cash' | 'check' | 'paypal' | 'stripe' | 'auto_deducted' | null
          is_recurring?: boolean
          recurring_frequency?: 'monthly' | 'quarterly' | 'yearly' | null
          booking_id?: string | null
          agent_id?: string | null
          tags?: string[] | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          subcategory?: string | null
          amount?: number
          currency?: string
          description?: string
          date?: string
          vendor?: string | null
          supplier_id?: string | null
          receipt_url?: string | null
          approved_by?: string | null
          approved_date?: string | null
          status?: 'pending' | 'paid' | 'cancelled'
          payment_method?: 'credit_card' | 'bank_transfer' | 'cash' | 'check' | 'paypal' | 'stripe' | 'auto_deducted' | null
          is_recurring?: boolean
          recurring_frequency?: 'monthly' | 'quarterly' | 'yearly' | null
          booking_id?: string | null
          agent_id?: string | null
          tags?: string[] | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      invoices: {
        Row: {
          id: string
          user_id: string
          contact_id: string | null
          customer_id: string | null
          customer_name: string | null
          customer_email: string | null
          customer_address: string | null
          quote_id: string | null
          invoice_number: string
          total: number
          amount: number // Generated column, same as total
          paid_amount: number
          remaining_amount: number
          currency: string
          status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled' | 'void'
          issue_date: string
          due_date: string
          paid_date: string | null
          items: any // JSONB
          subtotal: number | null
          tax_rate: number
          tax_amount: number
          discount_amount: number
          notes: string | null
          terms: string
          payments: any // JSONB
          sent_at: string | null
          viewed_at: string | null
          paid_at: string | null
          overdue_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_id?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_email?: string | null
          customer_address?: string | null
          quote_id?: string | null
          invoice_number: string
          total: number
          paid_amount?: number
          remaining_amount: number
          currency?: string
          status?: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled' | 'void'
          issue_date: string
          due_date: string
          paid_date?: string | null
          items?: any
          subtotal?: number | null
          tax_rate?: number
          tax_amount?: number
          discount_amount?: number
          notes?: string | null
          terms?: string
          payments?: any
          sent_at?: string | null
          viewed_at?: string | null
          paid_at?: string | null
          overdue_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contact_id?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_email?: string | null
          customer_address?: string | null
          quote_id?: string | null
          invoice_number?: string
          total?: number
          paid_amount?: number
          remaining_amount?: number
          currency?: string
          status?: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled' | 'void'
          issue_date?: string
          due_date?: string
          paid_date?: string | null
          items?: any
          subtotal?: number | null
          tax_rate?: number
          tax_amount?: number
          discount_amount?: number
          notes?: string | null
          terms?: string
          payments?: any
          sent_at?: string | null
          viewed_at?: string | null
          paid_at?: string | null
          overdue_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      commissions: {
        Row: {
          id: string
          user_id: string
          booking_id: string
          quote_id: string | null
          invoice_id: string | null
          agent_id: string | null
          agent_name: string | null
          customer_id: string | null
          customer_name: string | null
          amount: number // Old column name (kept for compatibility)
          commission_amount: number // New column name
          currency: string
          rate: number // Old column name (kept for compatibility)
          commission_rate: number // New column name
          booking_amount: number | null
          status: 'pending' | 'approved' | 'paid' | 'cancelled'
          paid_at: string | null
          payment_method: string | null
          transaction_id: string | null
          booking_type: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          booking_id: string
          quote_id?: string | null
          invoice_id?: string | null
          agent_id?: string | null
          agent_name?: string | null
          customer_id?: string | null
          customer_name?: string | null
          amount?: number
          commission_amount?: number
          currency?: string
          rate?: number
          commission_rate?: number
          booking_amount?: number | null
          status?: 'pending' | 'approved' | 'paid' | 'cancelled'
          paid_at?: string | null
          payment_method?: string | null
          transaction_id?: string | null
          booking_type?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          booking_id?: string
          quote_id?: string | null
          invoice_id?: string | null
          agent_id?: string | null
          agent_name?: string | null
          customer_id?: string | null
          customer_name?: string | null
          amount?: number
          commission_amount?: number
          currency?: string
          rate?: number
          commission_rate?: number
          booking_amount?: number | null
          status?: 'pending' | 'approved' | 'paid' | 'cancelled'
          paid_at?: string | null
          payment_method?: string | null
          transaction_id?: string | null
          booking_type?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}