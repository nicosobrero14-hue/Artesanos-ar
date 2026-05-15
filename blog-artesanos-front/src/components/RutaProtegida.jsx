import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/*
 * Este componente actúa como un guardia de seguridad.
 * Si el usuario está logueado, muestra el contenido (children).
 * Si no está logueado, lo redirige al login automáticamente.
 *
 * Lo usamos envolviendo cualquier ruta que requiera autenticación.
 */
export default function RutaProtegida({ children }) {
    const { estaLogueado } = useAuth()

    if (!estaLogueado) {
        // replace evita que el usuario vuelva a la ruta protegida con el botón "atrás"
        return <Navigate to="/login" replace />
    }

    return children
}