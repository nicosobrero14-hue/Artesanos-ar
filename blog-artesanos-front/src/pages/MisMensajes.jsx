import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

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

export default function MisMensajes() {
    const { usuario } = useAuth()
    const [mensajes, setMensajes] = useState([])
    const [loading, setLoading] = useState(true)
    const [filtro, setFiltro] = useState('todos')
    // respondiendo guarda el ID del mensaje que está abierto para responder
    const [respondiendo, setRespondiendo] = useState(null)
    const [textoRespuesta, setTextoRespuesta] = useState('')
    const [enviandoRespuesta, setEnviandoRespuesta] = useState(false)
    const [respondidoOk, setRespondidoOk] = useState(null) // ID del mensaje respondido con éxito

    useEffect(() => { cargarMensajes() }, [])

    const cargarMensajes = () => {
        api.get('/mis-contactos')
            .then(res => setMensajes(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }

    const marcarLeido = async (id) => {
        try {
            await api.put(`/mis-contactos/${id}/leer`)
            setMensajes(prev => prev.map(m => m.id === id ? { ...m, leido: true } : m))
        } catch (err) { console.error(err) }
    }

    const handleResponder = async (id) => {
        if (!textoRespuesta.trim()) return
        setEnviandoRespuesta(true)
        try {
            await api.post(`/mis-contactos/${id}/responder`, { mensaje: textoRespuesta })
            // Marcar como leído en el estado local
            setMensajes(prev => prev.map(m => m.id === id ? { ...m, leido: true } : m))
            setRespondidoOk(id)
            setRespondiendo(null)
            setTextoRespuesta('')
            // Limpiar el tick de éxito después de 3 segundos
            setTimeout(() => setRespondidoOk(null), 3000)
        } catch (err) {
            const msg = err.response?.data?.message || 'Error al enviar la respuesta'
            alert(msg)
        } finally {
            setEnviandoRespuesta(false)
        }
    }

    const abrirResponder = (id) => {
        setRespondiendo(prev => prev === id ? null : id)
        setTextoRespuesta('')
    }

    const mensajesFiltrados = filtro === 'noLeidos'
        ? mensajes.filter(m => !m.leido)
        : mensajes

    const noLeidos = mensajes.filter(m => !m.leido).length

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
            <Navbar />
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '4px' }}>Mensajes</h1>
                        {noLeidos > 0 && (
                            <p style={{ fontSize: '13px', color: 'var(--color-accent)' }}>{noLeidos} sin leer</p>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['todos', 'noLeidos'].map(f => (
                            <button key={f} onClick={() => setFiltro(f)} style={{
                                background: filtro === f ? 'var(--color-accent)' : 'transparent',
                                color: filtro === f ? '#0f0f0f' : 'var(--color-text-2)',
                                border: `1px solid ${filtro === f ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                borderRadius: '20px', padding: '5px 14px', fontSize: '13px', cursor: 'pointer'
                            }}>
                                {f === 'todos' ? 'Todos' : 'Sin leer'}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <p style={{ color: 'var(--color-text-2)' }}>Cargando mensajes...</p>
                ) : mensajesFiltrados.length === 0 ? (
                    <div style={{
                        background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)', padding: '48px', textAlign: 'center'
                    }}>
                        <p style={{ color: 'var(--color-text-2)' }}>
                            {filtro === 'noLeidos' ? 'No tenes mensajes sin leer' : 'Todavia no recibiste mensajes'}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {mensajesFiltrados.map(m => (
                            <div key={m.id} style={{
                                background: 'var(--color-bg-2)',
                                border: `1px solid ${!m.leido ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                borderRadius: 'var(--radius)',
                                opacity: m.leido && respondidoOk !== m.id ? 0.8 : 1,
                                transition: 'opacity 0.2s'
                            }}>
                                {/* Cabecera del mensaje */}
                                <div style={{ padding: '18px 20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                                {!m.leido && (
                                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-accent)', flexShrink: 0 }} />
                                                )}
                                                <span style={{ fontWeight: '500', fontSize: '15px' }}>{m.nombre}</span>
                                                {m.email && (
                                                    <span style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>{m.email}</span>
                                                )}
                                                {respondidoOk === m.id && (
                                                    <span style={{ fontSize: '12px', color: 'var(--color-success)', background: '#4caf8218', padding: '2px 8px', borderRadius: '20px' }}>
                                                        ✓ Respuesta enviada
                                                    </span>
                                                )}
                                            </div>

                                            {m.piezaId && usuario?.slug && (
                                                <Link
                                                    to={`/artesano/${usuario.slug}/pieza/${m.piezaId}`}
                                                    style={{ fontSize: '12px', color: 'var(--color-accent)', marginBottom: '8px', display: 'block' }}
                                                >
                                                    Ver pieza consultada →
                                                </Link>
                                            )}

                                            <p style={{ fontSize: '14px', color: 'var(--color-text-2)', lineHeight: '1.6' }}>
                                                {m.mensaje}
                                            </p>

                                            <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '8px' }}>
                                                {formatearFecha(m.fecha)}
                                            </p>
                                        </div>

                                        {/* Acciones */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                                            {m.email ? (
                                                <button
                                                    onClick={() => abrirResponder(m.id)}
                                                    style={{
                                                        background: respondiendo === m.id ? 'var(--color-accent)' : 'transparent',
                                                        border: '1px solid var(--color-accent)',
                                                        borderRadius: 'var(--radius-sm)', padding: '6px 14px',
                                                        color: respondiendo === m.id ? '#0f0f0f' : 'var(--color-accent)',
                                                        fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: '500'
                                                    }}
                                                >
                                                    {respondiendo === m.id ? '▲ Cerrar' : '↩ Responder'}
                                                </button>
                                            ) : (
                                                <span style={{ fontSize: '11px', color: 'var(--color-text-3)', maxWidth: '100px', textAlign: 'center', lineHeight: '1.4' }}>
                                                    Sin email de contacto
                                                </span>
                                            )}
                                            {!m.leido && (
                                                <button onClick={() => marcarLeido(m.id)} style={{
                                                    background: 'transparent', border: '1px solid var(--color-border)',
                                                    borderRadius: 'var(--radius-sm)', padding: '6px 12px',
                                                    color: 'var(--color-text-2)', fontSize: '12px',
                                                    cursor: 'pointer', whiteSpace: 'nowrap'
                                                }}>
                                                    Marcar leído
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Panel de respuesta — se despliega al presionar Responder */}
                                {respondiendo === m.id && (
                                    <div style={{
                                        borderTop: '1px solid var(--color-border)',
                                        padding: '16px 20px',
                                        background: 'var(--color-bg-3)'
                                    }}>
                                        <p style={{ fontSize: '13px', color: 'var(--color-text-2)', marginBottom: '10px' }}>
                                            Responder a <strong>{m.nombre}</strong> ({m.email})
                                        </p>
                                        <textarea
                                            value={textoRespuesta}
                                            onChange={e => setTextoRespuesta(e.target.value)}
                                            rows={4}
                                            placeholder="Escribí tu respuesta..."
                                            style={{
                                                width: '100%', background: 'var(--color-bg-2)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                                                color: 'var(--color-text)', fontSize: '14px',
                                                outline: 'none', resize: 'vertical', boxSizing: 'border-box'
                                            }}
                                        />
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => { setRespondiendo(null); setTextoRespuesta('') }}
                                                style={{
                                                    background: 'transparent', border: '1px solid var(--color-border)',
                                                    borderRadius: 'var(--radius-sm)', padding: '8px 16px',
                                                    color: 'var(--color-text-2)', fontSize: '13px', cursor: 'pointer'
                                                }}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={() => handleResponder(m.id)}
                                                disabled={enviandoRespuesta || !textoRespuesta.trim()}
                                                style={{
                                                    background: 'var(--color-accent)', color: '#0f0f0f', border: 'none',
                                                    borderRadius: 'var(--radius-sm)', padding: '8px 20px',
                                                    fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                                                    opacity: (enviandoRespuesta || !textoRespuesta.trim()) ? 0.6 : 1
                                                }}
                                            >
                                                {enviandoRespuesta ? 'Enviando...' : 'Enviar respuesta'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
