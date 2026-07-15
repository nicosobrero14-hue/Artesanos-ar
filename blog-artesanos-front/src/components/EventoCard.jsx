import { Link } from 'react-router-dom'
import api from '../api/axios'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useConfirm } from '../context/ConfirmContext'
import { useToast } from '../context/ToastContext'

/*
 * Card de evento reusable. Modo "compact" para el banner del home,
 * modo normal para la página /eventos y para "mis eventos".
 *
 * Si el usuario logueado es el autor o admin, muestra acciones de editar/eliminar.
 * Si no es el autor pero está logueado, muestra botón "Voy a estar" / "No voy".
 */
export default function EventoCard({ evento, onChange, onEditar, onEliminar, compact = false }) {
    const { usuario } = useAuth()
    const confirm = useConfirm()
    const toast = useToast()
    const [enviando, setEnviando] = useState(false)

    const handleSumarme = async () => {
        if (!usuario) {
            window.location.href = `/login?next=${window.location.pathname}`
            return
        }
        setEnviando(true)
        try {
            const { data } = await api.post(`/eventos/${evento.id}/sumarme`)
            onChange?.(data)
        } catch (err) {
            toast(err.response?.data?.message || 'Error al sumarte', 'error')
        } finally {
            setEnviando(false)
        }
    }

    const handleEliminar = async () => {
        if (!await confirm({ mensaje: `¿Eliminar el evento "${evento.nombre}"?`, confirmLabel: 'Eliminar', danger: true })) return
        try {
            await api.delete(`/eventos/${evento.id}`)
            onEliminar?.(evento.id)
        } catch (err) {
            toast(err.response?.data?.message || 'Error al eliminar', 'error')
        }
    }

    return (
        <div style={{
            background: 'var(--color-bg-2)',
            border: `1px solid ${evento.aprobado ? 'var(--color-border)' : '#f5b94f55'}`,
            borderRadius: 'var(--radius)',
            padding: compact ? '14px 16px' : '20px',
            position: 'relative',
            transition: 'border-color 0.15s'
        }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = evento.aprobado ? 'var(--color-border)' : '#f5b94f55'}>

            {/* Badge si está pendiente — solo visible al autor o admin */}
            {!evento.aprobado && (
                <span style={{
                    position: 'absolute', top: '12px', right: '12px',
                    fontSize: '10px', fontWeight: '700',
                    background: '#f5b94f22', color: 'var(--color-premium)',
                    padding: '3px 9px', borderRadius: '20px',
                    border: '1px solid #f5b94f55'
                }}>
                    PENDIENTE
                </span>
            )}

            <FechasBadge inicio={evento.fechaInicio} fin={evento.fechaFin} />

            <h3 style={{
                fontSize: compact ? '15px' : '17px',
                fontWeight: '600',
                marginTop: '12px',
                marginBottom: '6px',
                lineHeight: '1.3'
            }}>
                {evento.nombre}
            </h3>

            <p style={{
                fontSize: '13px',
                color: 'var(--color-text-2)',
                marginBottom: '8px',
                display: 'flex', alignItems: 'center', gap: '6px'
            }}>
                <span>◉</span> {evento.ubicacion}
                {evento.urlMaps && (
                    <a href={evento.urlMaps} target="_blank" rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ color: 'var(--color-accent)', fontSize: '12px', marginLeft: '4px' }}>
                        Ver mapa ↗
                    </a>
                )}
            </p>

            {!compact && evento.descripcion && (
                <p style={{
                    fontSize: '13px',
                    color: 'var(--color-text-2)',
                    lineHeight: '1.6',
                    marginBottom: '12px',
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                }}>
                    {evento.descripcion}
                </p>
            )}

            <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginBottom: '12px' }}>
                Publicado por{' '}
                <Link to={`/artesano/${evento.autorSlug}`} style={{ color: 'var(--color-accent)' }}>
                    {evento.autorNombre}
                </Link>
            </p>

            {/* Participantes */}
            {!compact && evento.participantes?.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                        {evento.participantesCount} {evento.participantesCount === 1 ? 'artesano confirmado' : 'artesanos confirmados'}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {evento.participantes.slice(0, 6).map(p => (
                            <Link key={p.id} to={`/artesano/${p.slug}`} title={p.nombre}
                                style={{
                                    width: '28px', height: '28px', borderRadius: '50%',
                                    background: 'var(--color-bg-3)',
                                    border: '1px solid var(--color-border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '11px', fontWeight: '600', color: 'var(--color-accent)',
                                    overflow: 'hidden', textDecoration: 'none'
                                }}>
                                {p.avatarUrl
                                    ? <img src={p.avatarUrl} alt={p.nombre}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : p.nombre?.charAt(0).toUpperCase()}
                            </Link>
                        ))}
                        {evento.participantesCount > 6 && (
                            <span style={{
                                fontSize: '11px', color: 'var(--color-text-3)',
                                display: 'flex', alignItems: 'center', paddingLeft: '4px'
                            }}>
                                +{evento.participantesCount - 6}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Acciones */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {evento.aprobado && !evento.soyAutor && (
                    <button onClick={handleSumarme} disabled={enviando} style={{
                        background: evento.soyParticipante ? 'var(--color-bg-3)' : 'var(--color-accent)',
                        color: evento.soyParticipante ? 'var(--color-text-2)' : '#0f0f0f',
                        border: `1px solid ${evento.soyParticipante ? 'var(--color-border)' : 'var(--color-accent)'}`,
                        borderRadius: 'var(--radius-sm)',
                        padding: '7px 14px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: enviando ? 'wait' : 'pointer'
                    }}>
                        {evento.soyParticipante ? '✓ Voy a estar' : '+ Voy a estar'}
                    </button>
                )}

                {(evento.soyAutor || usuario?.rol === 'ADMIN') && (
                    <>
                        {onEditar && evento.soyAutor && (
                            <button onClick={() => onEditar(evento)} style={{
                                background: 'transparent',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '7px 12px',
                                color: 'var(--color-text-2)',
                                fontSize: '13px',
                                cursor: 'pointer'
                            }}>
                                Editar
                            </button>
                        )}
                        <button onClick={handleEliminar} style={{
                            background: 'transparent',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '7px 12px',
                            color: 'var(--color-danger)',
                            fontSize: '13px',
                            cursor: 'pointer'
                        }}>
                            Eliminar
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}

/*
 * Badge con fechas. Si es un solo día muestra "15 nov", si son varios "15-17 nov".
 */
function FechasBadge({ inicio, fin }) {
    const dInicio = new Date(inicio)
    const dFin = new Date(fin)
    const mesesEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

    let texto
    if (inicio === fin) {
        texto = `${dInicio.getUTCDate()} ${mesesEs[dInicio.getUTCMonth()]}`
    } else if (dInicio.getUTCMonth() === dFin.getUTCMonth()) {
        texto = `${dInicio.getUTCDate()}-${dFin.getUTCDate()} ${mesesEs[dInicio.getUTCMonth()]}`
    } else {
        texto = `${dInicio.getUTCDate()} ${mesesEs[dInicio.getUTCMonth()]} - ${dFin.getUTCDate()} ${mesesEs[dFin.getUTCMonth()]}`
    }

    // ¿Es próximo? (en los próximos 7 días)
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const diff = (dInicio - hoy) / (1000 * 60 * 60 * 24)
    const esInminente = diff <= 7 && diff >= 0
    const enCurso = diff < 0 && dFin >= hoy

    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: enCurso ? '#4caf8225' : esInminente ? '#f5b94f25' : 'var(--color-bg-3)',
            border: `1px solid ${enCurso ? 'var(--color-success)' : esInminente ? 'var(--color-premium)' : 'var(--color-border)'}`,
            borderRadius: '20px',
            padding: '4px 12px',
            fontSize: '12px',
            fontWeight: '500',
            color: enCurso ? 'var(--color-success)' : esInminente ? 'var(--color-premium)' : 'var(--color-text-2)'
        }}>
            <span>📅</span>
            <span>{texto}</span>
            {enCurso && <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>· EN CURSO</span>}
            {esInminente && !enCurso && <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>· PRONTO</span>}
        </div>
    )
}
