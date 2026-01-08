'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContactsQuery } from '@/hooks/queries/useContactsQuery';
import { useContactMutations } from '@/hooks/mutations/useContactMutations';
import { useQuotesByContactQuery } from '@/hooks/queries/useQuotesQuery';
import { useInvoicesByCustomerQuery } from '@/hooks/queries/useInvoicesQuery';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ContactForm } from '@/components/contacts/ContactForm';
import { Contact } from '@/types';
import {
  Users,
  Search,
  Plus,
  Filter,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Receipt,
  Star,
  MessageSquare,
  Eye,
  Edit,
  MoreHorizontal,
  Heart,
  Award,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function ContactsPage() {
  // React Query hooks
  const { data: contacts = [], isLoading, error, refetch } = useContactsQuery();
  const { addContact, updateContact, deleteContact } = useContactMutations();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Get quotes and invoices for selected contact
  const { data: contactQuotes = [] } = useQuotesByContactQuery(selectedContact?.id);
  const { data: contactInvoices = [] } = useInvoicesByCustomerQuery(selectedContact?.id);

  // Filter contacts based on search query and active tab
  const filteredContacts = useMemo(() => {
    // 1. Filter by contact type (customer vs supplier)
    let filtered = contacts.filter(contact => {
      if (activeTab === 'customers') {
        return contact.type !== 'supplier'; // default to customer if type is missing
      } else {
        return contact.type === 'supplier';
      }
    });

    // 2. Filter by search query
    if (!searchQuery.trim()) return filtered;

    const query = searchQuery.toLowerCase();
    return filtered.filter(contact =>
      contact.name.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query) ||
      contact.phone?.toLowerCase().includes(query) ||
      contact.company?.toLowerCase().includes(query) ||
      contact.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [contacts, searchQuery, activeTab]);

  useEffect(() => {
    console.log('[ContactsPage] Contacts loaded:', {
      totalContacts: contacts.length,
      searchQuery,
      filtered: filteredContacts.length
    });
  }, [contacts.length, searchQuery, filteredContacts.length]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getCustomerValue = (contactId: string) => {
    // Only count paid invoices as actual customer value
    return contactInvoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((total, invoice) => total + invoice.total, 0);
  };

  const getCustomerOutstanding = (contactId: string) => {
    // Calculate outstanding amount from unpaid invoices
    return contactInvoices
      .filter(invoice => invoice.status !== 'paid' && invoice.status !== 'cancelled')
      .reduce((total, invoice) => total + invoice.remainingAmount, 0);
  };

  const getCustomerBookings = (contactId: string) => {
    return contactQuotes.filter(quote => quote.status === 'accepted').length;
  };

  const getLastBookingDate = (contactId: string) => {
    const acceptedQuotes = contactQuotes.filter(quote => quote.status === 'accepted');
    if (acceptedQuotes.length === 0) return null;

    const latest = acceptedQuotes.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    return latest.createdAt;
  };

  const getCustomerTier = (value: number) => {
    if (value >= 10000) return { tier: 'Platinum', color: 'text-purple-600', icon: Award };
    if (value >= 5000) return { tier: 'Gold', color: 'text-yellow-600', icon: Star };
    if (value >= 2000) return { tier: 'Silver', color: 'text-gray-600', icon: Heart };
    return { tier: 'Bronze', color: 'text-orange-600', icon: Users };
  };

  const handleContactSelect = (contact: Contact) => {
    console.log('[ContactsPage] Contact selected:', contact.id, contact.firstName, contact.lastName);
    setSelectedContact(contact);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setSelectedContact(null);
    setViewMode('list');
  };

  const handleAddContact = () => {
    setEditingContact(null);
    setShowContactForm(true);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setShowContactForm(true);
  };

  const handleFormClose = () => {
    setShowContactForm(false);
    setEditingContact(null);
  };

  // Customer 360 view component
  const Customer360View = ({ contact }: { contact: Contact }) => {
    const totalValue = getCustomerValue(contact.id);
    const outstandingAmount = getCustomerOutstanding(contact.id);
    const totalBookings = getCustomerBookings(contact.id);
    const lastBooking = getLastBookingDate(contact.id);
    const tierInfo = getCustomerTier(totalValue);

    const acceptedQuotes = contactQuotes.filter(q => q.status === 'accepted');
    const pendingQuotes = contactQuotes.filter(q => q.status === 'sent');
    const paidInvoices = contactInvoices.filter(i => i.status === 'paid');
    const outstandingInvoices = contactInvoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled');

    return (
      <div className="space-y-6">
        {/* Customer Header */}
        <div className="bg-white dark:bg-clio-gray-900 rounded-2xl border border-clio-gray-200 dark:border-clio-gray-800 p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-clio-blue rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg">
                {contact.firstName[0]}{contact.lastName[0]}
              </div>
              <div>
                <h2 className="text-3xl font-black text-clio-gray-900 dark:text-white tracking-tight">
                  {contact.firstName} {contact.lastName}
                </h2>
                <div className="flex flex-wrap items-center gap-6 mt-3">
                  <div className="flex items-center text-clio-gray-600 dark:text-clio-gray-400 font-medium">
                    <Mail className="w-4 h-4 mr-2 text-clio-blue" />
                    {contact.email}
                  </div>
                  {contact.phone && (
                    <div className="flex items-center text-clio-gray-600 dark:text-clio-gray-400 font-medium">
                      <Phone className="w-4 h-4 mr-2 text-clio-blue" />
                      {contact.phone}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <Badge className={`${tierInfo.color} bg-clio-gray-50 dark:bg-clio-gray-800 border border-clio-gray-100 dark:border-clio-gray-700 flex items-center gap-1.5 shadow-none text-[10px] uppercase font-bold tracking-widest px-3 py-1`}>
                    <tierInfo.icon className="w-3.5 h-3.5" />
                    {tierInfo.tier} Customer
                  </Badge>
                  <Badge variant="secondary" className="bg-clio-blue/10 text-clio-blue border-transparent text-[10px] uppercase font-bold tracking-widest px-3 py-1">
                    {totalBookings} Bookings
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" className="flex-1 md:flex-none border-clio-gray-200 dark:border-clio-gray-800 font-bold uppercase tracking-tight text-xs h-11">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </Button>
              <Button variant="outline" className="flex-1 md:flex-none border-clio-gray-200 dark:border-clio-gray-800 font-bold uppercase tracking-tight text-xs h-11" onClick={() => handleEditContact(contact)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button className="flex-1 md:flex-none bg-clio-blue hover:bg-clio-blue-hover text-white font-bold uppercase tracking-tight text-xs h-11">
                <Plus className="w-4 h-4 mr-2" />
                New Quote
              </Button>
            </div>
          </div>
        </div>

        {/* Customer Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-clio-gray-100 dark:border-clio-gray-800 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-clio-gray-50/30 dark:bg-clio-gray-800/10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400">Lifetime Value</CardTitle>
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalValue)}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-400 mt-1">
                From paid invoices
              </p>
            </CardContent>
          </Card>

          <Card className="border-clio-gray-100 dark:border-clio-gray-800 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-clio-gray-50/30 dark:bg-clio-gray-800/10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400">Outstanding</CardTitle>
              <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20">
                <Receipt className="h-3.5 w-3.5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className={`text-2xl font-black ${outstandingAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-clio-gray-400'}`}>
                {formatCurrency(outstandingAmount)}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-400 mt-1">
                Unpaid invoices
              </p>
            </CardContent>
          </Card>

          <Card className="border-clio-gray-100 dark:border-clio-gray-800 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-clio-gray-50/30 dark:bg-clio-gray-800/10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400">Total Bookings</CardTitle>
              <div className="p-1.5 rounded-lg bg-clio-blue/10">
                <Calendar className="h-3.5 w-3.5 text-clio-blue" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-black text-clio-gray-900 dark:text-white">
                {totalBookings}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-400 mt-1">
                Accepted quotes
              </p>
            </CardContent>
          </Card>

          <Card className="border-clio-gray-100 dark:border-clio-gray-800 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-clio-gray-50/30 dark:bg-clio-gray-800/10">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-clio-gray-500 dark:text-clio-gray-400">Last Booking</CardTitle>
              <div className="p-1.5 rounded-lg bg-clio-navy/10">
                <TrendingUp className="h-3.5 w-3.5 text-clio-navy dark:text-clio-gray-300" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-xl font-bold text-clio-gray-900 dark:text-white">
                {lastBooking ? new Date(lastBooking).toLocaleDateString() : 'Never'}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-400 mt-1">
                Last activity date
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Booking History and Communications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {acceptedQuotes.slice(0, 5).map((quote) => (
                  <div key={quote.id} className="flex items-center justify-between p-3 border border-clio-gray-100 dark:border-clio-gray-800 rounded-lg hover:bg-clio-gray-50 dark:hover:bg-clio-gray-800/50 transition-colors">
                    <div>
                      <div className="font-bold text-clio-gray-900 dark:text-white">{quote.title}</div>
                      <div className="text-xs font-medium text-clio-gray-500 dark:text-clio-gray-400">
                        {new Date(quote.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-clio-gray-900 dark:text-white">{formatCurrency(quote.totalCost)}</div>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tight border-clio-gray-200 dark:border-clio-gray-700">
                        {quote.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {acceptedQuotes.length === 0 && (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    No bookings yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paidInvoices.slice(0, 5).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 border border-clio-gray-100 dark:border-clio-gray-800 rounded-lg hover:bg-clio-gray-50 dark:hover:bg-clio-gray-800/50 transition-colors">
                    <div>
                      <div className="font-bold text-clio-gray-900 dark:text-white">#{invoice.invoiceNumber}</div>
                      <div className="text-xs font-medium text-clio-gray-500 dark:text-clio-gray-400">
                        Paid: {new Date(invoice.payments[0]?.processedDate || invoice.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(invoice.total)}</div>
                      <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-[10px] uppercase font-bold tracking-tight">
                        Paid
                      </Badge>
                    </div>
                  </div>
                ))}
                {paidInvoices.length === 0 && (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    No payments yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Outstanding Items */}
        {(pendingQuotes.length > 0 || outstandingInvoices.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pendingQuotes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-orange-600">Pending Quotes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingQuotes.map((quote) => (
                      <div key={quote.id} className="flex items-center justify-between p-3 border border-amber-200 dark:border-amber-900/50 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                        <div>
                          <div className="font-bold text-amber-900 dark:text-amber-100">{quote.title}</div>
                          <div className="text-xs font-medium text-amber-700 dark:text-amber-400">
                            Sent: {new Date(quote.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-amber-900 dark:text-white">{formatCurrency(quote.totalCost)}</div>
                          <Button size="sm" variant="outline" className="mt-1 h-7 text-[10px] border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30">
                            Follow Up
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {outstandingInvoices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Outstanding Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {outstandingInvoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 border border-red-200 dark:border-red-900/50 rounded-lg bg-red-50 dark:bg-red-900/20">
                        <div>
                          <div className="font-bold text-red-900 dark:text-red-100">#{invoice.invoiceNumber}</div>
                          <div className="text-xs font-medium text-red-700 dark:text-red-400">
                            Due: {new Date(invoice.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-600 dark:text-red-400">{formatCurrency(invoice.remainingAmount)}</div>
                          <Button size="sm" variant="outline" className="mt-1 h-7 text-[10px] border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30">
                            Send Reminder
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          {viewMode === 'detail' && selectedContact ? (
            <>
              <div className="flex items-center mb-6">
                <Button variant="ghost" onClick={handleBackToList} className="mr-4 text-clio-gray-500 hover:text-clio-blue">
                  ← Back to Contacts
                </Button>
                <h1 className="text-3xl font-bold text-clio-gray-900 dark:text-white">Customer Profile</h1>
              </div>
              <Customer360View contact={selectedContact} />
            </>
          ) : (
            <>
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div>
                  <h1 className="text-3xl font-black text-clio-gray-900 dark:text-white uppercase tracking-tighter">
                    {activeTab === 'customers' ? 'Relationship' : 'Supplier'} <span className="text-clio-blue">Center</span>
                  </h1>
                  <p className="text-clio-gray-500 dark:text-clio-gray-400 mt-2 font-bold uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    {activeTab === 'customers' ? 'Manage your travel clients and build lasting relationships' : 'Manage your travel suppliers and vendor partnerships'}
                  </p>
                </div>

                <Button
                  className="mt-4 md:mt-0 bg-clio-blue hover:bg-clio-blue-hover text-white shadow-sm"
                  onClick={handleAddContact}
                  disabled={isLoading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="border-clio-gray-100 dark:border-clio-gray-800 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-clio-gray-500 dark:text-clio-gray-400">
                      Total {activeTab === 'customers' ? 'Contacts' : 'Suppliers'}
                    </CardTitle>
                    <div className="p-2 rounded-xl bg-clio-blue/10">
                      <Users className="h-4 w-4 text-clio-blue" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-clio-gray-900 dark:text-white">
                      {activeTab === 'customers' ? contacts.filter(c => c.type !== 'supplier').length : contacts.filter(c => c.type === 'supplier').length}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-clio-gray-100 dark:border-clio-gray-800 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-clio-gray-500 dark:text-clio-gray-400">
                      {activeTab === 'customers' ? 'Active Customers' : 'Active Partnerships'}
                    </CardTitle>
                    <div className="p-2 rounded-xl bg-clio-navy/10">
                      <TrendingUp className="h-4 w-4 text-clio-navy dark:text-clio-gray-300" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-clio-gray-900 dark:text-white">
                      {contacts.filter(c => {
                        const isCorrectType = activeTab === 'customers' ? c.type !== 'supplier' : c.type === 'supplier';
                        return isCorrectType && getCustomerBookings(c.id) > 0;
                      }).length}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-clio-gray-100 dark:border-clio-gray-800 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-clio-gray-500 dark:text-clio-gray-400">
                      {activeTab === 'customers' ? 'Total Revenue' : 'Total Settlement'}
                    </CardTitle>
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(contacts.filter(c => activeTab === 'customers' ? c.type !== 'supplier' : c.type === 'supplier').reduce((sum, c) => sum + getCustomerValue(c.id), 0))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-clio-gray-100 dark:border-clio-gray-800 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-clio-gray-500 dark:text-clio-gray-400">
                      {activeTab === 'customers' ? 'Avg Customer Value' : 'Avg Supplier Volume'}
                    </CardTitle>
                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                      <Award className="h-4 w-4 text-amber-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-clio-gray-900 dark:text-white">
                      {formatCurrency(
                        contacts.filter(c => activeTab === 'customers' ? c.type !== 'supplier' : c.type === 'supplier').length > 0
                          ? contacts.filter(c => activeTab === 'customers' ? c.type !== 'supplier' : c.type === 'supplier').reduce((sum, c) => sum + getCustomerValue(c.id), 0) / contacts.filter(c => activeTab === 'customers' ? c.type !== 'supplier' : c.type === 'supplier').length
                          : 0
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Error State */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Failed to load contacts</h3>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {error instanceof Error ? error.message : 'There was an error loading your contacts. Please try again.'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => refetch()}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              )}

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                <div className="flex bg-clio-gray-100/80 dark:bg-clio-gray-900/50 p-1 rounded-xl w-full sm:w-auto border border-clio-gray-200 dark:border-clio-gray-800 shadow-sm">
                  <button 
                    onClick={() => setActiveTab('customers')}
                    className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
                      activeTab === 'customers' 
                      ? "bg-white dark:bg-clio-gray-800 text-clio-blue shadow-sm" 
                      : "text-clio-gray-500 hover:text-clio-gray-700 dark:hover:text-clio-gray-300"
                    }`}
                  >
                    Customers
                  </button>
                  <button 
                    onClick={() => setActiveTab('suppliers')}
                    className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
                      activeTab === 'suppliers' 
                      ? "bg-white dark:bg-clio-gray-800 text-clio-blue shadow-sm" 
                      : "text-clio-gray-500 hover:text-clio-gray-700 dark:hover:text-clio-gray-300"
                    }`}
                  >
                    Suppliers
                  </button>
                </div>

                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-clio-gray-400 w-4 h-4" />
                  <Input
                    placeholder={activeTab === 'customers' ? "Search customers by name, email..." : "Search suppliers by name, company..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 bg-white dark:bg-clio-gray-900 border-clio-gray-200 dark:border-clio-gray-800 rounded-xl font-bold text-sm shadow-sm"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Contacts List */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-clio-gray-900 dark:text-white uppercase tracking-tight">
                    {activeTab === 'customers' ? 'Active Customers' : 'Global Suppliers'} ({filteredContacts.length})
                  </h2>
                </div>
                
                {!isLoading && filteredContacts.length === 0 ? (
                  <div className="bg-white dark:bg-clio-gray-900 rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 p-16 text-center shadow-sm">
                    <Users className="w-16 h-16 text-clio-gray-200 dark:text-clio-gray-800 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-clio-gray-900 dark:text-white mb-2">No contacts found</h3>
                    <p className="text-clio-gray-600 dark:text-clio-gray-400 font-medium">
                      {searchQuery ? 'Try adjusting your search criteria.' : 'Add your first contact to get started.'}
                    </p>
                  </div>
                ) : isLoading ? (
                  <div className="bg-white dark:bg-clio-gray-900 rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 p-16 text-center shadow-sm">
                    <Loader2 className="w-12 h-12 animate-spin text-clio-blue mx-auto mb-4" />
                    <p className="text-clio-gray-600 dark:text-clio-gray-400 font-bold uppercase tracking-widest text-xs">Loading your contacts...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredContacts.map((contact) => {
                      const totalValue = getCustomerValue(contact.id);
                      const totalBookings = getCustomerBookings(contact.id);
                      const tierInfo = getCustomerTier(totalValue);
                      const lastBooking = getLastBookingDate(contact.id);

                      return (
                        <Card key={contact.id} className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden border-clio-gray-100 dark:border-clio-gray-800" onClick={() => handleContactSelect(contact)}>
                          <CardContent className="p-0">
                            <div className="p-6 bg-clio-gray-50/50 dark:bg-clio-gray-800/20 border-b border-clio-gray-100 dark:border-clio-gray-800">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-clio-blue rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                    {contact.firstName[0]}{contact.lastName[0]}
                                  </div>
                                  <div>
                                    <div className="font-bold text-clio-gray-900 dark:text-white text-lg">
                                      {contact.firstName} {contact.lastName}
                                    </div>
                                    <div className="text-xs font-medium text-clio-gray-500 dark:text-clio-gray-400">{contact.email}</div>
                                  </div>
                                </div>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-clio-gray-400 hover:text-clio-blue" onClick={(e) => {
                                  e.stopPropagation();
                                  handleContactSelect(contact);
                                }}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="p-6 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-400">
                                    {activeTab === 'customers' ? 'Value' : 'Settlement'}
                                  </span>
                                  <div className="font-bold text-emerald-600 dark:text-emerald-400 text-lg leading-none">
                                    {formatCurrency(totalValue)}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-400">
                                    {activeTab === 'customers' ? 'Bookings' : 'Orders'}
                                  </span>
                                  <div className="font-bold text-clio-gray-900 dark:text-white text-lg leading-none">{totalBookings}</div>
                                </div>
                              </div>
                              
                              <div className="pt-3 border-t border-clio-gray-50 dark:border-clio-gray-800/50 flex justify-between items-center">
                                <span className="text-[10px] font-bold uppercase tracking-tight text-clio-gray-400">
                                  {activeTab === 'customers' ? 'Last Booking' : 'Last Fulfilled'}
                                </span>
                                <span className="text-xs font-bold text-clio-gray-700 dark:text-clio-gray-300">{lastBooking ? new Date(lastBooking).toLocaleDateString() : 'Never'}</span>
                              </div>
                            </div>

                            <div className="px-6 py-4 bg-white dark:bg-clio-gray-900 flex items-center justify-between border-t border-clio-gray-100 dark:border-clio-gray-800">
                              <Badge className={`${tierInfo.color} bg-clio-gray-50 dark:bg-clio-gray-800/50 border border-clio-gray-100 dark:border-clio-gray-800 flex items-center gap-1 shadow-none text-[10px] uppercase font-bold tracking-tight px-2 py-0.5`}>
                                <tierInfo.icon className="w-3 h-3" />
                                {tierInfo.tier}
                              </Badge>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-clio-gray-400 hover:text-clio-blue">
                                  <Mail className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-clio-gray-400 hover:text-clio-blue">
                                  <Phone className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Contact Form Modal */}
          {showContactForm && (
            <ContactForm
              contact={editingContact}
              onClose={handleFormClose}
            />
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}