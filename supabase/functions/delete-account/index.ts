import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

type SupabaseKeyMapVariable = 'SUPABASE_PUBLISHABLE_KEYS' | 'SUPABASE_SECRET_KEYS';

function getSupabaseKey(variable: SupabaseKeyMapVariable, name = 'default') {
  const rawKeys = Deno.env.get(variable);
  if (!rawKeys) return null;

  try {
    const keys: unknown = JSON.parse(rawKeys);
    if (!keys || typeof keys !== 'object' || Array.isArray(keys)) return null;

    const key = (keys as Record<string, unknown>)[name];
    return typeof key === 'string' && key.length > 0 ? key : null;
  } catch {
    return null;
  }
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const authorization = request.headers.get('Authorization');
  if (!authorization) return json(401, { error: 'Authentication required' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const publishableKey = getSupabaseKey('SUPABASE_PUBLISHABLE_KEYS');
  const secretKey = getSupabaseKey('SUPABASE_SECRET_KEYS');
  if (!supabaseUrl || !publishableKey || !secretKey) return json(503, { error: 'Account service unavailable' });

  const caller = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: userError } = await caller.auth.getUser();
  if (userError || !user) return json(401, { error: 'Authentication required' });

  const admin = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: deletionError } = await admin.auth.admin.deleteUser(user.id);
  if (deletionError) return json(500, { error: 'Could not delete the account' });

  return json(200, { deleted: true });
});
