import { useEffect, useState } from 'react'

const STORAGE_KEY = 'theme'

/*
 * Devuelve el tema inicial resolviendo en este orden:
 *  1. Lo que hay guardado en localStorage (elección explícita del usuario).
 *  2. La preferencia del sistema operativo (prefers-color-scheme).
 *  3. 'dark' como default (la app nació en dark).
 */
function getInitialTheme() {
    if (typeof window === 'undefined') return 'dark'
    const guardado = window.localStorage.getItem(STORAGE_KEY)
    if (guardado === 'light' || guardado === 'dark') return guardado
    if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light'
    return 'dark'
}

/*
 * Hook global de tema.
 *  - Aplica el atributo data-theme al <html> (lo lee el CSS).
 *  - Persiste la elección en localStorage para que sobreviva a un reload.
 *  - Escucha cambios del sistema mientras el usuario NO tenga preferencia guardada.
 */
export function useTheme() {
    const [theme, setTheme] = useState(getInitialTheme)

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
    }, [theme])

    // Si el usuario nunca eligió, seguimos al sistema en tiempo real.
    useEffect(() => {
        const mql = window.matchMedia?.('(prefers-color-scheme: light)')
        if (!mql) return
        const onChange = (e) => {
            const guardado = window.localStorage.getItem(STORAGE_KEY)
            if (guardado !== 'light' && guardado !== 'dark') {
                setTheme(e.matches ? 'light' : 'dark')
            }
        }
        mql.addEventListener?.('change', onChange)
        return () => mql.removeEventListener?.('change', onChange)
    }, [])

    const toggle = () => {
        setTheme(prev => {
            const next = prev === 'dark' ? 'light' : 'dark'
            window.localStorage.setItem(STORAGE_KEY, next)
            return next
        })
    }

    return { theme, toggle }
}
