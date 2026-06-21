import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'

export default function StatsAvanzadas() {
    const [stats, setStats] = useState(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/artesanos/mi-panel/stats-avanzadas')
            .then(res => setStats(res.data))
            .catch(err => setError(err.response?.data?.message || 'Error al cargar'))
            .finally(() => setLoading(false))
    }, [])

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
            <Navbar />
            <div className="container-page" style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '4px' }}>
                    📊 Estadísticas avanzadas
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--color-text-2)', marginBottom: '24px' }}>
                    Métricas de engagement de tu trabajo
                </p>

                {loading && <p style={{ color: 'var(--color-text-2)' }}>Calculando...</p>}

                {error && (
                    <div style={{
                        background: 'var(--color-bg-2)', border: '1px solid #f5b94f55',
                        borderRadius: 'var(--radius)', padding: '32px', textAlign: 'center'
                    }}>
                        <p style={{ marginBottom: '12px' }}>{error}</p>
                        <Link to="/premium" style={{
                            display: 'inline-block', background: 'var(--color-premium)', color: '#0f0f0f',
                            padding: '10px 22px', borderRadius: 'var(--radius-sm)',
                            fontSize: '14px', fontWeight: '500'
                        }}>★ Ir a Premium</Link>
                    </div>
                )}

                {stats && (
                    <>
                        {/* Cards */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '12px', marginBottom: '32px'
                        }}>
                            <Card label="Likes recibidos" valor={stats.totalLikesRecibidos} icono="♥" />
                            <Card label="Comentarios recibidos" valor={stats.totalComentariosRecibidos} icono="💬" />
                            <Card label="Reseñas recibidas"
                                valor={stats.totalResenasRecibidas}
                                sub={stats.promedioResenas ? `Promedio ${stats.promedioResenas} ★` : '—'}
                                icono="★" />
                            <Card label="Mensajes recibidos" valor={stats.totalMensajesContacto} icono="✉" />
                            <Card label="Eventos creados" valor={stats.totalEventosCreados} icono="📅" />
                            <Card label="Total participantes en mis eventos" valor={stats.totalParticipantesEnEventos} icono="👥" />
                        </div>

                        {/* Top piezas */}
                        {stats.top5Piezas?.length > 0 ? (
                            <div style={{
                                background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius)', padding: '20px'
                            }}>
                                <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '14px' }}>
                                    🏆 Top 5 piezas con más engagement
                                </h2>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <th style={th}>#</th>
                                            <th style={th}>Pieza</th>
                                            <th style={{ ...th, textAlign: 'right' }}>Likes</th>
                                            <th style={{ ...th, textAlign: 'right' }}>Comentarios</th>
                                            <th style={{ ...th, textAlign: 'right' }}>Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.top5Piezas.map((p, i) => (
                                            <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                <td style={td}>{i + 1}</td>
                                                <td style={td}>{p.titulo}</td>
                                                <td style={{ ...td, textAlign: 'right' }}>{p.likes}</td>
                                                <td style={{ ...td, textAlign: 'right' }}>{p.comentarios}</td>
                                                <td style={{ ...td, textAlign: 'right', fontWeight: '600', color: 'var(--color-accent)' }}>
                                                    {p.score}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{
                                background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius)', padding: '24px', textAlign: 'center'
                            }}>
                                <p style={{ color: 'var(--color-text-2)' }}>
                                    Tus piezas todavía no recibieron likes ni comentarios.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

function Card({ label, valor, sub, icono }) {
    return (
        <div style={{
            background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)', padding: '18px'
        }}>
            <p style={{ fontSize: '20px', marginBottom: '4px' }}>{icono}</p>
            <p style={{ fontSize: '24px', fontWeight: '700', fontVariantNumeric: 'tabular-nums', marginBottom: '2px' }}>
                {valor}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
            </p>
            {sub && <p style={{ fontSize: '11px', color: 'var(--color-text-2)', marginTop: '4px' }}>{sub}</p>}
        </div>
    )
}

const th = { padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '500', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }
const td = { padding: '10px 12px' }
