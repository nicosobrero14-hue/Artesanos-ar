/*
 * Función serverless de Vercel — Open Graph para bots.
 *
 * El middleware rutea acá los pedidos de scrapers de redes sociales.
 * Esta función arma un HTML mínimo con los meta tags Open Graph correctos
 * según la pieza o el catálogo que se está compartiendo.
 *
 * Lee la URL del backend desde la env var VITE_API_URL (la misma que usa
 * el frontend; Vercel la expone también a las funciones serverless).
 */
const API = process.env.VITE_API_URL || ''

// Escapa para que el contenido no rompa el HTML / inyecte tags
function esc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

function paginaOG({ title, description, image, url }) {
    return `<!doctype html>
<html lang="es-AR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="Artesanos.ar"/>
<meta property="og:title" content="${esc(title)}"/>
<meta property="og:description" content="${esc(description)}"/>
${image ? `<meta property="og:image" content="${esc(image)}"/>` : ''}
<meta property="og:url" content="${esc(url)}"/>
<meta property="og:locale" content="es_AR"/>
${image ? `<meta property="og:image:alt" content="${esc(title)}"/>` : ''}
<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}"/>
<meta name="twitter:title" content="${esc(title)}"/>
<meta name="twitter:description" content="${esc(description)}"/>
${image ? `<meta name="twitter:image" content="${esc(image)}"/>` : ''}
</head>
<body>
<h1>${esc(title)}</h1>
<p>${esc(description)}</p>
<a href="${esc(url)}">Ver en Artesanos.ar</a>
</body>
</html>`
}

export default async function handler(req, res) {
    const path = (req.query && req.query.path) || '/'
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'www.artesanos-ar.com.ar'
    const fullUrl = `https://${host}${path}`

    // Meta por defecto (si no matchea nada o falla el fetch)
    let meta = {
        title: 'Artesanos.ar — Trabajo artesanal argentino',
        description: 'Descubrí artesanos argentinos. Conectá directo con quien hace cada pieza.',
        image: null,
        url: fullUrl
    }

    try {
        const piezaMatch = path.match(/^\/artesano\/[^/]+\/pieza\/(\d+)/)
        const catMatch = path.match(/^\/artesano\/([^/]+)\/?$/)

        if (piezaMatch && API) {
            const r = await fetch(`${API}/piezas/${piezaMatch[1]}`)
            if (r.ok) {
                const p = await r.json()
                const precio = p.precio != null
                    ? ` — $${Number(p.precio).toLocaleString('es-AR')}`
                    : ''
                meta = {
                    title: `${p.titulo} — ${p.artesanoNombre}`,
                    description: (p.descripcion || `Pieza artesanal de ${p.artesanoNombre}`) + precio,
                    image: (p.fotos && p.fotos[0]) || null,
                    url: fullUrl
                }
            }
        } else if (catMatch && API) {
            const slug = catMatch[1]
            // og=true → el backend no cuenta esto como visita al perfil
            const r = await fetch(`${API}/artesanos/${slug}?og=true`)
            if (r.ok) {
                const a = await r.json()

                // Imagen del preview: el avatar del artesano si tiene; si no,
                // la primera foto de alguna de sus piezas (queda mejor que un
                // link sin imagen).
                let image = a.avatarUrl || null
                if (!image) {
                    try {
                        const rp = await fetch(`${API}/artesanos/${slug}/piezas`)
                        if (rp.ok) {
                            const piezas = await rp.json()
                            const conFoto = piezas.find(p => p.fotos && p.fotos.length > 0)
                            if (conFoto) image = conFoto.fotos[0]
                        }
                    } catch (e) { /* sin imagen, no pasa nada */ }
                }

                meta = {
                    title: `${a.nombre} — Artesanos.ar`,
                    description: a.bio || `Mirá el catálogo de ${a.nombre} en Artesanos.ar`,
                    image,
                    url: fullUrl
                }
            }
        }
    } catch (e) {
        // Si algo falla, devolvemos los meta por defecto — nunca rompemos
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    // Cache en el edge: 1h fresco, 1 día stale-while-revalidate
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
    res.status(200).send(paginaOG(meta))
}
