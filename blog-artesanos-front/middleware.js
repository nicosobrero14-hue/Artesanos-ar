import { rewrite, next } from '@vercel/edge'

/*
 * Edge Middleware de Vercel.
 *
 * Problema: el sitio es un SPA (Vite). Los scrapers de redes sociales
 * (WhatsApp, Facebook, etc.) NO ejecutan JavaScript, así que no ven los
 * meta tags Open Graph que setea useSEO en el cliente.
 *
 * Solución: cuando detectamos un bot pidiendo una ruta de artesano/pieza,
 * lo reescribimos a la función serverless /api/og, que devuelve un HTML
 * chiquito con los meta tags ya armados. Los usuarios reales siguen al SPA.
 */
export const config = {
    matcher: ['/artesano/:path*']
}

const BOT_RE = /facebookexternalhit|WhatsApp|Twitterbot|Slackbot|TelegramBot|LinkedInBot|Discordbot|Pinterest|redditbot|Googlebot|bingbot|Applebot|vkShare|W3C_Validator/i

export default function middleware(request) {
    const ua = request.headers.get('user-agent') || ''

    // Usuario real → seguir normalmente al SPA
    if (!BOT_RE.test(ua)) return next()

    // Bot → reescribir a la función de Open Graph
    const url = new URL(request.url)
    const destino = new URL('/api/og', url.origin)
    destino.searchParams.set('path', url.pathname)
    return rewrite(destino)
}
