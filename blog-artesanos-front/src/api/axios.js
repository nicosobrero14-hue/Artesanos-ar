import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api'
})

// Interceptor de request — agrega el token JWT a cada llamada
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
    })

    /*
    * Interceptor de response — maneja errores globalmente.
    * Si el servidor devuelve 401 (token expirado o inválido),
    * limpiamos el localStorage y redirigimos al login automáticamente.
    * Sin esto, el usuario vería errores raros en cada pantalla
    * cuando su sesión expira.
    */
    api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
        // Token expirado o inválido — limpiamos sesión
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
        // Redirigimos solo si no estamos ya en login o registro
        const ruta = window.location.pathname
        if (ruta !== '/login' && ruta !== '/registro' && ruta !== '/verificar') {
            window.location.href = '/login'
        }
        }
        return Promise.reject(error)
    }
)

export default api