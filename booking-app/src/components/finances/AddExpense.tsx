'use client';

import { useState, useMemo } from 'react';
import { useExpenseMutations } from '@/hooks/mutations/useExpenseMutations';
import { useContactsQuery } from '@/hooks/queries/useContactsQuery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExpenseCategory } from '@/types/financial';

interface AddExpenseProps {
  onSuccess?: () => void;
}

export function AddExpense({ onSuccess }: AddExpenseProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'operational' as ExpenseCategory,
    subcategory: '',
    amount: '',
    vendor: '',
    supplierId: '',
    description: '',
    notes: '',
  });

  const { addExpense } = useExpenseMutations();
  const { data: contacts = [] } = useContactsQuery();

  // Filter contacts to only show suppliers
  const suppliers = useMemo(
    () => contacts.filter((c) => c.type === 'supplier'),
    [contacts]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addExpense.mutate({
      date: formData.date,
      category: formData.category,
      subcategory: formData.subcategory || undefined,
      amount: parseFloat(formData.amount),
      currency: 'USD',
      description: formData.description,
      vendor: formData.vendor || undefined,
      supplierId: formData.supplierId || undefined,
      notes: formData.notes || undefined,
    });

    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: 'operational',
      subcategory: '',
      amount: '',
      vendor: '',
      supplierId: '',
      description: '',
      notes: '',
    });

    onSuccess?.();
  };

  const isSupplierPayment = formData.category === 'supplier_payment';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date" className="text-[10px] font-bold text-clio-gray-500 uppercase tracking-tight">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount" className="text-[10px] font-bold text-clio-gray-500 uppercase tracking-tight">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category" className="text-[10px] font-bold text-clio-gray-500 uppercase tracking-tight">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value as ExpenseCategory })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="supplier_payment">Supplier Payment</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="operational">Operational</SelectItem>
              <SelectItem value="commission">Commission</SelectItem>
              <SelectItem value="office">Office</SelectItem>
              <SelectItem value="travel">Travel</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subcategory" className="text-[10px] font-bold text-clio-gray-500 uppercase tracking-tight">Subcategory (Optional)</Label>
          <Input
            id="subcategory"
            placeholder="e.g., Facebook Ads"
            value={formData.subcategory}
            onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
          />
        </div>
      </div>

      {isSupplierPayment ? (
        <div className="space-y-2">
          <Label htmlFor="supplier" className="text-[10px] font-bold text-clio-gray-500 uppercase tracking-tight">Supplier *</Label>
          <Select
            value={formData.supplierId}
            onValueChange={(value) => setFormData({ ...formData, supplierId: value, vendor: '' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-clio-gray-500">
                  No suppliers found. Add suppliers in Contacts.
                </div>
              ) : (
                suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.firstName} {supplier.lastName}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <p className="text-[10px] font-bold text-clio-gray-400 uppercase tracking-tight">
            Supplier payments require a linked supplier for tracking
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="vendor" className="text-[10px] font-bold text-clio-gray-500 uppercase tracking-tight">Vendor (Optional)</Label>
          <Input
            id="vendor"
            placeholder="Vendor name (or select supplier above)"
            value={formData.vendor}
            onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
          />
          {suppliers.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="supplier-link" className="text-[10px] font-bold text-clio-gray-500 uppercase tracking-tight">Or link to existing supplier</Label>
              <Select
                value={formData.supplierId}
                onValueChange={(value) => setFormData({ ...formData, supplierId: value })}
              >
                <SelectTrigger id="supplier-link">
                  <SelectValue placeholder="Link to supplier (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.firstName} {supplier.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="description" className="text-[10px] font-bold text-clio-gray-500 uppercase tracking-tight">Description</Label>
        <Input
          id="description"
          placeholder="Brief description of the expense"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-[10px] font-bold text-clio-gray-500 uppercase tracking-tight">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Additional details..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" className="w-full sm:w-auto font-bold uppercase tracking-tight">Add Expense</Button>
      </div>
    </form>
  );
}
