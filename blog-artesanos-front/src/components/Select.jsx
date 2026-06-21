import { useId } from 'react'

/*
 * Select reutilizable con la misma API visual que Input.
 *
 * Props:
 * - label, error: igual que Input
 * - options: [{ value, label }]  ó  ['STR1', 'STR2'] (se usa el string como value y label)
 * - placeholder: opción vacía inicial (deshabilitada al click si required)
 * - ...props: name, value, onChange, required, disabled, etc.
 */
export default function Select({ label, error, options = [], placeholder, id, ...props }) {
    const autoId = useId()
    const selectId = id || autoId
    const errorId = error ? `${selectId}-error` : undefined

    const items = options.map(o => typeof o === 'string' ? { value: o, label: o } : o)
    const isEmpty = !props.value

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {label && (
                <label htmlFor={selectId} style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-2)' }}>
                    {label}
                </label>
            )}
            <select
                id={selectId}
                aria-invalid={!!error}
                aria-describedby={errorId}
                style={{
                    background: 'var(--color-bg-3)',
                    border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    color: isEmpty ? 'var(--color-text-3)' : 'var(--color-text)',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    fontFamily: 'inherit',
                    fontSize: 'var(--text-base)'
                }}
                {...props}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {items.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
            {error && (
                <span id={errorId} style={{ fontSize: 'var(--text-sm)', color: 'var(--color-danger)' }}>
                    {error}
                </span>
            )}
        </div>
    )
}
