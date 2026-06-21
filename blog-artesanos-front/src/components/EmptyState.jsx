import Card from './Card'

/*
 * Mensaje cuando una lista está vacía. Reemplaza el patrón repetido
 * en muchas páginas: container vacío + texto centrado.
 *
 * Props:
 * - icon: emoji u otro contenido visual (opcional)
 * - title: línea principal
 * - desc: línea secundaria (opcional)
 * - action: ReactNode con un botón o link (opcional)
 */
export default function EmptyState({ icon, title, desc, action }) {
    return (
        <Card padding="lg" style={{ textAlign: 'center' }}>
            {icon && (
                <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.8 }}>
                    {icon}
                </div>
            )}
            <p style={{ fontSize: 'var(--text-md)', color: 'var(--color-text)', marginBottom: desc ? '6px' : '0' }}>
                {title}
            </p>
            {desc && (
                <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-2)' }}>
                    {desc}
                </p>
            )}
            {action && <div style={{ marginTop: '16px' }}>{action}</div>}
        </Card>
    )
}
