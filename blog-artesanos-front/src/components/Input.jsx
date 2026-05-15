/*
 * Un componente de input reutilizable.
 * En vez de repetir los estilos en cada formulario,
 * lo definimos una vez acá y lo usamos en todos lados.
 *
 * Props:
 * - label: texto que aparece arriba del input
 * - error: mensaje de error (si hay)
 * - ...props: cualquier atributo HTML normal (type, placeholder, value, onChange, etc.)
 */
export default function Input({ label, error, ...props }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {label && (
            <label style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
            {label}
            </label>
        )}
        <input
            style={{
            background: 'var(--color-bg-3)',
            border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '10px 12px',
            color: 'var(--color-text)',
            outline: 'none',
            width: '100%',
            transition: 'border-color 0.15s'
            }}
            {...props}
        />
        {error && (
            <span style={{ fontSize: '12px', color: 'var(--color-danger)' }}>
            {error}
            </span>
        )}
        </div>
    )
}