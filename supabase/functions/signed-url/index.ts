import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const R2_ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID') || '';
const R2_PUBLIC_DOMAIN = Deno.env.get('R2_PUBLIC_DOMAIN') || '';

serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get('Authorization');
    const { beatId, fileType } = await req.json();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch beat details
    const { data: beat, error: beatErr } = await supabase
      .from('beats')
      .select('*')
      .eq('id', beatId)
      .single();

    if (beatErr || !beat) {
      return new Response(JSON.stringify({ error: 'Beat not found' }), { status: 404 });
    }

    // Determine target key: free / guest gets preview_tagged_key, Plus gets preview_clean_key
    let key = beat.preview_tagged_key;
    if (fileType === 'clean') {
      key = beat.preview_clean_key || beat.preview_tagged_key;
    }

    // Generate signed/direct URL from Cloudflare R2
    const streamingUrl = R2_PUBLIC_DOMAIN
      ? `https://${R2_PUBLIC_DOMAIN}/${key}`
      : `/api/audio-mock/${beatId}`;

    return new Response(
      JSON.stringify({
        url: streamingUrl,
        expiresIn: 3600
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
