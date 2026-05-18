export default {

```
async fetch(request) {

    try {

        const DISCORD_API_BASE = 'https://discord.com/api';

        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': '*'
        };

        const url = new URL(request.url);
        const path = url.pathname;

        // =========================================
        // CORS PRE-FLIGHT
        // =========================================

        if (request.method === 'OPTIONS') {

            return new Response(null, {
                status: 204,
                headers: corsHeaders
            });

        }

        // =========================================
        // STATUS
        // =========================================

        if (path === '/' || path === '/status') {

            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'Discord OAuth Proxy Online',
                    version: '1.0.0',
                    endpoints: [
                        'POST /token',
                        'GET /users/@me'
                    ]
                }, null, 2),
                {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json;charset=UTF-8',
                        ...corsHeaders
                    }
                }
            );

        }

        // =========================================
        // ROTAS
        // =========================================

        let targetPath = '';

        if (path === '/token') {

            targetPath = '/oauth2/token';

        } else if (path === '/users/@me') {

            targetPath = '/users/@me';

        } else {

            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Route not found'
                }),
                {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                }
            );

        }

        // =========================================
        // URL DESTINO
        // =========================================

        const targetUrl = `${DISCORD_API_BASE}${targetPath}`;

        // =========================================
        // HEADERS
        // =========================================

        const headers = new Headers();

        for (const [key, value] of request.headers.entries()) {

            const lower = key.toLowerCase();

            // remove headers problemáticos
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

        headers.set(
            'User-Agent',
            'NexusPlatforms/1.0'
        );

        // =========================================
        // FETCH CONFIG
        // =========================================

        const fetchConfig = {
            method: request.method,
            headers
        };

        // adiciona body apenas se necessário
        if (
            request.method !== 'GET' &&
            request.method !== 'HEAD'
        ) {

            fetchConfig.body = await request.arrayBuffer();

        }

        // =========================================
        // FETCH DISCORD API
        // =========================================

        const response = await fetch(
            targetUrl,
            fetchConfig
        );

        // =========================================
        // RESPONSE HEADERS
        // =========================================

        const responseHeaders = new Headers(response.headers);

        responseHeaders.set(
            'Access-Control-Allow-Origin',
            '*'
        );

        responseHeaders.set(
            'Access-Control-Allow-Methods',
            'GET, POST, OPTIONS'
        );

        responseHeaders.set(
            'Access-Control-Allow-Headers',
            '*'
        );

        return new Response(
            response.body,
            {
                status: response.status,
                statusText: response.statusText,
                headers: responseHeaders
            }
        );

    } catch (err) {

        return new Response(
            JSON.stringify({
                success: false,
                error: String(err),
                stack: err?.stack || null
            }, null, 2),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

    }

}
```

};
