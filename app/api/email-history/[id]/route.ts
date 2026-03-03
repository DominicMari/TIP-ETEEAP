import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const TABLE = 'email_logs';

export async function GET(_req: NextRequest, context: { params: { id: string } }) {
  const { params } = context;
  const supabase = createRouteHandlerClient({ cookies });
  const id = Number(params.id);

  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, recipient, subject, status, created_at, sender, error_details, body')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('GET /api/email-history/[id] error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
