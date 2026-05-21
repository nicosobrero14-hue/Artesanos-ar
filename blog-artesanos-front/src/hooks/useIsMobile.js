import { useEffect, useState } from 'react'

/*
 * Hook que devuelve true cuando la ventana mide <= breakpoint.
 * Default: 768px (match con --bp-mobile del CSS).
 *
 * Re-renderiza el componente al cruzar el breakpoint.
 * Usalo solo cuando necesitás lógica condicional (mostrar drawer, cambiar layout).
 * Para mostrar/ocultar visual usá las clases CSS .solo-mobile / .solo-desktop.
 */
export default function useIsMobile(breakpoint = 768) {
    const get = () => typeof window !== 'undefined' && window.innerWidth <= breakpoint
    const [isMobile, setIsMobile] = useState(get)

    useEffect(() => {
        const onResize = () => setIsMobile(get())
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [breakpoint])

    return isMobile
}
