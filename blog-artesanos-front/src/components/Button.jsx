/*
 * Botón reutilizable con dos variantes:
 * - variant="primary" (default): fondo dorado — para la acción principal
 * - variant="ghost": solo borde — para acciones secundarias
 *
 * loading: muestra "Cargando..." y deshabilita el botón mientras espera
 */
export default function Button({ children, loading, variant = 'primary', ...props }) {
    const styles = {
        primary: {
        background: loading ? 'var(--color-accent-hover)' : 'var(--color-accent)',
        color: '#0f0f0f',
        border: 'none',
        fontWeight: '500'
        },
        ghost: {
        background: 'transparent',
        color: 'var(--color-text)',
        border: '1px solid var(--color-border)'
        }
    }

    return (
        <button
        disabled={loading || props.disabled}
        style={{
            ...styles[variant],
            padding: '10px 20px',
            borderRadius: 'var(--radius-sm)',
            width: props.fullWidth ? '100%' : 'auto',
            opacity: loading ? 0.7 : 1,
            transition: 'background 0.15s, opacity 0.15s'
        }}
        {...props}
        >
        {loading ? 'Cargando...' : children}
        </button>
    )
}