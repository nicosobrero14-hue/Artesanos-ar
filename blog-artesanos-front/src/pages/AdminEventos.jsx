import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import EventoCard from '../components/EventoCard'
import { useAuth } from '../context/AuthContext'

/*
 * Panel admin para moderar eventos.
 *
 * Tabs:
 *  - Pendientes (default — lo más importante)
 *  - Todos
 *
 * Acciones rápidas: aprobar, eliminar.
 */
export default function AdminEventos() {
    const { usuario } = useAuth()
    const [eventos, setEventos] = useState([])
    const [tab, setTab] = useState('pendientes')
    const [loading, setLoading] = useState(true)
    const [accionando, setAccionando] = useState(null)

    useEffect(() => {
        if (usuario?.rol === 'ADMIN') cargar()
    }, [usuario, tab])

    const cargar = () => {
        setLoading(true)
        const url = tab === 'pendientes' ? '/admin/eventos/pendientes' : '/admin/eventos'
        api.get(url)
            .then(res => setEventos(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }

    const handleAprobar = async (id) => {
        setAccionando(id)
        try {
            await api.post(`/admin/eventos/${id}/aprobar`)
            cargar()
        } catch (err) {
            alert(err.response?.data?.message || 'Error al aprobar')
        } finally {
            setAccionando(null)
        }
    }

    const handleEliminar = async (id) => {
        if (!confirm('¿Eliminar este evento? Esta acción no se puede deshacer.')) return
        setAccionando(id)
        try {
            await api.delete(`/admin/eventos/${id}`)
            cargar()
        } catch (err) {
            alert(err.response?.data?.message || 'Error al eliminar')
        } finally {
            setAccionando(null)
        }
    }

    if (usuario && usuario.rol !== 'ADMIN') return <Navigate to="/panel" replace />

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
            <Navbar />

            <div className="container-page" style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h1 style={{ fontSize: '22px', fontWeight: '600' }}>Moderación de eventos</h1>
                    <span style={{
                        background: '#f5b94f', color: '#0f0f0f',
                        fontSize: '11px', fontWeight: '700',
                        padding: '2px 10px', borderRadius: '20px'
                    }}>⚙ ADMIN</span>
                </div>
                <p style={{ color: 'var(--color-text-2)', fontSize: '14px', marginBottom: '20px' }}>
                    Aprobá los eventos creados por los artesanos premium para que aparezcan en /eventos y en el banner del home.
                </p>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Tab activo={tab === 'pendientes'} onClick={() => setTab('pendientes')}>
                        ⏳ Pendientes
                    </Tab>
                    <Tab activo={tab === 'todos'} onClick={() => setTab('todos')}>
                        Todos
                    </Tab>
                    <Link to="/admin" style={{
                        marginLeft: 'auto', fontSize: '13px', color: 'var(--color-text-2)'
                    }}>
                        ← Volver a artesanos
                    </Link>
                </div>

                {loading ? (
                    <p style={{ color: 'var(--color-text-2)' }}>Cargando...</p>
                ) : eventos.length === 0 ? (
                    <div style={{
                        background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)', padding: '48px', textAlign: 'center'
                    }}>
                        <p style={{ color: 'var(--color-text-2)' }}>
                            {tab === 'pendientes' ? 'No hay eventos pendientes de aprobación' : 'Todavía no hay eventos en el sistema'}
                        </p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '16px'
                    }}>
                        {eventos.map(e => (
                            <div key={e.id} style={{
                                display: 'flex', flexDirection: 'column',
                                gap: '10px'
                            }}>
                                <EventoCard evento={e} onEliminar={() => cargar()} />
                                {!e.aprobado && (
                                    <button
                                        onClick={() => handleAprobar(e.id)}
                                        disabled={accionando === e.id}
                                        style={{
                                            width: '100%',
                                            background: 'var(--color-success)',
                                            color: '#0f0f0f',
                                            border: 'none',
                                            borderRadius: 'var(--radius-sm)',
                                            padding: '10px 12px',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            cursor: accionando === e.id ? 'wait' : 'pointer'
                                        }}>
                                        {accionando === e.id ? '...' : '✓ Aprobar evento'}
                                    </button>
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
            borderRadius: '20px',
            padding: '7px 16px',
            fontSize: '13px',
            cursor: 'pointer',
            fontWeight: activo ? '500' : '400'
        }}>
            {children}
        </button>
    )
}
