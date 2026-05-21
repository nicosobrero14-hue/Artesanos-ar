import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

/*
 * Chat interno con polling.
 *
 * Layout dos columnas:
 *  - Izquierda: lista de conversaciones (polling cada 15s)
 *  - Derecha: chat activo con mensajes (polling cada 5s mientras está abierto)
 *
 * Pollings se pausan cuando la pestaña no está visible.
 *
 * Se puede abrir un chat con un usuario específico desde otra parte de la app
 * navegando a /chat?con={idDelOtro}
 *
 * Conversaciones con admin:
 *  - El usuario las abre solo en lectura por defecto.
 *  - Si el admin habilita la respuesta, el input se desbloquea.
 *  - El usuario puede eliminar la conversación de su lado (no afecta al admin).
 */
export default function Chat() {
    const { usuario } = useAuth()
    const soyAdmin = usuario?.rol === 'ADMIN'

    const [params] = useSearchParams()
    const conIdParam = params.get('con')
    const mensajePrellenado = params.get('mensaje')

    const [conversaciones, setConversaciones] = useState([])
    const [activa, setActiva] = useState(null)  // DetalleDTO
    const [texto, setTexto] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [loadingList, setLoadingList] = useState(true)
    const ultimoIdRef = useRef(0)
    const scrollRef = useRef(null)

    // Polling de la lista
    useEffect(() => {
        const tick = () => {
            if (document.hidden) return
            api.get('/chat')
                .then(res => setConversaciones(res.data))
                .catch(() => {})
                .finally(() => setLoadingList(false))
        }
        tick()
        const id = setInterval(tick, 15000)
        return () => clearInterval(id)
    }, [])

    // Si llega ?con=X, abrir esa conversación
    // Si además llega ?mensaje=..., lo escribimos en el input para que el usuario
    // pueda editarlo antes de enviar (sin auto-send para no mandar sin querer).
    useEffect(() => {
        if (conIdParam) abrirCon(Number(conIdParam))
        if (mensajePrellenado) setTexto(mensajePrellenado)
    }, [conIdParam, mensajePrellenado])

    // Polling de mensajes en la conversación activa
    useEffect(() => {
        if (!activa) return
        const tick = async () => {
            if (document.hidden) return
            try {
                const { data } = await api.get(`/chat/${activa.id}/mensajes?desde=${ultimoIdRef.current}`)
                if (data.mensajes && data.mensajes.length > 0) {
                    setActiva(prev => ({
                        ...prev,
                        mensajes: [...prev.mensajes, ...data.mensajes]
                    }))
                    ultimoIdRef.current = data.mensajes[data.mensajes.length - 1].id
                }
            } catch {}
        }
        const id = setInterval(tick, 5000)
        return () => clearInterval(id)
    }, [activa?.id])

    // Auto-scroll al fondo cuando llegan mensajes nuevos
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, [activa?.mensajes?.length])

    const abrirCon = async (otroId) => {
        try {
            const { data } = await api.get(`/chat/con/${otroId}`)
            setActiva(data)
            ultimoIdRef.current = data.mensajes.length > 0
                ? data.mensajes[data.mensajes.length - 1].id : 0
            // Refrescar lista para actualizar no-leídos
            api.get('/chat').then(res => setConversaciones(res.data)).catch(() => {})
        } catch (err) {
            alert(err.response?.data?.message || 'No se pudo abrir el chat')
        }
    }

    const abrirConvo = (c) => abrirCon(c.otroId)

    // Banderas derivadas de la conversación activa
    const conversacionConAdmin = activa && (activa.otroEsAdmin || soyAdmin)
    const respuestaHabilitada = !activa || activa.respuestaHabilitada !== false
    // Para el usuario regular hablando con admin: solo puede enviar si está habilitado
    const puedoEnviar = !activa
        ? false
        : soyAdmin || !activa.otroEsAdmin || respuestaHabilitada

    /*
     * Vaciar el chat actual: borra los mensajes pero mantiene la conversación.
     * Afecta a AMBOS participantes — solo disponible entre usuarios regulares.
     */
    const vaciarChat = async () => {
        if (!activa) return
        const ok = confirm(
            `¿Vaciar todos los mensajes de este chat con ${activa.otroNombre}?\n\n` +
            `⚠️ Los mensajes se borran para ambos lados (vos y la otra persona).\n` +
            `Esta acción no se puede deshacer.`
        )
        if (!ok) return
        try {
            await api.delete(`/chat/${activa.id}/mensajes`)
            setActiva(prev => ({ ...prev, mensajes: [] }))
            ultimoIdRef.current = 0
            api.get('/chat').then(res => setConversaciones(res.data)).catch(() => {})
        } catch (err) {
            alert(err.response?.data?.message || 'Error al vaciar el chat')
        }
    }

    /*
     * Eliminar la conversación.
     * - Entre usuarios regulares: borrado bilateral.
     * - Con admin: soft-delete (solo del lado del que pide).
     */
    const eliminarConversacion = async () => {
        if (!activa) return
        const conAdmin = activa.otroEsAdmin || soyAdmin
        const mensaje = conAdmin
            ? `¿Eliminar la conversación con ${activa.otroNombre} de tu lado?\n\n` +
              `La otra persona la sigue viendo. Si llega un mensaje nuevo, vuelve a aparecer.`
            : `¿Eliminar la conversación con ${activa.otroNombre}?\n\n` +
              `⚠️ Se borra todo el historial para ambos lados.\n` +
              `Si vuelven a chatear se crea una conversación nueva.`
        const ok = confirm(mensaje)
        if (!ok) return
        try {
            await api.delete(`/chat/${activa.id}`)
            setActiva(null)
            ultimoIdRef.current = 0
            api.get('/chat').then(res => setConversaciones(res.data)).catch(() => {})
        } catch (err) {
            alert(err.response?.data?.message || 'Error al eliminar la conversación')
        }
    }

    /*
     * Solo admin: togglear si el usuario puede responder.
     */
    const toggleRespuesta = async () => {
        if (!activa || !soyAdmin) return
        try {
            const { data } = await api.post(`/chat/${activa.id}/toggle-respuesta`)
            setActiva(prev => ({ ...prev, respuestaHabilitada: data.respuestaHabilitada }))
        } catch (err) {
            alert(err.response?.data?.message || 'Error al cambiar el estado')
        }
    }

    const enviar = async (e) => {
        e.preventDefault()
        if (!texto.trim() || !activa || enviando) return
        setEnviando(true)
        try {
            const { data } = await api.post(`/chat/${activa.id}/mensajes`, { texto })
            setActiva(prev => ({ ...prev, mensajes: [...prev.mensajes, data] }))
            ultimoIdRef.current = data.id
            setTexto('')
            // Refrescar lista (cambió ultimo mensaje y actividad)
            api.get('/chat').then(res => setConversaciones(res.data)).catch(() => {})
        } catch (err) {
            alert(err.response?.data?.message || 'Error al enviar')
        } finally {
            setEnviando(false)
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            <div style={{ flex: 1, display: 'flex', maxWidth: '1100px', margin: '0 auto', padding: '20px', gap: '16px', width: '100%', boxSizing: 'border-box' }}>

                {/* Lista de conversaciones */}
                <div style={{
                    width: '320px', flexShrink: 0,
                    background: 'var(--color-bg-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    overflow: 'hidden',
                    display: 'flex', flexDirection: 'column'
                }}>
                    <div style={{
                        padding: '14px 16px', borderBottom: '1px solid var(--color-border)',
                        fontSize: '15px', fontWeight: '600'
                    }}>
                        💬 Mis chats
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {loadingList ? (
                            <p style={{ padding: '24px', color: 'var(--color-text-3)', fontSize: '13px' }}>
                                Cargando...
                            </p>
                        ) : conversaciones.length === 0 ? (
                            <p style={{ padding: '24px', color: 'var(--color-text-3)', fontSize: '13px' }}>
                                Sin chats. Iniciá uno desde el catálogo de otro artesano.
                            </p>
                        ) : (
                            conversaciones.map(c => (
                                <button key={c.id} onClick={() => abrirConvo(c)} style={{
                                    width: '100%', background: activa?.otroId === c.otroId ? 'var(--color-bg-3)' : 'transparent',
                                    border: 'none', borderBottom: '1px solid var(--color-border)',
                                    padding: '12px 14px', cursor: 'pointer',
                                    display: 'flex', gap: '10px', alignItems: 'center',
                                    textAlign: 'left'
                                }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        background: 'var(--color-bg-3)', flexShrink: 0,
                                        border: '1px solid var(--color-border)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '15px', fontWeight: '600', color: 'var(--color-accent)',
                                        overflow: 'hidden'
                                    }}>
                                        {c.otroAvatarUrl
                                            ? <img src={c.otroAvatarUrl} alt={c.otroNombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : c.otroNombre?.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px' }}>
                                            <span style={{ fontSize: '14px', fontWeight: c.noLeidos > 0 ? '600' : '500', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {c.otroNombre}
                                                {c.otroEsAdmin && (
                                                    <span style={{
                                                        marginLeft: '6px', fontSize: '9px', fontWeight: '700',
                                                        background: 'var(--color-accent)', color: '#0f0f0f',
                                                        padding: '1px 5px', borderRadius: '3px', letterSpacing: '0.5px',
                                                        verticalAlign: 'middle'
                                                    }}>ADMIN</span>
                                                )}
                                            </span>
                                            {c.noLeidos > 0 && (
                                                <span style={{
                                                    background: 'var(--color-accent)', color: '#0f0f0f',
                                                    fontSize: '10px', fontWeight: '700',
                                                    padding: '1px 7px', borderRadius: '20px', flexShrink: 0
                                                }}>{c.noLeidos}</span>
                                            )}
                                        </div>
                                        <p style={{
                                            fontSize: '12px',
                                            color: c.noLeidos > 0 ? 'var(--color-text)' : 'var(--color-text-3)',
                                            marginTop: '2px',
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                        }}>
                                            {c.ultimoLoEnvieYo && 'Vos: '}{c.ultimoMensaje || 'Sin mensajes'}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat activo */}
                <div style={{
                    flex: 1,
                    background: 'var(--color-bg-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                    minHeight: '500px'
                }}>
                    {!activa ? (
                        <div style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--color-text-3)', fontSize: '14px', textAlign: 'center', padding: '20px'
                        }}>
                            <div>
                                <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
                                <p>Elegí una conversación a la izquierda</p>
                                <p style={{ fontSize: '12px', marginTop: '6px' }}>
                                    O entrá a un catálogo y tocá "Iniciar chat"
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Header del chat */}
                            <div style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid var(--color-border)',
                                display: 'flex', alignItems: 'center', gap: '12px'
                            }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    background: 'var(--color-bg-3)', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '14px', fontWeight: '600', color: 'var(--color-accent)',
                                    overflow: 'hidden'
                                }}>
                                    {activa.otroAvatarUrl
                                        ? <img src={activa.otroAvatarUrl} alt={activa.otroNombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : activa.otroNombre?.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '14px', fontWeight: '600' }}>
                                        {activa.otroNombre}
                                        {activa.otroEsAdmin && (
                                            <span style={{
                                                marginLeft: '8px', fontSize: '10px', fontWeight: '700',
                                                background: 'var(--color-accent)', color: '#0f0f0f',
                                                padding: '2px 6px', borderRadius: '3px', letterSpacing: '0.5px',
                                                verticalAlign: 'middle'
                                            }}>ADMIN</span>
                                        )}
                                    </p>
                                    {activa.otroSlug && !activa.otroEsAdmin && (
                                        <Link to={`/artesano/${activa.otroSlug}`} style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>
                                            Ver catálogo →
                                        </Link>
                                    )}
                                </div>
                                {/* Acciones del chat activo */}
                                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                    {/* Toggle respuesta — solo admin */}
                                    {soyAdmin && (
                                        <button onClick={toggleRespuesta} title={activa.respuestaHabilitada ? 'Deshabilitar respuestas del usuario' : 'Habilitar respuestas del usuario'} style={{
                                            background: activa.respuestaHabilitada ? 'transparent' : 'var(--color-accent)',
                                            border: '1px solid var(--color-accent)',
                                            borderRadius: 'var(--radius-sm)', padding: '5px 10px',
                                            color: activa.respuestaHabilitada ? 'var(--color-accent)' : '#0f0f0f',
                                            fontSize: '11px', fontWeight: '600', cursor: 'pointer'
                                        }}>
                                            {activa.respuestaHabilitada ? '🔓 Respuesta ON' : '🔒 Respuesta OFF'}
                                        </button>
                                    )}
                                    {/* Vaciar solo si NO involucra admin */}
                                    {!conversacionConAdmin && (
                                        <button onClick={vaciarChat} title="Vaciar mensajes del chat" style={{
                                            background: 'transparent', border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-sm)', padding: '5px 10px',
                                            color: 'var(--color-text-2)', fontSize: '12px', cursor: 'pointer'
                                        }}>🧹 Vaciar</button>
                                    )}
                                    <button onClick={eliminarConversacion} title={conversacionConAdmin ? 'Eliminar de mi lado' : 'Eliminar conversación completa'} style={{
                                        background: 'transparent', border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)', padding: '5px 10px',
                                        color: 'var(--color-danger)', fontSize: '12px', cursor: 'pointer'
                                    }}>🗑</button>
                                </div>
                            </div>

                            {/* Banner de read-only para usuario regular hablando con admin */}
                            {activa.otroEsAdmin && !soyAdmin && !respuestaHabilitada && (
                                <div style={{
                                    padding: '10px 16px', background: '#3a2e1a',
                                    borderBottom: '1px solid var(--color-border)',
                                    fontSize: '12px', color: '#f0c674', textAlign: 'center'
                                }}>
                                    🔒 Conversación de solo lectura. El admin no habilitó las respuestas.
                                </div>
                            )}

                            {/* Mensajes */}
                            <div ref={scrollRef} style={{
                                flex: 1, overflowY: 'auto',
                                padding: '16px',
                                display: 'flex', flexDirection: 'column', gap: '8px'
                            }}>
                                {activa.mensajes.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: 'var(--color-text-3)', fontSize: '13px', marginTop: '40px' }}>
                                        Decile hola a {activa.otroNombre}
                                    </p>
                                ) : activa.mensajes.map(m => (
                                    <div key={m.id} style={{
                                        alignSelf: m.esMio ? 'flex-end' : 'flex-start',
                                        maxWidth: '70%',
                                        background: m.esMio ? 'var(--color-accent)' : 'var(--color-bg-3)',
                                        color: m.esMio ? '#0f0f0f' : 'var(--color-text)',
                                        padding: '8px 12px',
                                        borderRadius: m.esMio ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                                        fontSize: '14px',
                                        lineHeight: '1.4',
                                        wordBreak: 'break-word'
                                    }}>
                                        <p style={{ whiteSpace: 'pre-wrap' }}>{m.texto}</p>
                                        <p style={{
                                            fontSize: '10px',
                                            opacity: 0.6,
                                            textAlign: 'right',
                                            marginTop: '3px'
                                        }}>
                                            {formatHora(m.fecha)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Input — oculto en modo lectura */}
                            {puedoEnviar ? (
                                <form onSubmit={enviar} style={{
                                    padding: '12px 16px',
                                    borderTop: '1px solid var(--color-border)',
                                    display: 'flex', gap: '8px'
                                }}>
                                    <input
                                        value={texto}
                                        onChange={e => setTexto(e.target.value)}
                                        placeholder="Escribí un mensaje..."
                                        maxLength={2000}
                                        style={{
                                            flex: 1, background: 'var(--color-bg-3)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '20px', padding: '10px 16px',
                                            color: 'var(--color-text)', fontSize: '14px', outline: 'none'
                                        }} />
                                    <button type="submit" disabled={enviando || !texto.trim()} style={{
                                        background: 'var(--color-accent)', color: '#0f0f0f',
                                        border: 'none', borderRadius: '20px', padding: '10px 18px',
                                        fontSize: '13px', fontWeight: '600',
                                        cursor: (enviando || !texto.trim()) ? 'not-allowed' : 'pointer',
                                        opacity: (enviando || !texto.trim()) ? 0.5 : 1
                                    }}>
                                        Enviar
                                    </button>
                                </form>
                            ) : (
                                <div style={{
                                    padding: '14px 16px',
                                    borderTop: '1px solid var(--color-border)',
                                    fontSize: '12px', color: 'var(--color-text-3)',
                                    textAlign: 'center', fontStyle: 'italic'
                                }}>
                                    No podés responder en esta conversación
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

function formatHora(fecha) {
    if (!fecha) return ''
    const d = Array.isArray(fecha)
        ? new Date(fecha[0], fecha[1] - 1, fecha[2], fecha[3] || 0, fecha[4] || 0)
        : new Date(fecha)
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}
