import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

const TABLE = 'email_logs';

function parsePagination(searchParams: URLSearchParams) {
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  return { limit: Number.isNaN(limit) ? 50 : limit, offset: Number.isNaN(offset) ? 0 : offset };
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const { searchParams } = new URL(req.url);

  const status = searchParams.get('status');
  const recipient = searchParams.get('recipient');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const sort = searchParams.get('sort') || 'created_at';
  const direction = (searchParams.get('direction') || 'desc').toLowerCase() === 'asc';
  const { limit, offset } = parsePagination(searchParams);

  try {
    let query = supabase
      .from(TABLE)
      .select('id, recipient, subject, status, created_at, sender, error_details', { count: 'exact' })
      .order(sort, { ascending: direction })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }
    if (recipient) {
      query = query.ilike('recipient', `%${recipient}%`);
    }
    if (from) {
      query = query.gte('created_at', from);
    }
    if (to) {
      query = query.lte('created_at', to);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data: data || [], count: count ?? data?.length ?? 0, limit, offset });
  } catch (error: any) {
    console.error('GET /api/email-history error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}