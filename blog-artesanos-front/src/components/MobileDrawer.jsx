import { useEffect } from 'react'

/*
 * Drawer lateral reutilizable que entra desde la derecha.
 * Click en el backdrop o presionar Escape lo cierra.
 * Bloquea el scroll del body mientras está abierto.
 *
 * Uso:
 *   <MobileDrawer abierto={open} onClose={() => setOpen(false)}>
 *     ...contenido...
 *   </MobileDrawer>
 */
export default function MobileDrawer({ abierto, onClose, children, anchoMax = '280px' }) {
    // Cerrar con Escape
    useEffect(() => {
        if (!abierto) return
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [abierto, onClose])

    // Lock scroll mientras abierto
    useEffect(() => {
        if (abierto) {
            const prev = document.body.style.overflow
            document.body.style.overflow = 'hidden'
            return () => { document.body.style.overflow = prev }
        }
    }, [abierto])

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0, zIndex: 200,
                    background: 'rgba(0,0,0,0.55)',
                    opacity: abierto ? 1 : 0,
                    pointerEvents: abierto ? 'auto' : 'none',
                    transition: 'opacity 0.2s ease'
                }}
            />
            {/* Panel */}
            <aside
                role="dialog"
                aria-modal="true"
                style={{
                    position: 'fixed', top: 0, right: 0, bottom: 0,
                    width: '85vw', maxWidth: anchoMax,
                    background: 'var(--color-bg-2)',
                    borderLeft: '1px solid var(--color-border)',
                    zIndex: 201,
                    transform: abierto ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.25s ease',
                    display: 'flex', flexDirection: 'column',
                    overflowY: 'auto'
                }}
            >
                {children}
            </aside>
        </>
    )
}
