import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

export default function AdminReportes() {
    const { usuario } = useAuth()
    const [reportes, setReportes] = useState([])
    const [filtro, setFiltro] = useState('pendientes')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (usuario?.rol === 'ADMIN') cargar()
    }, [usuario, filtro])

    const cargar = () => {
        setLoading(true)
        api.get(`/admin/reportes?filtro=${filtro}`)
            .then(res => setReportes(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }

    const handleResolver = async (id) => {
        const nota = prompt('Nota interna (opcional):')
        try {
            await api.post(`/admin/reportes/${id}/resolver`, { nota: nota || '' })
            cargar()
        } catch {
            alert('Error al resolver')
        }
    }

    /*
     * Eliminar el contenido reportado + marcar el reporte como resuelto.
     * Llama distinto endpoint según el tipo de objeto reportado.
     */
    const handleEliminarContenido = async (reporte) => {
        const motivo = prompt(`Motivo (será logueado y notificado al autor):`, reporte.motivo)
        if (motivo === null) return
        try {
            const tipo = reporte.tipo
            const oid = reporte.objetoId
            const motivoParam = motivo ? `?motivo=${encodeURIComponent(motivo)}` : ''

            if (tipo === 'PIEZA') {
                await api.delete(`/admin/piezas/${oid}${motivoParam}`)
            } else if (tipo === 'COMENTARIO') {
                await api.delete(`/admin/comentarios/${oid}${motivoParam}`)
            } else if (tipo === 'RESENA') {
                await api.delete(`/admin/resenas/${oid}${motivoParam}`)
            } else if (tipo === 'ARTESANO') {
                await api.post(`/admin/artesanos/${oid}/toggle-activo`)
            }
            // Resolver el reporte
            await api.post(`/admin/reportes/${reporte.id}/resolver`, { nota: 'Contenido eliminado: ' + motivo })
            cargar()
        } catch (err) {
            alert(err.response?.data?.message || 'Error al eliminar')
        }
    }

    if (usuario && usuario.rol !== 'ADMIN') return <Navigate to="/panel" replace />

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
            <Navbar />
            <div className="container-page" style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h1 style={{ fontSize: '22px', fontWeight: '600' }}>🚩 Reportes</h1>
                    <span style={{
                        background: 'var(--color-premium)', color: '#0f0f0f',
                        fontSize: '11px', fontWeight: '700',
                        padding: '2px 10px', borderRadius: '20px'
                    }}>⚙ ADMIN</span>
                </div>
                <p style={{ color: 'var(--color-text-2)', fontSize: '14px', marginBottom: '20px' }}>
                    Contenido reportado por usuarios. Revisá, decidí y resolvelo.
                </p>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    <Tab activo={filtro === 'pendientes'} onClick={() => setFiltro('pendientes')}>
                        ⏳ Pendientes
                    </Tab>
                    <Tab activo={filtro === 'todos'} onClick={() => setFiltro('todos')}>
                        Todos
                    </Tab>
                    <Link to="/admin" style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--color-text-2)' }}>
                        ← Artesanos
                    </Link>
                </div>

                {loading ? (
                    <p style={{ color: 'var(--color-text-2)' }}>Cargando...</p>
                ) : reportes.length === 0 ? (
                    <div style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '48px', textAlign: 'center' }}>
                        <p style={{ color: 'var(--color-text-2)' }}>
                            {filtro === 'pendientes' ? 'No hay reportes pendientes 🎉' : 'No hay reportes en el sistema'}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {reportes.map(r => (
                            <div key={r.id} style={{
                                background: 'var(--color-bg-2)',
                                border: `1px solid ${r.resuelto ? 'var(--color-border)' : 'var(--color-danger)'}`,
                                borderRadius: 'var(--radius)', padding: '16px',
                                opacity: r.resuelto ? 0.65 : 1
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                    <div>
                                        <span style={{
                                            fontSize: '10px', fontWeight: '700',
                                            background: 'var(--color-bg-3)', color: 'var(--color-text-2)',
                                            padding: '2px 8px', borderRadius: '20px',
                                            textTransform: 'uppercase', letterSpacing: '0.05em',
                                            marginRight: '8px'
                                        }}>{r.tipo} #{r.objetoId}</span>
                                        <span style={{ fontSize: '13px', fontWeight: '500' }}>{r.motivo}</span>
                                    </div>
                                    {r.resuelto ? (
                                        <span style={{ fontSize: '11px', color: 'var(--color-success)' }}>
                                            ✓ resuelto
                                        </span>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button onClick={() => handleEliminarContenido(r)} style={{
                                                background: 'transparent', color: 'var(--color-danger)',
                                                border: '1px solid var(--color-danger)',
                                                borderRadius: 'var(--radius-sm)',
                                                padding: '5px 10px', fontSize: '12px', fontWeight: '500',
                                                cursor: 'pointer'
                                            }}>🗑 Eliminar</button>
                                            <button onClick={() => handleResolver(r.id)} style={{
                                                background: 'var(--color-success)', color: '#0f0f0f',
                                                border: 'none', borderRadius: 'var(--radius-sm)',
                                                padding: '5px 12px', fontSize: '12px', fontWeight: '500',
                                                cursor: 'pointer'
                                            }}>✓ Descartar</button>
                                        </div>
                                    )}
                                </div>
                                {r.detalle && (
                                    <p style={{ fontSize: '13px', color: 'var(--color-text-2)', marginBottom: '8px', lineHeight: '1.5' }}>
                                        {r.detalle}
                                    </p>
                                )}
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '11px', color: 'var(--color-text-3)' }}>
                                    <span>Reportado por <strong>{r.autorNombre}</strong></span>
                                    <span>·</span>
                                    <span>{new Date(r.fecha).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                    {r.reporteUrl && (
                                        <>
                                            <span>·</span>
                                            <Link to={r.reporteUrl} style={{ color: 'var(--color-accent)' }}>
                                                Ver contenido →
                                            </Link>
                                        </>
                                    )}
                                </div>
                                {r.notaAdmin && (
                                    <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '8px', fontStyle: 'italic' }}>
                                        Nota: {r.notaAdmin}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function Tab({ activo, onClick, children }) {
    return (
        <button onClick={onClick} style={{
            background: activo ? 'var(--color-accent)' : 'transparent',
            color: activo ? '#0f0f0f' : 'var(--color-text-2)',
            border: `1px solid ${activo ? 'var(--color-accent)' : 'var(--color-border)'}`,
            borderRadius: '20px', padding: '7px 16px', fontSize: '13px', cursor: 'pointer'
        }}>{children}</button>
    )
}
