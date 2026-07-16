import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

/*
 * Banner interactivo de próximos eventos.
 *
 * Diseño rediseñado:
 *  - Card de mayor altura, fondo con gradiente animado según urgencia
 *  - Countdown en tiempo real ("Faltan 3 días, 14 hs")
 *  - Avatares de los primeros 3 participantes confirmados
 *  - Botones manuales ‹ › para navegar entre eventos
 *  - Auto-rotación cada 8 segundos (más lento que antes para poder leer)
 *  - Si el usuario hace hover, pausa la auto-rotación
 *  - Si hay un solo evento, no muestra controles ni paginación
 *
 * Si no hay eventos, no se renderiza nada.
 */
export default function BannerEventos({ eventos }) {
    const [indice, setIndice] = useState(0)
    const [pausado, setPausado] = useState(false)

    useEffect(() => {
        if (!eventos || eventos.length <= 1 || pausado) return
        const timer = setInterval(() => {
            setIndice(i => (i + 1) % eventos.length)
        }, 8000)
        return () => clearInterval(timer)
    }, [eventos, pausado])

    if (!eventos || eventos.length === 0) return null

    const evento = eventos[indice]
    const meta = calcularMeta(evento)

    const ir = (dir) => {
        setIndice(i => (i + dir + eventos.length) % eventos.length)
    }

    return (
        <div
            onMouseEnter={() => setPausado(true)}
            onMouseLeave={() => setPausado(false)}
            style={{
                background: meta.fondo,
                borderBottom: '1px solid var(--color-border)',
                padding: '20px 24px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'background 0.6s'
            }}
        >
            {/* Decoración SVG-like sutil */}
            <div style={{
                position: 'absolute', top: '-30%', right: '-5%',
                width: '300px', height: '300px',
                borderRadius: '50%',
                background: meta.glow,
                filter: 'blur(60px)',
                pointerEvents: 'none'
            }} />

            <div style={{
                maxWidth: '1100px', margin: '0 auto',
                display: 'flex', alignItems: 'center', gap: '20px',
                position: 'relative', zIndex: 1, flexWrap: 'wrap'
            }}>
                {/* Icono / pulso */}
                <div style={{
                    width: '64px', height: '64px', flexShrink: 0,
                    borderRadius: '50%',
                    background: meta.iconoBg,
                    border: `2px solid ${meta.iconoBorde}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '28px',
                    position: 'relative'
                }}>
                    {meta.enCurso && (
                        <span style={{
                            position: 'absolute', inset: 0,
                            borderRadius: '50%',
                            border: `2px solid ${meta.iconoBorde}`,
                            animation: 'pulse 2s infinite'
                        }} />
                    )}
                    {meta.icono}
                </div>

                {/* Info principal */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{
                            fontSize: '11px', fontWeight: '700',
                            background: meta.iconoBorde, color: '#0f0f0f',
                            padding: '3px 10px', borderRadius: '20px',
                            textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                            {meta.estadoLabel}
                        </span>
                        <span style={{
                            fontSize: '11px', color: 'var(--color-text-3)',
                            textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                            {meta.fechaTexto}
                        </span>
                    </div>
                    <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '4px', lineHeight: '1.3' }}>
                        {evento.nombre}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
                            ◉ {evento.ubicacion}
                        </span>
                        {evento.participantesCount > 0 && (
                            <Participantes participantes={evento.participantes} total={evento.participantesCount} />
                        )}
                    </div>
                </div>

                {/* Countdown grande (solo si no está en curso) */}
                {meta.countdown && (
                    <div style={{
                        textAlign: 'center',
                        background: 'rgba(0,0,0,0.25)',
                        borderRadius: 'var(--radius)',
                        padding: '10px 18px',
                        flexShrink: 0
                    }}>
                        <p style={{
                            fontSize: '20px', fontWeight: '700', color: 'var(--color-text)',
                            fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: '4px'
                        }}>
                            {meta.countdown}
                        </p>
                        <p style={{ fontSize: '10px', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            faltan
                        </p>
                    </div>
                )}

                {/* CTA */}
                <Link to="/eventos" style={{
                    background: 'var(--color-accent)', color: '#0f0f0f',
                    padding: '10px 20px', borderRadius: 'var(--radius-sm)',
                    fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap',
                    flexShrink: 0
                }}>
                    Ver todos →
                </Link>
            </div>

            {/* Controles de navegación */}
            {eventos.length > 1 && (
                <>
                    <button onClick={() => ir(-1)} style={btnNav('left')} aria-label="Evento anterior">‹</button>
                    <button onClick={() => ir(1)} style={btnNav('right')} aria-label="Evento siguiente">›</button>

                    {/* Indicadores clickeables */}
                    <div style={{
                        position: 'absolute', bottom: '6px', left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex', gap: '6px', zIndex: 2
                    }}>
                        {eventos.map((_, i) => (
                            <button key={i} onClick={() => setIndice(i)} aria-label={`Ir al evento ${i + 1}`} style={{
                                width: i === indice ? '20px' : '6px',
                                height: '4px',
                                background: i === indice ? 'var(--color-accent)' : 'var(--color-text-3)',
                                borderRadius: '2px',
                                border: 'none', padding: 0, cursor: 'pointer',
                                transition: 'all 0.3s'
                            }} />
                        ))}
                    </div>
                </>
            )}

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.6; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
            `}</style>
        </div>
    )
}

function Participantes({ participantes, total }) {
    const visibles = (participantes || []).slice(0, 3)
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ display: 'flex' }}>
                {visibles.map((p, i) => (
                    <div key={p.id} title={p.nombre} style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: 'var(--color-bg-3)',
                        border: '2px solid var(--color-bg)',
                        marginLeft: i === 0 ? 0 : '-8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: '600', color: 'var(--color-accent)',
                        overflow: 'hidden', position: 'relative', zIndex: 3 - i
                    }}>
                        {p.avatarUrl
                            ? <img src={p.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : p.nombre?.charAt(0).toUpperCase()}
                    </div>
                ))}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>
                {total} {total === 1 ? 'artesano' : 'artesanos'}
            </span>
        </div>
    )
}

function btnNav(lado) {
    return {
        position: 'absolute',
        [lado]: '8px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'rgba(0,0,0,0.4)',
        border: 'none',
        borderRadius: '50%',
        width: '32px', height: '32px',
        color: 'white',
        fontSize: '20px',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2,
        lineHeight: 1, paddingBottom: '2px'
    }
}

/*
 * Calcula metadata visual y countdown del evento según su urgencia.
 */
function calcularMeta(evento) {
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
    const dInicio = new Date(evento.fechaInicio)
    const dFin = new Date(evento.fechaFin)

    const fechaTexto = evento.fechaInicio === evento.fechaFin
        ? `${dInicio.getUTCDate()} de ${meses[dInicio.getUTCMonth()]}`
        : dInicio.getUTCMonth() === dFin.getUTCMonth()
            ? `${dInicio.getUTCDate()} al ${dFin.getUTCDate()} de ${meses[dInicio.getUTCMonth()]}`
            : `${dInicio.getUTCDate()} ${meses[dInicio.getUTCMonth()]} - ${dFin.getUTCDate()} ${meses[dFin.getUTCMonth()]}`

    const ahora = new Date()
    const msInicio = dInicio.getTime() - ahora.getTime()
    const diasInicio = Math.floor(msInicio / (1000 * 60 * 60 * 24))
    const hsInicio = Math.floor((msInicio % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    const enCurso = ahora >= dInicio && ahora <= new Date(dFin.getTime() + 86400000)
    const esInminente = diasInicio >= 0 && diasInicio <= 7

    let countdown = null
    if (!enCurso && msInicio > 0) {
        if (diasInicio > 0) {
            countdown = `${diasInicio}d ${hsInicio}h`
        } else if (hsInicio > 0) {
            countdown = `${hsInicio} hs`
        } else {
            const minutos = Math.floor(msInicio / (1000 * 60))
            countdown = `${minutos} min`
        }
    }

    if (enCurso) {
        return {
            estadoLabel: '🟢 ESTÁ PASANDO AHORA',
            icono: '🎪',
            iconoBorde: 'var(--color-success)',
            iconoBg: '#4caf8233',
            fondo: 'rgba(76, 175, 130, 0.14)',
            glow: 'rgba(76, 175, 130, 0.3)',
            fechaTexto, countdown: null, enCurso: true
        }
    }
    if (esInminente) {
        return {
            estadoLabel: '🔥 SE VIENE',
            icono: '⚡',
            iconoBorde: 'var(--color-premium)',
            iconoBg: '#f5b94f33',
            fondo: 'rgba(245, 185, 79, 0.12)',
            glow: 'rgba(245, 185, 79, 0.3)',
            fechaTexto, countdown, enCurso: false
        }
    }
    return {
        estadoLabel: '📅 PRÓXIMO',
        icono: '📅',
        iconoBorde: 'var(--color-accent)',
        iconoBg: 'var(--color-bg-3)',
        fondo: 'rgba(76, 175, 130, 0.07)',
        glow: 'rgba(76, 175, 130, 0.2)',
        fechaTexto, countdown, enCurso: false
    }
}
