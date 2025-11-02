import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {

  const supabase = createSupabaseServerClient();

  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error listing users:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(users);
}