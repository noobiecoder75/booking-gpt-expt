import { useQuery } from '@tanstack/react-query';
import { TravelQuote, Contact } from '@/types';

interface ClientQuoteResponse {
  quote: TravelQuote;
}

interface ClientContactResponse {
  contact: Contact;
}

async function fetchClientQuote(
  quoteId: string,
  token: string
): Promise<TravelQuote> {
  const response = await fetch(
    `/api/client/quotes/${quoteId}?token=${encodeURIComponent(token)}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch quote');
  }

  const data: ClientQuoteResponse = await response.json();
  return data.quote;
}

async function fetchClientContact(
  contactId: string,
  token: string
): Promise<Contact> {
  const response = await fetch(
    `/api/client/contacts/${contactId}?token=${encodeURIComponent(token)}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch contact');
  }

  const data: ClientContactResponse = await response.json();
  return data.contact;
}

export function useClientQuoteQuery(quoteId: string, token: string | null) {
  return useQuery({
    queryKey: ['clientQuote', quoteId, token],
    queryFn: () => fetchClientQuote(quoteId, token!),
    enabled: !!token && !!quoteId,
    retry: false,
  });
}

export function useClientContactQuery(
  contactId: string | undefined,
  token: string | null
) {
  return useQuery({
    queryKey: ['clientContact', contactId, token],
    queryFn: () => fetchClientContact(contactId!, token!),
    enabled: !!token && !!contactId,
    retry: false,
  });
}
