// index.js – Proxy para Discord OAuth (Cloudflare Worker)
export default {
  async fetch(request, env, ctx) {
    const DISCORD_API_BASE = 'https://discord.com/api';
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    };

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Página de status (JSON)
    if (path === '/' || path === '/status') {
      return new Response(
        JSON.stringify(
          {
            success: true,
            message: 'Discord OAuth Proxy Online',
            version: '1.0.0',
            endpoints: ['POST /token', 'GET /users/@me']
          },
          null,
          2
        ),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Roteamento
    let targetPath = '';
    if (path === '/token') targetPath = '/oauth2/token';
    else if (path === '/users/@me') targetPath = '/users/@me';
    else {
      return new Response(
        JSON.stringify({ success: false, error: 'Route not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const targetUrl = `${DISCORD_API_BASE}${targetPath}`;

    // Headers – remove os problemáticos
    const headers = new Headers();
    for (const [key, value] of request.headers.entries()) {
      const lower = key.toLowerCase();
      if (
        lower === 'host' ||
        lower === 'cf-connecting-ip' ||
        lower === 'cf-ipcountry' ||
        lower === 'cf-ray' ||
        lower === 'x-forwarded-for'
      ) {
        continue;
      }
      headers.set(key, value);
    }
    headers.set('User-Agent', 'NexusPlatforms/1.0 (Cloudflare Worker)');

    const fetchConfig = {
      method: request.method,
      headers
    };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      fetchConfig.body = await request.arrayBuffer();
    }

    const response = await fetch(targetUrl, fetchConfig);

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', '*');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  }
};
