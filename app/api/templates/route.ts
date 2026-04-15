import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

const TABLE = 'email_templates';

function parsePagination(searchParams: URLSearchParams) {
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  return { limit: Number.isNaN(limit) ? 50 : limit, offset: Number.isNaN(offset) ? 0 : offset };
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const { searchParams } = new URL(req.url);

  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'created_at';
  const direction = (searchParams.get('direction') || 'desc').toLowerCase() === 'asc';
  const { limit, offset } = parsePagination(searchParams);

  try {
    let query = supabase
      .from(TABLE)
      .select('*', { count: 'exact' })
      .order(sort, { ascending: direction })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data: data || [], limit, offset });
  } catch (error: any) {
    console.error('GET /api/templates error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  try {
    const { name, subject, content } = await req.json();

    if (!name?.trim() || !subject?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Name, subject, and content are required.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from(TABLE)
      .insert({ name: name.trim(), subject: subject.trim(), content })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Template name must be unique.' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/templates error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create template' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Template id is required.' }, { status: 400 });
  }

  try {
    const { name, subject, content } = await req.json();

    if (![name, subject, content].some((v) => typeof v === 'string')) {
      return NextResponse.json({ error: 'At least one of name, subject, or content is required.' }, { status: 400 });
    }

    const updates: Record<string, string> = {};
    if (typeof name === 'string') updates.name = name.trim();
    if (typeof subject === 'string') updates.subject = subject.trim();
    if (typeof content === 'string') updates.content = content;

    const { error: updateError } = await supabase
      .from(TABLE)
      .update(updates)
      .eq('id', Number(id));

    if (updateError) {
      if (updateError.code === '23505') {
        return NextResponse.json({ error: 'Template name must be unique.' }, { status: 409 });
      }
      throw updateError;
    }

    const { data, error: selectError } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', Number(id))
      .single();

    if (selectError) throw selectError;

    if (!data) {
      return NextResponse.json({ error: 'Template not found.' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('PATCH /api/templates error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Template id is required.' }, { status: 400 });
  }

  try {
    const { error } = await supabase.from(TABLE).delete().eq('id', Number(id));
    if (error) throw error;
    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error: any) {
    console.error('DELETE /api/templates error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete template' }, { status: 500 });
  }
}