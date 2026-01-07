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
  onSuccess?: (contactId: string) => void;
}

export function ContactForm({ contact, onClose, onSuccess }: ContactFormProps) {
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
        const newContactId = await addContact.mutateAsync(contactData);
        if (onSuccess) {
          onSuccess(newContactId);
        }
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
    <div className="fixed inset-0 bg-clio-navy/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-clio-gray-950 rounded-2xl w-full max-w-2xl shadow-strong max-h-[90vh] overflow-hidden flex flex-col border border-clio-gray-200 dark:border-clio-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-clio-gray-50 dark:bg-clio-gray-900/50 flex items-center justify-between p-8 border-b border-clio-gray-100 dark:border-clio-gray-800 z-10">
          <div>
            <h2 className="text-xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">
              {contact ? 'Edit Contact' : 'Add New Contact'}
            </h2>
            <p className="text-[10px] font-black text-clio-gray-400 uppercase tracking-widest mt-1">Manage relationship details</p>
          </div>
          <button 
            onClick={onClose} 
            disabled={loading}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-clio-gray-100 dark:hover:bg-clio-gray-800 transition-colors text-clio-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-10 overflow-y-auto">
          {/* Error Message */}
          {errors.submit && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Identity Details</h3>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">First Name *</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className={`h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold ${errors.firstName ? 'border-red-500' : ''}`}
                  disabled={loading}
                />
                {errors.firstName && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 ml-1">{errors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Last Name *</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className={`h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold ${errors.lastName ? 'border-red-500' : ''}`}
                  disabled={loading}
                />
                {errors.lastName && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 ml-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold ${errors.email ? 'border-red-500' : ''}`}
                  disabled={loading}
                />
                {errors.email && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 ml-1">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Contact Type</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value as 'customer' | 'supplier')}
                className="w-full h-12 px-4 bg-clio-gray-50 dark:bg-clio-gray-900 border border-clio-gray-200 dark:border-clio-gray-800 rounded-xl focus:ring-2 focus:ring-clio-blue/20 transition-all font-bold uppercase tracking-tight text-[10px]"
                disabled={loading}
              >
                <option value="customer">Customer</option>
                <option value="supplier">Supplier</option>
              </select>
            </div>
          </div>

          {/* Advanced Details - Collapsible */}
          <div className="pt-6 border-t border-clio-gray-100 dark:border-clio-gray-800">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full py-4 px-6 rounded-xl bg-clio-gray-50 dark:bg-clio-gray-900/50 hover:bg-clio-gray-100 dark:hover:bg-clio-gray-900 transition-colors group"
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-clio-gray-500 group-hover:text-clio-gray-900 dark:group-hover:text-white transition-colors">Advanced Information</span>
              <ChevronDown className={`h-4 w-4 text-clio-gray-400 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            {showAdvanced && (
              <div className="space-y-8 mt-10 px-2 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Company / Organization</Label>
                    <Input
                      id="company"
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleChange('company', e.target.value)}
                      className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Relationship Tags</Label>
                    <Input
                      id="tags"
                      type="text"
                      placeholder="e.g., VIP, corporate, frequent"
                      value={formData.tags}
                      onChange={(e) => handleChange('tags', e.target.value)}
                      className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Internal Auditor Notes</Label>
                  <Textarea
                    id="notes"
                    rows={4}
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    className="rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                    disabled={loading}
                  />
                </div>

                {/* Address */}
                <div className="space-y-6 pt-10 border-t border-clio-gray-100 dark:border-clio-gray-800">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Physical Address</h4>

                  <div className="space-y-2">
                    <Label htmlFor="street" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Street Address</Label>
                    <Input
                      id="street"
                      type="text"
                      value={formData.address.street}
                      onChange={(e) => handleAddressChange('street', e.target.value)}
                      className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">City</Label>
                      <Input
                        id="city"
                        type="text"
                        value={formData.address.city}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                        className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">State / Province</Label>
                      <Input
                        id="state"
                        type="text"
                        value={formData.address.state}
                        onChange={(e) => handleAddressChange('state', e.target.value)}
                        className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">ZIP / Postal Code</Label>
                      <Input
                        id="zipCode"
                        type="text"
                        value={formData.address.zipCode}
                        onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                        className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 ml-1">Country</Label>
                      <Input
                        id="country"
                        type="text"
                        value={formData.address.country}
                        onChange={(e) => handleAddressChange('country', e.target.value)}
                        className="h-12 rounded-xl bg-clio-gray-50/50 dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 font-bold"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {errors.address && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 ml-1">{errors.address}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-10 border-t border-clio-gray-100 dark:border-clio-gray-800">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading}
              className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel Request
            </button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-clio-blue hover:bg-clio-blue/90 text-white font-black uppercase tracking-widest h-12 px-8 rounded-xl shadow-lg shadow-clio-blue/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                  Processing...
                </>
              ) : (
                contact ? 'Update Record' : 'Create Contact'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
