import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { Contact } from '@/types';

function dbRowToContact(row: any): Contact {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone || '',
    address: row.address || '',
    notes: row.notes || '',
    createdAt: new Date(row.created_at),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const { contactId } = params;

    // Note: We're allowing contact fetching with any valid token
    // In a production app, you might want to validate the token has access to this contact
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 401 }
      );
    }

    // Fetch contact from Supabase using admin client (bypasses RLS)
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    const contact = dbRowToContact(data);
    return NextResponse.json({ contact });
  } catch (error) {
    console.error('[Client Contact API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
