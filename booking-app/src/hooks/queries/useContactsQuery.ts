import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Contact, Address, TravelPreferences } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';

type ContactRow = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  type: 'customer' | 'supplier';
  company: string | null;
  notes: string | null;
  tags: string[] | null;
  address: any | null;
  preferences: any | null;
  created_at: string;
};

function dbRowToContact(row: ContactRow): Contact {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    name: `${row.first_name} ${row.last_name}`,
    email: row.email,
    phone: row.phone || undefined,
    type: row.type as 'customer' | 'supplier' | undefined,
    address: row.address as Address | undefined,
    preferences: row.preferences as TravelPreferences | undefined,
    company: row.company || undefined,
    notes: row.notes || undefined,
    tags: row.tags || undefined,
    quotes: [],
    createdAt: new Date(row.created_at),
  };
}

async function fetchContacts(): Promise<Contact[]> {
  const supabase = getSupabaseBrowserClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(dbRowToContact);
}

export function useContactsQuery() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contacts', user?.id],
    queryFn: fetchContacts,
    enabled: !!user,
  });
}

export function useContactByIdQuery(contactId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['contacts', user?.id, contactId],
    queryFn: async () => {
      // Try to get from cache first
      const contacts = queryClient.getQueryData<Contact[]>(['contacts', user?.id]);
      if (contacts) {
        const contact = contacts.find(c => c.id === contactId);
        if (contact) return contact;
      }

      // Fetch from server if not in cache
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (error) throw error;
      return dbRowToContact(data);
    },
    enabled: !!user && !!contactId,
  });
}
