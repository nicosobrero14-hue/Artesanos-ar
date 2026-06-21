import { useId } from 'react'

/*
 * Input reutilizable. El label está asociado al input con htmlFor + id
 * (generados con useId) para que los lectores de pantalla los lean juntos
 * y para que clickear el label enfoque el input.
 *
 * Props:
 * - label: texto arriba del input
 * - error: mensaje de error (si hay)
 * - ...props: cualquier atributo HTML normal (type, placeholder, value, onChange, etc.)
 *             También se puede pasar un `id` propio y se respeta.
 */
export default function Input({ label, error, id, ...props }) {
    const autoId = useId()
    const inputId = id || autoId
    const errorId = error ? `${inputId}-error` : undefined

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {label && (
                <label htmlFor={inputId} style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-2)' }}>
                    {label}
                </label>
            )}
            <input
                id={inputId}
                aria-invalid={!!error}
                aria-describedby={errorId}
                style={{
                    background: 'var(--color-bg-3)',
                    border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    color: 'var(--color-text)',
                    outline: 'none',
                    width: '100%',
                    transition: 'border-color 0.15s, box-shadow 0.15s'
                }}
                {...props}
            />
            {error && (
                <span id={errorId} style={{ fontSize: 'var(--text-sm)', color: 'var(--color-danger)' }}>
                    {error}
                </span>
            )}
        </div>
    )
}
