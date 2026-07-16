import { useEffect, useState } from 'react'
import api from '../api/axios'

/*
 * Muestra los cupones de descuento vigentes de un artesano en su catálogo público.
 *
 * Diseño tipo "ticket de descuento" con borde dorado. El usuario hace click para
 * copiar el código al portapapeles — así lo pega fácil en el chat.
 *
 * El uso del cupón es "por honor" (lo aplica el artesano al cotizar): no se valida
 * automáticamente. En una v2 podríamos hacer que el cliente lo "aplique" via endpoint.
 */
export default function CuponesVigentes({ slug }) {
    const [cupones, setCupones] = useState([])
    const [copiado, setCopiado] = useState(null)

    useEffect(() => {
        api.get(`/artesanos/${slug}/cupones`)
            .then(res => setCupones(res.data))
            .catch(() => {})
    }, [slug])

    if (cupones.length === 0) return null

    const copiar = async (codigo) => {
        try {
            await navigator.clipboard.writeText(codigo)
            setCopiado(codigo)
            setTimeout(() => setCopiado(null), 2000)
        } catch {}
    }

    return (
        <div style={{ marginBottom: '24px' }}>
            <p style={{
                fontSize: '11px', color: 'var(--color-text-3)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: '10px', fontWeight: '600'
            }}>
                🎟 Cupones de descuento vigentes
            </p>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '10px'
            }}>
                {cupones.map(c => (
                    <button key={c.codigo}
                        onClick={() => copiar(c.codigo)}
                        title="Click para copiar el código"
                        style={{
                            background: 'rgba(245, 185, 79, 0.08)',
                            border: '1px dashed #f5b94f',
                            borderRadius: 'var(--radius)',
                            padding: '14px',
                            display: 'flex', alignItems: 'center', gap: '12px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245, 185, 79, 0.14)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245, 185, 79, 0.08)' }}
                    >
                        <div style={{
                            background: 'var(--color-premium)', color: '#0f0f0f',
                            borderRadius: 'var(--radius-sm)',
                            padding: '8px 10px',
                            fontWeight: '700', fontSize: '18px',
                            lineHeight: 1, minWidth: '50px', textAlign: 'center'
                        }}>
                            {c.porcentaje}%
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                                fontFamily: 'monospace', fontSize: '14px',
                                fontWeight: '600', color: 'var(--color-premium)',
                                marginBottom: '2px'
                            }}>
                                {copiado === c.codigo ? '✓ COPIADO' : c.codigo}
                            </p>
                            {c.descripcion && (
                                <p style={{
                                    fontSize: '11px', color: 'var(--color-text-2)',
                                    overflow: 'hidden', textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap', marginBottom: '2px'
                                }}>
                                    {c.descripcion}
                                </p>
                            )}
                            <p style={{ fontSize: '10px', color: 'var(--color-text-3)' }}>
                                Vence el {new Date(c.fechaVencimiento).toLocaleDateString('es-AR', {
                                    day: '2-digit', month: 'short'
                                })}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--color-text-3)', marginTop: '8px', fontStyle: 'italic' }}>
                Click en el código para copiarlo. Mencionalo al artesano al consultar.
            </p>
        </div>
    )
}
