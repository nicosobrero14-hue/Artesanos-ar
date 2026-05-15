/*
 * Helper para optimizar URLs de Cloudinary con transformaciones on-the-fly.
 *
 * Cloudinary devuelve la imagen original en la URL que tenemos guardada en la BD.
 * Acá inyectamos parámetros antes de "/upload/" para que Cloudinary entregue
 * versiones optimizadas:
 *   - f_auto: formato automático (WebP en browsers que lo soportan, JPG sino)
 *   - q_auto: calidad automática (Cloudinary elige el mejor balance peso/calidad)
 *   - w_X: ancho máximo en píxeles (no agranda, solo achica si es más grande)
 *
 * Esto puede reducir el peso de las imágenes 50-80% sin pérdida visual notable.
 */

const TRANSFORM = 'f_auto,q_auto'

export function optimizar(url, ancho = null) {
    if (!url || typeof url !== 'string') return url
    if (!url.includes('/upload/')) return url // no es Cloudinary, devolver tal cual

    const transform = ancho ? `${TRANSFORM},w_${ancho}` : TRANSFORM
    return url.replace('/upload/', `/upload/${transform}/`)
}

/*
 * Variantes de tamaño según uso:
 *  - thumb: para previews chicos (avatares, recientes 130px)
 *  - card: para cards medianas (170-260px)
 *  - hero: para imagen principal de pieza detalle (~600px)
 */
export const optimizarThumb = (url) => optimizar(url, 200)
export const optimizarCard = (url) => optimizar(url, 500)
export const optimizarHero = (url) => optimizar(url, 800)
