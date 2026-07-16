import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import EventoCard from '../components/EventoCard'
import { useAuth } from '../context/AuthContext'
import { useSEO } from '../hooks/useSEO'

export default function Eventos() {
    const { usuario } = useAuth()
    const [eventos, setEventos] = useState([])
    const [loading, setLoading] = useState(true)

    useSEO({
        title: 'Próximas ferias de artesanos',
        description: 'Calendario de ferias y eventos donde vas a encontrar artesanos argentinos. No te pierdas ninguna.',
        url: typeof window !== 'undefined' ? window.location.href : null
    })

    useEffect(() => {
        cargar()
    }, [])

    const cargar = () => {
        setLoading(true)
        api.get('/eventos/proximos')
            .then(res => setEventos(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }

    /* Cuando la card cambia (toggle voy a estar) actualizo el item correspondiente */
    const handleCambio = (eventoActualizado) => {
        setEventos(prev => prev.map(e => e.id === eventoActualizado.id ? eventoActualizado : e))
    }

    /* Agrupar por mes para mejor presentación */
    const agrupados = agruparPorMes(eventos)

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>

            {/* Topbar */}
            <nav style={{
                background: 'var(--color-bg-2)', borderBottom: '1px solid var(--color-border)',
                padding: '0 24px', height: '56px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'sticky', top: 0, zIndex: 100
            }}>
                <Link to="/" style={{ color: 'var(--color-accent)', fontWeight: '700', fontSize: '17px' }}>
                    Artesanos<span style={{ color: 'var(--color-text-3)', fontWeight: '400' }}>.ar</span>
                </Link>
                <div style={{ display: 'flex', gap: '14px', fontSize: '13px' }}>
                    <Link to="/" style={{ color: 'var(--color-text-2)' }}>Inicio</Link>
                    <Link to="/ranking" style={{ color: 'var(--color-text-2)' }}>🏆 Ranking</Link>
                    {usuario ? (
                        <Link to="/panel" style={{ color: 'var(--color-accent)' }}>Mi panel</Link>
                    ) : (
                        <Link to="/login" style={{ color: 'var(--color-text-2)' }}>Ingresar</Link>
                    )}
                </div>
            </nav>

            {/* Hero */}
            <div style={{
                background: 'var(--color-bg-2)',
                padding: '48px 24px 32px',
                textAlign: 'center'
            }}>
                <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
                    📅 Próximas ferias
                </h1>
                <p style={{ fontSize: '15px', color: 'var(--color-text-2)', maxWidth: '600px', margin: '0 auto' }}>
                    Encontrá los próximos eventos donde vas a poder ver el trabajo de los artesanos en persona.
                </p>
                {usuario && (
                    <Link to="/panel/eventos" style={{
                        display: 'inline-block', marginTop: '20px',
                        fontSize: '13px',
                        background: 'var(--color-bg-2)',
                        border: '1px solid var(--color-border)',
                        padding: '8px 16px', borderRadius: '20px',
                        color: 'var(--color-text-2)'
                    }}>
                        + Publicar evento
                    </Link>
                )}
            </div>

            <div className="container-page" style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

                {loading ? (
                    <p style={{ color: 'var(--color-text-2)', textAlign: 'center' }}>Cargando eventos...</p>
                ) : eventos.length === 0 ? (
                    <div style={{
                        background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)', padding: '48px', textAlign: 'center'
                    }}>
                        <p style={{ color: 'var(--color-text-2)', marginBottom: '12px' }}>
                            Todavía no hay eventos publicados.
                        </p>
                        {usuario && (
                            <Link to="/panel/eventos" style={{ color: 'var(--color-accent)', fontSize: '14px' }}>
                                Sé el primero en publicar uno →
                            </Link>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {agrupados.map(grupo => (
                            <div key={grupo.titulo}>
                                <h2 style={{
                                    fontSize: '14px', fontWeight: '600',
                                    color: 'var(--color-text-3)',
                                    textTransform: 'uppercase', letterSpacing: '0.08em',
                                    marginBottom: '14px',
                                    paddingBottom: '8px', borderBottom: '1px solid var(--color-border)'
                                }}>
                                    {grupo.titulo}
                                </h2>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                    gap: '16px'
                                }}>
                                    {grupo.eventos.map(e => (
                                        <EventoCard key={e.id} evento={e} onChange={handleCambio} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

/*
 * Agrupa los eventos por mes ("Noviembre 2025", "Diciembre 2025", etc.)
 * para que la página tenga estructura cuando hay muchos.
 */
function agruparPorMes(eventos) {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    const mapa = new Map()

    eventos.forEach(e => {
        const d = new Date(e.fechaInicio)
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth()).padStart(2, '0')}`
        const titulo = `${meses[d.getUTCMonth()]} ${d.getUTCFullYear()}`
        if (!mapa.has(key)) mapa.set(key, { titulo, eventos: [] })
        mapa.get(key).eventos.push(e)
    })

    return Array.from(mapa.values())
}
