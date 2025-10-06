'use client';

import { useState } from 'react';
import { useContactsQuery } from '@/hooks/queries/useContactsQuery';
import { useContactMutations } from '@/hooks/mutations/useContactMutations';
import { Contact } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, ChevronDown, Loader2 } from 'lucide-react';

interface ContactFormProps {
  contact?: Contact | null;
  onClose: () => void;
}

export function ContactForm({ contact, onClose }: ContactFormProps) {
  const { data: contacts = [] } = useContactsQuery();
  const { addContact, updateContact } = useContactMutations();
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [formData, setFormData] = useState({
    firstName: contact?.firstName || '',
    lastName: contact?.lastName || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    type: contact?.type || 'customer' as 'customer' | 'supplier',
    company: contact?.company || '',
    notes: contact?.notes || '',
    tags: contact?.tags?.join(', ') || '',
    address: {
      street: contact?.address?.street || '',
      city: contact?.address?.city || '',
      state: contact?.address?.state || '',
      zipCode: contact?.address?.zipCode || '',
      country: contact?.address?.country || '',
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';

    // Duplicate email check (only for new contacts)
    if (!contact) {
      const existingContact = contacts.find(c => c.email.toLowerCase() === formData.email.toLowerCase());
      if (existingContact) {
        newErrors.email = 'A contact with this email already exists';
      }
    }

    // Address validation: all or nothing
    const hasAnyAddress = Object.values(formData.address).some(v => v.trim());
    if (hasAnyAddress) {
      if (!formData.address.city.trim()) newErrors.address = 'City is required when address is provided';
      if (!formData.address.state.trim()) newErrors.address = 'State is required when address is provided';
      if (!formData.address.country.trim()) newErrors.address = 'Country is required when address is provided';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      // Prepare contact data
      const contactData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        type: formData.type,
        company: formData.company.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        address: hasAnyAddress ? {
          street: formData.address.street.trim(),
          city: formData.address.city.trim(),
          state: formData.address.state.trim(),
          zipCode: formData.address.zipCode.trim(),
          country: formData.address.country.trim(),
        } : undefined,
      };

      if (contact) {
        // Update existing contact
        await updateContact.mutateAsync({ id: contact.id, updates: contactData });
      } else {
        // Add new contact
        await addContact.mutateAsync(contactData);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save contact:', error);
      setErrors({ submit: 'Failed to save contact. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
    if (errors.address) {
      setErrors(prev => ({ ...prev, address: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {contact ? 'Edit Contact' : 'Add New Contact'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className={errors.firstName ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className={errors.lastName ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={errors.email ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Contact Type</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value as 'customer' | 'supplier')}
                className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="customer">Customer</option>
                <option value="supplier">Supplier</option>
              </select>
            </div>
          </div>

          {/* Advanced Details - Collapsible */}
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center w-full py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Advanced Details
              <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            {showAdvanced && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    type="text"
                    placeholder="e.g., VIP, corporate, frequent"
                    value={formData.tags}
                    onChange={(e) => handleChange('tags', e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Address */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium text-sm text-gray-900">Address</h4>

                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      type="text"
                      value={formData.address.street}
                      onChange={(e) => handleAddressChange('street', e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        type="text"
                        value={formData.address.city}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        type="text"
                        value={formData.address.state}
                        onChange={(e) => handleAddressChange('state', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        type="text"
                        value={formData.address.zipCode}
                        onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        type="text"
                        value={formData.address.country}
                        onChange={(e) => handleAddressChange('country', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {errors.address && (
                    <p className="text-sm text-red-600">{errors.address}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || syncStatus === 'syncing'}>
              {loading || syncStatus === 'syncing' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                contact ? 'Update Contact' : 'Add Contact'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
