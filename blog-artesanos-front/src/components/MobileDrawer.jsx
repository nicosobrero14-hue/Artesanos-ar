import { useEffect, useRef } from 'react'

/*
 * Drawer lateral reutilizable que entra desde la derecha.
 * Click en backdrop, Escape o navegar fuera lo cierra.
 * Bloquea scroll del body, atrapa el foco dentro del panel, y
 * restaura el foco al elemento que lo abrió al cerrar.
 */
export default function MobileDrawer({ abierto, onClose, children, anchoMax = '280px' }) {
    const panelRef = useRef(null)
    const triggerRef = useRef(null)

    /*
     * Cerrar con Escape + focus trap básico:
     *  - Al abrir: guardamos quién tenía el foco y movemos el foco al panel.
     *  - Mientras está abierto: Tab/Shift+Tab queda atrapado entre el primer y último foco-able.
     *  - Al cerrar: restauramos el foco al elemento original.
     */
    useEffect(() => {
        if (!abierto) return

        triggerRef.current = document.activeElement

        const panel = panelRef.current
        if (panel) {
            // Mover foco al primer elemento foco-able dentro del panel,
            // o al panel mismo si no hay nada.
            const focusables = getFocusables(panel)
            ;(focusables[0] || panel).focus()
        }

        const onKey = (e) => {
            if (e.key === 'Escape') {
                onClose()
                return
            }
            if (e.key !== 'Tab' || !panel) return

            const focusables = getFocusables(panel)
            if (focusables.length === 0) {
                e.preventDefault()
                return
            }
            const first = focusables[0]
            const last = focusables[focusables.length - 1]
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault()
                last.focus()
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault()
                first.focus()
            }
        }

        window.addEventListener('keydown', onKey)
        return () => {
            window.removeEventListener('keydown', onKey)
            // Restaurar foco al elemento original
            triggerRef.current?.focus?.()
        }
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
                aria-hidden="true"
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
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                tabIndex={-1}
                style={{
                    position: 'fixed', top: 0, right: 0, bottom: 0,
                    width: '85vw', maxWidth: anchoMax,
                    background: 'var(--color-bg-2)',
                    borderLeft: '1px solid var(--color-border)',
                    zIndex: 201,
                    transform: abierto ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.25s ease',
                    display: 'flex', flexDirection: 'column',
                    overflowY: 'auto',
                    outline: 'none'
                }}
            >
                {children}
            </aside>
        </>
    )
}

/*
 * Lista los elementos que pueden recibir foco con Tab dentro de un contenedor.
 * Usado por el focus trap.
 */
function getFocusables(root) {
    return Array.from(root.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ))
}
