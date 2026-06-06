import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api'
})

/*
 * Decodifica el payload del JWT y mira el campo `exp` (UNIX timestamp en segundos).
 * Si ya pasó, el token está vencido.
 *
 * Si el token no se puede parsear (formato inválido, corrupto), lo tratamos
 * como expirado para limpiar la sesión.
 */
export function isTokenExpired(token) {
    if (!token) return true
    try {
        const partes = token.split('.')
        if (partes.length !== 3) return true
        // base64url → base64 estándar para atob
        const payloadB64 = partes[1].replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(atob(payloadB64))
        if (!payload.exp) return false // si no tiene exp, asumimos no expira
        // 30s de margen para evitar carrera con el servidor
        return Date.now() >= (payload.exp * 1000 - 30000)
    } catch {
        return true
    }
}

/*
 * Rutas donde NO redirigimos al login aunque el token esté vencido.
 * Son páginas públicas: el visitante anónimo las puede ver igual.
 */
const RUTAS_PUBLICAS = [
    '/', '/login', '/registro', '/verificar', '/recuperar-password',
    '/terminos', '/privacidad', '/buscar', '/eventos', '/ranking', '/novedades'
]

function esRutaPublica(pathname) {
    if (RUTAS_PUBLICAS.includes(pathname)) return true
    // Catálogos y piezas públicas
    if (pathname.startsWith('/artesano/')) return true
    return false
}

/*
 * Limpia la sesión vencida. Si está en una página privada, redirige a /login
 * con ?expired=1 para que el frontend muestre el motivo.
 * Si está en una página pública, simplemente lo deja seguir como visitante.
 */
function limpiarSesionExpirada(redirigir) {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    if (redirigir && !esRutaPublica(window.location.pathname)) {
        window.location.href = '/login?expired=1'
    }
}

/*
 * Interceptor de request:
 *  - Si hay token y NO está expirado: lo manda en el Authorization.
 *  - Si está expirado: lo descarta para que la llamada salga anónima
 *    y limpia la sesión. Las páginas públicas siguen funcionando.
 */
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) {
        if (isTokenExpired(token)) {
            limpiarSesionExpirada(true)
            // No mandamos el header — la llamada sale como anónima
        } else {
            config.headers.Authorization = `Bearer ${token}`
        }
    }
    return config
})

/*
 * Interceptor de response:
 *  - 401: el backend dice que el token ya no vale. Limpiamos y redirigimos
 *    solo si no estamos en una ruta pública.
 *  - Otros errores: se propagan normalmente.
 */
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            limpiarSesionExpirada(true)
        }
        return Promise.reject(error)
    }
)

export default api
