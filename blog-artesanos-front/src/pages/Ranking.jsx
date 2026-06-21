import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import CarruselFotos from '../components/CarruselFotos'
import { useAuth } from '../context/AuthContext'
import { useSEO } from '../hooks/useSEO'

/*
 * Ranking público de piezas por engagement.
 * Score = likes + comentarios * 2.
 *
 * Idea futura: cada mes el top 1 gana 1 mes de Premium gratis (entrega manual del admin).
 */
export default function Ranking() {
    const { usuario } = useAuth()
    const [piezas, setPiezas] = useState([])
    const [config, setConfig] = useState(null)
    const [loading, setLoading] = useState(true)

    useSEO({
        title: 'Ranking de piezas más populares',
        description: 'Las piezas artesanales con más likes y comentarios de la comunidad.',
        url: typeof window !== 'undefined' ? window.location.href : null
    })

    useEffect(() => {
        Promise.all([
            api.get('/ranking/piezas'),
            api.get('/ranking/config').catch(() => ({ data: null }))
        ])
            .then(([resP, resC]) => {
                setPiezas(resP.data)
                setConfig(resC.data)
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }, [])

    // Calcula días restantes hasta el próximo otorgamiento
    const diasFaltan = config?.fechaProximoOtorgamiento
        ? Math.max(0, Math.ceil((new Date(config.fechaProximoOtorgamiento) - new Date()) / (1000 * 60 * 60 * 24)))
        : null

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>

            {/* Topbar simple */}
            <nav style={{
                background: 'var(--color-bg-2)',
                borderBottom: '1px solid var(--color-border)',
                padding: '0 24px', height: '56px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'sticky', top: 0, zIndex: 100
            }}>
                <Link to="/" style={{ color: 'var(--color-accent)', fontWeight: '700', fontSize: '17px' }}>
                    Artesanos<span style={{ color: 'var(--color-text-3)', fontWeight: '400' }}>.ar</span>
                </Link>
                <div style={{ display: 'flex', gap: '14px', fontSize: '13px' }}>
                    <Link to="/" style={{ color: 'var(--color-text-2)' }}>Inicio</Link>
                    {usuario ? (
                        <Link to="/panel" style={{ color: 'var(--color-accent)' }}>Mi panel</Link>
                    ) : (
                        <Link to="/login" style={{ color: 'var(--color-text-2)' }}>Ingresar</Link>
                    )}
                </div>
            </nav>

            {/* Hero */}
            <div style={{
                background: 'linear-gradient(180deg, rgba(245, 185, 79, 0.08), transparent)',
                padding: '48px 24px 32px',
                textAlign: 'center'
            }}>
                <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
                    🏆 Ranking de piezas
                </h1>
                <p style={{ fontSize: '15px', color: 'var(--color-text-2)', maxWidth: '560px', margin: '0 auto' }}>
                    Las piezas con más interacción de la comunidad. Likes + comentarios suman al puntaje.
                </p>

                {/* Banner del premio configurable por admin */}
                {config?.activo && config.descripcionPremio && (
                    <div style={{
                        maxWidth: '600px', margin: '24px auto 0',
                        background: 'linear-gradient(135deg, #f5b94f25, #f5b94f10)',
                        border: '1px solid #f5b94f',
                        borderRadius: 'var(--radius)',
                        padding: '20px 28px',
                        textAlign: 'left'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '32px' }}>🎁</span>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <p style={{
                                    fontSize: '11px', fontWeight: '700',
                                    color: 'var(--color-premium)', textTransform: 'uppercase',
                                    letterSpacing: '0.08em', marginBottom: '4px'
                                }}>
                                    Premio {config.periodicidad || 'mensual'} del #1
                                </p>
                                <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text)' }}>
                                    {config.descripcionPremio}
                                </p>
                                {diasFaltan !== null && (
                                    <p style={{ fontSize: '12px', color: 'var(--color-text-2)', marginTop: '6px' }}>
                                        {diasFaltan === 0
                                            ? '⏰ Se otorga hoy'
                                            : `⏰ Faltan ${diasFaltan} ${diasFaltan === 1 ? 'día' : 'días'} (${new Date(config.fechaProximoOtorgamiento).toLocaleDateString('es-AR')})`}
                                    </p>
                                )}
                            </div>
                        </div>
                        {config.reglasExtras && (
                            <p style={{
                                fontSize: '12px', color: 'var(--color-text-3)',
                                marginTop: '12px', paddingTop: '12px',
                                borderTop: '1px dashed #f5b94f55',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {config.reglasExtras}
                            </p>
                        )}
                    </div>
                )}

                <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '16px' }}>
                    Dejá tus likes y comentarios para subir el ranking.
                </p>
            </div>

            <div className="container-page" style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

                {loading ? (
                    <p style={{ color: 'var(--color-text-2)', textAlign: 'center' }}>Cargando ranking...</p>
                ) : piezas.length === 0 ? (
                    <div style={{
                        background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)', padding: '48px', textAlign: 'center'
                    }}>
                        <p style={{ color: 'var(--color-text-2)' }}>
                            Todavía no hay piezas con interacciones. Sé el primero en dejar un like.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {piezas.map(p => <FilaRanking key={p.id} pieza={p} />)}
                    </div>
                )}
            </div>
        </div>
    )
}

function FilaRanking({ pieza }) {
    const esTop3 = pieza.posicion <= 3
    const colorPosicion = pieza.posicion === 1 ? 'var(--color-premium)' :
                          pieza.posicion === 2 ? '#c0c0c0' :
                          pieza.posicion === 3 ? '#cd7f32' :
                          'var(--color-text-3)'

    return (
        <Link to={`/artesano/${pieza.artesanoSlug}/pieza/${pieza.id}`}
            style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
                background: 'var(--color-bg-2)',
                border: `1px solid ${esTop3 ? colorPosicion : 'var(--color-border)'}`,
                borderRadius: 'var(--radius)',
                padding: '14px',
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                transition: 'all 0.15s'
            }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)' }}>

                {/* Posición */}
                <div style={{
                    width: '52px', flexShrink: 0,
                    fontSize: '32px', fontWeight: '700',
                    color: colorPosicion,
                    fontFamily: 'serif',
                    fontVariantNumeric: 'tabular-nums',
                    textAlign: 'center'
                }}>
                    {pieza.posicion}
                </div>

                {/* Imagen */}
                <div style={{ width: '90px', height: '90px', flexShrink: 0, borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                    <CarruselFotos fotos={pieza.fotos} titulo={pieza.titulo} height={90} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                        <p style={{ fontSize: '15px', fontWeight: '500', color: 'var(--color-text)' }}>
                            {pieza.titulo}
                        </p>
                        {pieza.destacada && (
                            <span style={{
                                fontSize: '9px', fontWeight: '700',
                                background: 'var(--color-premium)', color: '#0f0f0f',
                                padding: '1px 6px', borderRadius: '20px'
                            }}>★</span>
                        )}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginBottom: '6px' }}>
                        por {pieza.artesanoNombre}
                    </p>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-accent)' }}>
                        ${Number(pieza.precio).toLocaleString('es-AR')}
                    </p>
                </div>

                {/* Score */}
                <div style={{ textAlign: 'right', flexShrink: 0, paddingRight: '8px' }}>
                    <p style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-text)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                        {pieza.score}
                    </p>
                    <p style={{ fontSize: '10px', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
                        puntos
                    </p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px', fontSize: '11px', color: 'var(--color-text-3)' }}>
                        <span>♥ {pieza.likes}</span>
                        <span>💬 {pieza.comentarios}</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}
