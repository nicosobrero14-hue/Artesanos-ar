import { createContext, useCallback, useContext, useState } from 'react'

/*
 * Toasts (avisos flotantes) que reemplazan al alert() nativo.
 *
 * Uso:
 *   const toast = useToast()
 *   toast('Pieza eliminada')                    // info por defecto
 *   toast('Error al guardar', 'error')          // variante error
 *   toast('Guardado', 'success')
 *
 * Se apilan abajo a la derecha y se auto-cierran a los 4s.
 */
const ToastContext = createContext(null)

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
    return ctx
}

let idSeq = 0

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const quitar = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const toast = useCallback((mensaje, tipo = 'info') => {
        const id = ++idSeq
        setToasts(prev => [...prev, { id, mensaje, tipo }])
        setTimeout(() => quitar(id), 4000)
    }, [quitar])

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div
                aria-live="polite"
                style={{
                    position: 'fixed', bottom: '20px', right: '20px', zIndex: 4000,
                    display: 'flex', flexDirection: 'column', gap: '10px',
                    maxWidth: 'calc(100vw - 40px)'
                }}
            >
                {toasts.map(t => (
                    <Toast key={t.id} {...t} onClose={() => quitar(t.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

const colorPorTipo = {
    info: 'var(--color-accent)',
    success: 'var(--color-success)',
    error: 'var(--color-danger)'
}

function Toast({ mensaje, tipo, onClose }) {
    return (
        <div
            role="status"
            onClick={onClose}
            style={{
                background: 'var(--color-bg-2)',
                border: '1px solid var(--color-border)',
                borderLeft: `3px solid ${colorPorTipo[tipo] || colorPorTipo.info}`,
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-md)',
                padding: '12px 16px',
                minWidth: '240px', maxWidth: '360px',
                color: 'var(--color-text)',
                fontSize: 'var(--text-base)',
                lineHeight: '1.5',
                cursor: 'pointer',
                animation: 'toast-in 0.2s ease'
            }}
        >
            {mensaje}
        </div>
    )
}
