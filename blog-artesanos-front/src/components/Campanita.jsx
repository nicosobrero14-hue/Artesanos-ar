import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

/*
 * Campanita 🔔 con badge rojo de no-leídas.
 * - Hace polling cada 30 segundos al endpoint liviano /no-leidas (solo el count)
 * - Al click abre dropdown con las últimas 20 notificaciones
 * - Al abrir el dropdown marca todas como leídas en backend
 *
 * Si no hay polling-friendly (la app está inactiva), tampoco pasa nada — el
 * usuario ve las notificaciones la próxima vez que vuelve a la app.
 */
const ICONOS = {
    LIKE_NUEVO: '♥',
    COMENTARIO_NUEVO: '💬',
    RESENA_NUEVA: '★',
    MENSAJE_CONTACTO: '✉',
    EVENTO_APROBADO: '📅',
    EVENTO_PARTICIPANTE: '👥',
    PLAN_UPGRADE: '🎉',
    PLAN_VENCE_PRONTO: '⏰',
    GENERICO: '🔔'
}

export default function Campanita() {
    const [count, setCount] = useState(0)
    const [abierto, setAbierto] = useState(false)
    const [items, setItems] = useState([])
    const [cargando, setCargando] = useState(false)
    const ref = useRef(null)

    /* Poll del count cada 30s mientras la pestaña esté visible */
    useEffect(() => {
        const tick = () => {
            if (document.hidden) return
            api.get('/notificaciones/no-leidas')
                .then(res => setCount(res.data.count))
                .catch(() => {})
        }
        tick()
        const id = setInterval(tick, 30000)
        return () => clearInterval(id)
    }, [])

    /* Cerrar al click fuera */
    useEffect(() => {
        if (!abierto) return
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setAbierto(false)
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [abierto])

    const handleAbrir = async () => {
        if (abierto) { setAbierto(false); return }
        setAbierto(true)
        setCargando(true)
        try {
            const { data } = await api.get('/notificaciones')
            setItems(data)
            // Marcar como leídas
            if (count > 0) {
                await api.post('/notificaciones/marcar-leidas')
                setCount(0)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setCargando(false)
        }
    }

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button onClick={handleAbrir} title="Notificaciones" style={{
                position: 'relative',
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-2)',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px 8px',
                lineHeight: 1
            }}>
                🔔
                {count > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-2px', right: '-2px',
                        background: 'var(--color-danger)',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: '700',
                        borderRadius: '20px',
                        padding: '1px 6px',
                        minWidth: '16px',
                        textAlign: 'center'
                    }}>
                        {count > 99 ? '99+' : count}
                    </span>
                )}
            </button>

            {abierto && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '340px',
                    maxWidth: '90vw',
                    background: 'var(--color-bg-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    zIndex: 200,
                    maxHeight: '420px',
                    overflowY: 'auto'
                }}>
                    <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--color-border)',
                        fontWeight: '500',
                        fontSize: '14px'
                    }}>
                        Notificaciones
                    </div>
                    {cargando ? (
                        <p style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-3)', fontSize: '13px' }}>
                            Cargando...
                        </p>
                    ) : items.length === 0 ? (
                        <p style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-3)', fontSize: '13px' }}>
                            Sin notificaciones todavía
                        </p>
                    ) : (
                        <div>
                            {items.map(n => (
                                <Link
                                    key={n.id}
                                    to={n.url || '/panel'}
                                    onClick={() => setAbierto(false)}
                                    style={{
                                        display: 'block',
                                        padding: '12px 16px',
                                        borderBottom: '1px solid var(--color-border)',
                                        textDecoration: 'none',
                                        background: !n.leida ? 'var(--color-bg-3)' : 'transparent',
                                        transition: 'background 0.15s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-3)'}
                                    onMouseLeave={e => e.currentTarget.style.background = !n.leida ? 'var(--color-bg-3)' : 'transparent'}
                                >
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                        <span style={{ fontSize: '16px', flexShrink: 0 }}>
                                            {ICONOS[n.tipo] || '🔔'}
                                        </span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{
                                                fontSize: '13px',
                                                color: 'var(--color-text)',
                                                lineHeight: '1.4',
                                                marginBottom: '2px'
                                            }}>
                                                {n.mensaje}
                                            </p>
                                            <p style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>
                                                {formatRelativo(n.fecha)}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

/*
 * "hace 5 min", "hace 2 hs", "ayer", "hace 3 días", o fecha exacta si es viejo.
 */
function formatRelativo(fecha) {
    if (!fecha) return ''
    const d = Array.isArray(fecha)
        ? new Date(fecha[0], fecha[1] - 1, fecha[2], fecha[3] || 0, fecha[4] || 0)
        : new Date(fecha)
    const diff = (Date.now() - d.getTime()) / 1000

    if (diff < 60) return 'recién'
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} hs`
    if (diff < 86400 * 2) return 'ayer'
    if (diff < 86400 * 7) return `hace ${Math.floor(diff / 86400)} días`
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}
