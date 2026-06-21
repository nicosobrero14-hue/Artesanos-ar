/*
 * Botón reutilizable.
 *
 * variant:
 *   - 'primary' (default): fondo dorado — acción principal
 *   - 'ghost': solo borde — acción secundaria
 *   - 'danger': borde + texto rojo — eliminar, cancelar pedido, etc.
 *
 * size:
 *   - 'md' (default): padding 10x20
 *   - 'sm': padding 6x12, font más chico (incluye .btn-sm para evitar el min-height
 *           de 40px que aplicamos a botones en mobile)
 *
 * loading: muestra "Cargando..." y deshabilita el botón mientras espera.
 */
export default function Button({
    children,
    loading,
    variant = 'primary',
    size = 'md',
    fullWidth,
    className,
    style,
    ...props
}) {
    const variants = {
        primary: {
            background: loading ? 'var(--color-accent-hover)' : 'var(--color-accent)',
            color: '#0f0f0f',
            border: 'none',
            fontWeight: 'var(--weight-medium)'
        },
        ghost: {
            background: 'transparent',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)'
        },
        danger: {
            background: 'transparent',
            color: 'var(--color-danger)',
            border: '1px solid color-mix(in srgb, var(--color-danger) 40%, transparent)'
        }
    }
    const sizes = {
        sm: { padding: '6px 12px', fontSize: 'var(--text-sm)' },
        md: { padding: '10px 20px', fontSize: 'var(--text-base)' }
    }

    const classes = ['btn', `btn-${size}`, className].filter(Boolean).join(' ')

    return (
        <button
            disabled={loading || props.disabled}
            className={classes}
            style={{
                ...variants[variant],
                ...sizes[size],
                borderRadius: 'var(--radius-sm)',
                width: fullWidth ? '100%' : 'auto',
                opacity: loading ? 0.7 : 1,
                transition: 'background 0.15s, opacity 0.15s, border-color 0.15s',
                ...style
            }}
            {...props}
        >
            {loading ? 'Cargando...' : children}
        </button>
    )
}
