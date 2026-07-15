import { Link } from 'react-router-dom'

/*
 * Pantalla de error a página completa con una salida clara.
 * Se usa cuando una ruta no encuentra su recurso (artesano/pieza inexistente),
 * para que el usuario nunca quede en un dead-end sin poder accionar nada.
 *
 * Props:
 * - titulo: línea principal (ej. "Artesano no encontrado")
 * - detalle: texto secundario opcional
 * - volverA / volverLabel: link secundario contextual (ej. volver al catálogo)
 */
export default function PantallaError({
    titulo = 'No encontramos lo que buscabas',
    detalle = 'El enlace puede estar roto o el contenido ya no existe.',
    volverA,
    volverLabel
}) {
    return (
        <div style={{
            minHeight: '100vh', background: 'var(--color-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
        }}>
            <div style={{
                background: 'var(--color-bg-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                padding: '40px 32px',
                maxWidth: '420px', width: '100%',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '34px', marginBottom: '12px', opacity: 0.85 }}>🧭</div>
                <h1 style={{
                    fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)',
                    marginBottom: '8px', color: 'var(--color-text)'
                }}>
                    {titulo}
                </h1>
                <p style={{
                    fontSize: 'var(--text-base)', color: 'var(--color-text-2)',
                    lineHeight: '1.6', marginBottom: '24px'
                }}>
                    {detalle}
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/" style={{
                        background: 'var(--color-accent)', color: '#0f0f0f',
                        padding: '10px 22px', borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--text-base)', fontWeight: 'var(--weight-medium)'
                    }}>
                        Volver al inicio
                    </Link>
                    {volverA && (
                        <Link to={volverA} style={{
                            background: 'transparent', border: '1px solid var(--color-border)',
                            color: 'var(--color-text)', padding: '10px 22px',
                            borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-base)'
                        }}>
                            {volverLabel || 'Volver'}
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}
