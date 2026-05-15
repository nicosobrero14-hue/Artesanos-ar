import { useEffect, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

export default function AdminFeedback() {
    const { usuario } = useAuth()
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (usuario?.rol === 'ADMIN') cargar()
    }, [usuario])

    const cargar = () => {
        setLoading(true)
        api.get('/feedback')
            .then(res => setItems(res.data))
            .finally(() => setLoading(false))
    }

    const marcarLeido = async (id) => {
        await api.post(`/feedback/${id}/marcar-leido`)
        cargar()
    }

    const eliminar = async (id) => {
        if (!confirm('¿Eliminar este feedback?')) return
        await api.delete(`/feedback/${id}`)
        cargar()
    }

    if (usuario && usuario.rol !== 'ADMIN') return <Navigate to="/panel" replace />

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
            <Navbar />
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h1 style={{ fontSize: '22px', fontWeight: '600' }}>💡 Feedback recibido</h1>
                    <span style={{
                        background: '#f5b94f', color: '#0f0f0f',
                        fontSize: '11px', fontWeight: '700',
                        padding: '2px 10px', borderRadius: '20px'
                    }}>⚙ ADMIN</span>
                </div>
                <p style={{ color: 'var(--color-text-2)', fontSize: '14px', marginBottom: '20px' }}>
                    Cada feedback también llega a tu email para tener doble respaldo.
                </p>

                <div style={{ marginBottom: '20px' }}>
                    <Link to="/admin" style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>← Volver al admin</Link>
                </div>

                {loading ? (
                    <p style={{ color: 'var(--color-text-2)' }}>Cargando...</p>
                ) : items.length === 0 ? (
                    <div style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '48px', textAlign: 'center' }}>
                        <p style={{ color: 'var(--color-text-2)' }}>Sin feedbacks por ahora</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {items.map(f => (
                            <div key={f.id} style={{
                                background: 'var(--color-bg-2)',
                                border: `1px solid ${f.leido ? 'var(--color-border)' : '#f5b94f55'}`,
                                borderRadius: 'var(--radius)', padding: '16px',
                                opacity: f.leido ? 0.7 : 1
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                    <div>
                                        <span style={{
                                            fontSize: '10px', fontWeight: '700',
                                            background: '#f5b94f22', color: '#f5b94f',
                                            padding: '2px 8px', borderRadius: '20px',
                                            marginRight: '8px'
                                        }}>{f.tipo || 'GENERAL'}</span>
                                        <span style={{ fontSize: '13px', fontWeight: '500' }}>
                                            {f.autorNombre || 'Anónimo'}
                                            {f.autorEmail && (
                                                <span style={{ color: 'var(--color-text-3)' }}> · {f.autorEmail}</span>
                                            )}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {!f.leido && (
                                            <button onClick={() => marcarLeido(f.id)}
                                                style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '4px 10px', color: 'var(--color-text-2)', fontSize: '11px', cursor: 'pointer' }}>
                                                ✓ Leído
                                            </button>
                                        )}
                                        <button onClick={() => eliminar(f.id)}
                                            style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '4px 10px', color: 'var(--color-danger)', fontSize: '11px', cursor: 'pointer' }}>
                                            🗑
                                        </button>
                                    </div>
                                </div>
                                <p style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: '1.6', marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
                                    {f.mensaje}
                                </p>
                                <p style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>
                                    {new Date(f.fecha).toLocaleString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
