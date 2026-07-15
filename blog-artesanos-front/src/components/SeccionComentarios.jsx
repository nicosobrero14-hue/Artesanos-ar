import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useToast } from '../context/ToastContext'

function formatearFecha(fecha) {
    if (!fecha) return ''
    try {
        if (Array.isArray(fecha)) {
            const [anio, mes, dia, hora = 0, min = 0] = fecha
            return new Date(anio, mes - 1, dia, hora, min).toLocaleDateString('es-AR', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            })
        }
        return new Date(fecha).toLocaleDateString('es-AR', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    } catch { return '' }
}

export default function SeccionComentarios({ piezaId, usuario }) {
    const toast = useToast()
    const [comentarios, setComentarios] = useState([])
    const [texto, setTexto] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [abierto, setAbierto] = useState(false)

    useEffect(() => {
        api.get(`/piezas/${piezaId}/comentarios`)
            .then(res => setComentarios(res.data))
            .catch(() => {})
    }, [piezaId])

    const handleEnviar = async (e) => {
        e.preventDefault()
        if (!texto.trim()) return
        setEnviando(true)
        try {
            const { data } = await api.post(`/piezas/${piezaId}/comentarios`, { texto })
            setComentarios(prev => [data, ...prev])
            setTexto('')
        } catch {
            toast('Error al enviar el comentario', 'error')
        } finally {
            setEnviando(false)
        }
    }

    const handleEliminar = async (comentarioId) => {
        try {
            await api.delete(`/piezas/${piezaId}/comentarios/${comentarioId}`)
            setComentarios(prev => prev.filter(c => c.id !== comentarioId))
        } catch {
            toast('Error al eliminar', 'error')
        }
    }

    return (
        <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '4px' }}>
            <button
                onClick={() => setAbierto(v => !v)}
                style={{
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '6px',
                    color: 'var(--color-text-2)', fontSize: '13px', textAlign: 'left'
                }}
            >
                <span style={{ fontSize: '11px' }}>{abierto ? '▾' : '▸'}</span>
                Comentarios{comentarios.length > 0 ? ` (${comentarios.length})` : ''}
            </button>

            {abierto && (
                <div style={{ padding: '0 16px 16px' }}>
                    {usuario ? (
                        <form onSubmit={handleEnviar} style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                            <input value={texto} onChange={e => setTexto(e.target.value)}
                                placeholder="Escribi un comentario..." maxLength={500}
                                style={{ flex: 1, background: 'var(--color-bg-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: 'var(--color-text)', fontSize: '13px', outline: 'none' }} />
                            <button type="submit" disabled={enviando || !texto.trim()} style={{
                                background: 'var(--color-accent)', color: '#0f0f0f', border: 'none',
                                borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: '13px',
                                fontWeight: '500', cursor: 'pointer', opacity: (!texto.trim() || enviando) ? 0.6 : 1
                            }}>
                                {enviando ? '...' : 'Enviar'}
                            </button>
                        </form>
                    ) : (
                        <div style={{
                            background: 'var(--color-bg-3)', border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                            marginBottom: '12px', fontSize: '13px', color: 'var(--color-text-2)'
                        }}>
                            <a href={`/login?next=${window.location.pathname}`} style={{ color: 'var(--color-accent)' }}>
                                Ingresá con tu cuenta verificada
                            </a>{' '}para dejar un comentario.
                        </div>
                    )}

                    {comentarios.length === 0 ? (
                        <p style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>Sin comentarios todavia.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {comentarios.map(c => (
                                <div key={c.id} style={{
                                    background: 'var(--color-bg-3)', borderRadius: 'var(--radius-sm)',
                                    padding: '10px 14px', display: 'flex', justifyContent: 'space-between', gap: '12px'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: '500' }}>{c.autorNombre}</span>
                                            {!c.esAnonimo && (
                                                <span style={{ fontSize: '10px', background: '#4caf8218', color: 'var(--color-success)', padding: '1px 6px', borderRadius: '20px' }}>
                                                    verificado
                                                </span>
                                            )}
                                            <span style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>
                                                {formatearFecha(c.fecha)}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '13px', color: 'var(--color-text-2)', lineHeight: '1.5' }}>{c.texto}</p>
                                    </div>
                                    {usuario && (
                                        <button onClick={() => handleEliminar(c.id)} style={{
                                            background: 'none', border: 'none', color: 'var(--color-text-3)',
                                            cursor: 'pointer', fontSize: '16px', flexShrink: 0, alignSelf: 'flex-start'
                                        }}>×</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
