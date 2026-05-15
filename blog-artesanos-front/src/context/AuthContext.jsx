import { createContext, useContext, useState } from 'react'

/*
 * Context en React es una forma de compartir datos entre componentes
 * sin tener que pasarlos como props de padre a hijo manualmente.
 *
 * Acá guardamos: el token JWT, los datos del usuario logueado,
 * y las funciones para hacer login y logout.
 *
 * Cualquier componente de la app puede acceder a esto con useAuth().
 */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    // Inicializamos el token desde localStorage — así si el usuario
    // recarga la página, no pierde la sesión
    const [token, setToken] = useState(localStorage.getItem('token'))
    const [usuario, setUsuario] = useState(() => {
        const saved = localStorage.getItem('usuario')
        return saved ? JSON.parse(saved) : null
    })

    const login = (data) => {
        // data viene del backend: { token, nombre, email, slug }
        localStorage.setItem('token', data.token)
        localStorage.setItem('usuario', JSON.stringify(data))
        setToken(data.token)
        setUsuario(data)
    }

    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
        setToken(null)
        setUsuario(null)
    }

    return (
        <AuthContext.Provider value={{ token, usuario, login, logout, estaLogueado: !!token }}>
        {children}
        </AuthContext.Provider>
    )
}

// Hook personalizado — en vez de escribir useContext(AuthContext)
// en cada componente, escribimos useAuth() que es más limpio
export function useAuth() {
    return useContext(AuthContext)
}