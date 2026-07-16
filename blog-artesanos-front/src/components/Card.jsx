/*
 * Card reutilizable — la superficie elevada que se repite en todo el panel
 * (stats cards, accesos rápidos, items de lista, etc.).
 *
 * Props:
 * - variant: 'default' (bg-2 + border) | 'highlight' (border dorado) | 'premium' (gradiente dorado)
 * - padding: 'sm' (14px) | 'md' (20px, default) | 'lg' (28px)
 * - hoverable: true → el border se pone dorado en hover (usar cuando la card es clickeable)
 * - as: 'div' (default) — podés pasar 'article', 'section', etc.
 * - style: estilos extra que se mergean al final
 */
export default function Card({
    children,
    variant = 'default',
    padding = 'md',
    hoverable = false,
    as: Tag = 'div',
    style,
    ...props
}) {
    const variants = {
        default: {
            background: 'var(--color-bg-2)',
            border: '1px solid var(--color-border)'
        },
        highlight: {
            background: 'var(--color-bg-2)',
            border: '1px solid var(--color-accent)'
        },
        premium: {
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-premium) 13%, transparent), color-mix(in srgb, var(--color-premium) 13%, transparent))',
            border: '1px solid var(--color-premium)'
        }
    }
    const paddings = { sm: '14px', md: '20px', lg: '28px' }

    const baseStyle = {
        ...variants[variant],
        borderRadius: 'var(--radius)',
        padding: paddings[padding],
        transition: hoverable ? 'border-color 0.15s' : undefined,
        cursor: hoverable ? 'pointer' : undefined,
        ...style
    }

    const hoverProps = hoverable
        ? {
            onMouseEnter: e => (e.currentTarget.style.borderColor = 'var(--color-accent)'),
            onMouseLeave: e => (e.currentTarget.style.borderColor = variants[variant].border.includes('accent')
                ? 'var(--color-accent)'
                : variants[variant].border.includes('premium')
                    ? 'var(--color-premium)'
                    : 'var(--color-border)')
        }
        : {}

    return (
        <Tag style={baseStyle} {...hoverProps} {...props}>
            {children}
        </Tag>
    )
}
