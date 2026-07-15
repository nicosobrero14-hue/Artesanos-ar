import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

/*
 * Diálogo de confirmación propio (reemplaza al confirm() nativo del browser).
 *
 * Uso desde cualquier componente:
 *   const confirm = useConfirm()
 *   const ok = await confirm({ mensaje: '¿Eliminar esta pieza?' })
 *   if (!ok) return
 *
 * Opciones:
 *   - titulo:   encabezado (opcional)
 *   - mensaje:  texto principal (string)
 *   - confirmLabel / cancelLabel: textos de los botones
 *   - danger:   true → el botón de confirmar usa el estilo rojo (acciones destructivas)
 */
const ConfirmContext = createContext(null)

export function useConfirm() {
    const ctx = useContext(ConfirmContext)
    if (!ctx) throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>')
    return ctx
}

export function ConfirmProvider({ children }) {
    const [estado, setEstado] = useState(null) // { opciones } | null
    // Guardamos el resolve de la promesa para resolverla cuando el usuario decide.
    const resolverRef = useRef(null)

    const confirm = useCallback((opciones) => {
        // Permitir confirm('texto') además de confirm({ mensaje })
        const opts = typeof opciones === 'string' ? { mensaje: opciones } : (opciones || {})
        return new Promise((resolve) => {
            resolverRef.current = resolve
            setEstado(opts)
        })
    }, [])

    const cerrar = useCallback((valor) => {
        resolverRef.current?.(valor)
        resolverRef.current = null
        setEstado(null)
    }, [])

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            {estado && <ConfirmDialog opciones={estado} onResolve={cerrar} />}
        </ConfirmContext.Provider>
    )
}

function ConfirmDialog({ opciones, onResolve }) {
    const {
        titulo,
        mensaje,
        confirmLabel = 'Confirmar',
        cancelLabel = 'Cancelar',
        danger = false
    } = opciones

    const confirmBtnRef = useRef(null)
    const panelRef = useRef(null)

    // Foco inicial en el botón de confirmar + cerrar con Escape + focus trap básico.
    useEffect(() => {
        confirmBtnRef.current?.focus()
        const onKey = (e) => {
            if (e.key === 'Escape') { onResolve(false); return }
            if (e.key !== 'Tab') return
            const foco = panelRef.current?.querySelectorAll('button')
            if (!foco || foco.length === 0) return
            const first = foco[0], last = foco[foco.length - 1]
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
        }
        window.addEventListener('keydown', onKey)
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            window.removeEventListener('keydown', onKey)
            document.body.style.overflow = prevOverflow
        }
    }, [onResolve])

    return (
        <div
            onClick={() => onResolve(false)}
            style={{
                position: 'fixed', inset: 0, zIndex: 3000,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px'
            }}
        >
            <div
                ref={panelRef}
                role="alertdialog"
                aria-modal="true"
                aria-label={titulo || 'Confirmación'}
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'var(--color-bg-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    boxShadow: 'var(--shadow-md)',
                    padding: '24px',
                    maxWidth: '380px', width: '100%'
                }}
            >
                {titulo && (
                    <h2 style={{
                        fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)',
                        marginBottom: '8px', color: 'var(--color-text)'
                    }}>{titulo}</h2>
                )}
                <p style={{
                    fontSize: 'var(--text-base)', color: 'var(--color-text-2)',
                    lineHeight: '1.6', marginBottom: '20px', whiteSpace: 'pre-wrap'
                }}>{mensaje}</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => onResolve(false)}
                        style={{
                            background: 'transparent', border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)', padding: '9px 16px',
                            color: 'var(--color-text)', fontSize: 'var(--text-base)', cursor: 'pointer'
                        }}
                    >{cancelLabel}</button>
                    <button
                        ref={confirmBtnRef}
                        onClick={() => onResolve(true)}
                        style={{
                            background: danger ? 'var(--color-danger)' : 'var(--color-accent)',
                            color: danger ? '#fff' : '#0f0f0f',
                            border: 'none', borderRadius: 'var(--radius-sm)',
                            padding: '9px 16px', fontSize: 'var(--text-base)',
                            fontWeight: 'var(--weight-medium)', cursor: 'pointer'
                        }}
                    >{confirmLabel}</button>
                </div>
            </div>
        </div>
    )
}
