export const config = { runtime: 'edge' };

const ALLOWED_HOSTS = new Set([
  'docs.google.com',
  'script.google.com',
  'script.googleusercontent.com',
  'googleusercontent.com'
]);

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,OPTIONS',
    'access-control-allow-headers': 'content-type'
  };
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    if (!url) {
      return new Response(JSON.stringify({ error: 'Missing url param' }), { status: 400, headers: { 'content-type': 'application/json', ...corsHeaders() } });
    }
    const u = new URL(url);
    if (!ALLOWED_HOSTS.has(u.hostname)) {
      return new Response(JSON.stringify({ error: 'Host not allowed' }), { status: 400, headers: { 'content-type': 'application/json', ...corsHeaders() } });
    }
    const upstream = await fetch(u.toString(), { cache: 'no-store' });
    const body = await upstream.arrayBuffer();
    const headers = new Headers(upstream.headers);
    headers.set('access-control-allow-origin', '*');
    headers.set('cache-control', 's-maxage=60, stale-while-revalidate=300');
    return new Response(body, { status: upstream.status, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { 'content-type': 'application/json', ...corsHeaders() } });
  }
}