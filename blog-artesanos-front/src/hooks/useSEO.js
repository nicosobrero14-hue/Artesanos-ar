import { useEffect } from 'react'

/*
 * Hook simple para SEO + Open Graph dinámico.
 *
 * Maneja directamente document.title y meta tags vía DOM. Sin dependencias.
 *
 * IMPORTANTE: WhatsApp y otros scrapers de redes sociales NO ejecutan JavaScript,
 * así que las meta tags seteadas acá NO aparecen en sus previews. Para que funcione
 * el preview en WhatsApp necesitamos SSR (Next.js) o un proxy server-side que
 * inyecte tags antes de que el bot reciba el HTML.
 *
 * En cambio, Google sí ejecuta JS desde 2019, así que para indexación esto sirve.
 *
 * Uso:
 *   useSEO({
 *     title: 'Mi Pieza',
 *     description: '...',
 *     image: 'https://...',
 *     url: window.location.href
 *   })
 */
export function useSEO({ title, description, image, url, type = 'website' }) {
    useEffect(() => {
        if (title) document.title = `${title} · Artesanos.ar`

        if (description) setMeta('description', description)

        // Open Graph
        if (title) setMeta('og:title', title, true)
        if (description) setMeta('og:description', description, true)
        if (image) setMeta('og:image', image, true)
        if (url) setMeta('og:url', url, true)
        setMeta('og:type', type, true)
        setMeta('og:site_name', 'Artesanos.ar', true)

        // Twitter Card
        setMeta('twitter:card', image ? 'summary_large_image' : 'summary')
        if (title) setMeta('twitter:title', title)
        if (description) setMeta('twitter:description', description)
        if (image) setMeta('twitter:image', image)
    }, [title, description, image, url, type])
}

/*
 * Crea o actualiza una meta tag.
 * isProperty=true para tags de Open Graph (usan property="..."),
 * false para tags estándar (usan name="...").
 */
function setMeta(key, content, isProperty = false) {
    if (!content) return
    const attr = isProperty ? 'property' : 'name'
    let el = document.querySelector(`meta[${attr}="${key}"]`)
    if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
    }
    el.setAttribute('content', content)
}
