import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import EventoCard from '../components/EventoCard'

/*
 * Log de auditoría: muestra las últimas 100 acciones administrativas
 * para que quede traza de quién hizo qué.
 */
export default function AdminAuditoria() {
    const { usuario } = useAuth()
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [accionando, setAccionando] = useState(null)

    useEffect(() => {
        if (usuario?.rol === 'ADMIN') {
            api.get('/admin/auditoria')
                .then(res => setLogs(res.data))
                .catch(() => {})
                .finally(() => setLoading(false))
        }
    }, [usuario])

    if (usuario && usuario.rol !== 'ADMIN') return <Navigate to="/panel" replace />

    const colorPorAccion = (a) => {
        if (a.startsWith('ELIMINAR')) return 'var(--color-danger)'
        if (a.includes('UPGRADE') || a.includes('APROBAR')) return 'var(--color-success)'
        if (a.includes('DOWNGRADE') || a.includes('BLOQUEAR')) return '#f5b94f'
        return 'var(--color-text-2)'
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
            <Navbar />
            <div className="container-page" style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '4px' }}>
                    📜 Log de auditoría
                </h1>
                <p style={{ color: 'var(--color-text-2)', fontSize: '14px', marginBottom: '20px' }}>
                    Últimas 100 acciones administrativas. Quién hizo qué y cuándo.
                </p>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <Link to="/admin/auditoria" style={tabStyle(true)}>📜 Auditoría</Link>
                    <Link to="/admin" style={{
                        marginLeft: 'auto', fontSize: '13px', color: 'var(--color-text-2)'
                    }}>
                        ← Volver a artesanos
                    </Link>
                </div>

                {loading ? (
                    <p style={{ color: 'var(--color-text-2)' }}>Cargando...</p>
                ) : logs.length === 0 ? (
                    <div style={{
                        background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)', padding: '48px', textAlign: 'center'
                    }}>
                        <p style={{ color: 'var(--color-text-2)' }}>No hay actividad registrada</p>
                    </div>
                ) : (
                    <div style={{
                        background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)', overflow: 'hidden'
                    }}>
                        {logs.map(l => (
                            <div key={l.id} style={{
                                display: 'flex', gap: '14px', padding: '12px 16px',
                                borderBottom: '1px solid var(--color-border)',
                                fontSize: '13px', alignItems: 'center', flexWrap: 'wrap'
                            }}>
                                <span style={{
                                    fontSize: '10px', fontWeight: '700',
                                    background: colorPorAccion(l.accion) + '22',
                                    color: colorPorAccion(l.accion),
                                    border: `1px solid ${colorPorAccion(l.accion)}55`,
                                    padding: '3px 10px', borderRadius: '20px',
                                    textTransform: 'uppercase', letterSpacing: '0.05em',
                                    flexShrink: 0
                                }}>
                                    {l.accion}
                                </span>
                                {l.objetoTipo && (
                                    <span style={{ color: 'var(--color-text-3)', fontSize: '12px' }}>
                                        {l.objetoTipo} #{l.objetoId}
                                    </span>
                                )}
                                {l.detalle && (
                                    <span style={{ color: 'var(--color-text-2)', flex: 1, minWidth: 0 }}>
                                        {l.detalle}
                                    </span>
                                )}
                                <span style={{ color: 'var(--color-text-3)', fontSize: '11px', marginLeft: 'auto' }}>
                                    por <strong>{l.adminNombre}</strong> · {new Date(l.fecha).toLocaleString('es-AR', {
                                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

const tabStyle = (activo) => ({
    background: activo ? 'var(--color-accent)' : 'transparent',
    color: activo ? '#0f0f0f' : 'var(--color-text-2)',
    border: `1px solid ${activo ? 'var(--color-accent)' : 'var(--color-border)'}`,
    borderRadius: '20px', padding: '7px 16px', fontSize: '13px',
    fontWeight: activo ? '500' : '400', textDecoration: 'none'
})
