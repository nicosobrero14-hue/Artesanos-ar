import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import EventoCard from '../components/EventoCard'
import EventoForm from '../components/EventoForm'

/*
 * Panel del artesano para gestionar sus eventos.
 * Premium-only — los free ven un cartel de upgrade en lugar del botón crear.
 */
export default function MisEventos() {
    const [eventos, setEventos] = useState([])
    const [plan, setPlan] = useState(null)
    const [loading, setLoading] = useState(true)
    const [modalAbierto, setModalAbierto] = useState(false)
    const [editando, setEditando] = useState(null)

    useEffect(() => {
        cargar()
        cargarPlan()
    }, [])

    const cargar = () => {
        setLoading(true)
        api.get('/eventos/mis-eventos')
            .then(res => setEventos(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }

    const cargarPlan = () => {
        api.get('/artesanos/mi-panel/plan')
            .then(res => setPlan(res.data))
            .catch(() => {})
    }

    const abrirCrear = () => {
        setEditando(null)
        setModalAbierto(true)
    }

    const abrirEditar = (evento) => {
        setEditando(evento)
        setModalAbierto(true)
    }

    const handleSaved = () => {
        setModalAbierto(false)
        setEditando(null)
        cargar()
    }

    const handleEliminar = (id) => {
        setEventos(prev => prev.filter(e => e.id !== id))
    }

    const aprobados = eventos.filter(e => e.aprobado)
    const pendientes = eventos.filter(e => !e.aprobado)

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
            <Navbar />

            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '4px' }}>Mis eventos</h1>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
                            Ferias y eventos donde vas a estar. Después de crear, esperan moderación del admin.
                        </p>
                    </div>
                    {plan?.esPremium ? (
                        <Button onClick={abrirCrear}>+ Nuevo evento</Button>
                    ) : (
                        <Link to="/premium" style={{
                            background: '#f5b94f', color: '#0f0f0f',
                            padding: '8px 16px', borderRadius: 'var(--radius-sm)',
                            fontSize: '13px', fontWeight: '500'
                        }}>
                            ★ Pasate a Premium para crear eventos
                        </Link>
                    )}
                </div>

                {/* Pendientes */}
                {pendientes.length > 0 && (
                    <div style={{ marginBottom: '32px' }}>
                        <h2 style={{
                            fontSize: '14px', fontWeight: '600',
                            color: '#f5b94f',
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                            marginBottom: '12px',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            ⏳ Pendientes de aprobación ({pendientes.length})
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                            gap: '14px'
                        }}>
                            {pendientes.map(e => (
                                <EventoCard key={e.id} evento={e}
                                    onEditar={abrirEditar} onEliminar={handleEliminar} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Aprobados */}
                {aprobados.length > 0 && (
                    <div>
                        <h2 style={{
                            fontSize: '14px', fontWeight: '600',
                            color: 'var(--color-success)',
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                            marginBottom: '12px',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            ✓ Publicados ({aprobados.length})
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                            gap: '14px'
                        }}>
                            {aprobados.map(e => (
                                <EventoCard key={e.id} evento={e}
                                    onEditar={abrirEditar} onEliminar={handleEliminar} />
                            ))}
                        </div>
                    </div>
                )}

                {!loading && eventos.length === 0 && (
                    <div style={{
                        background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)', padding: '48px', textAlign: 'center'
                    }}>
                        {plan?.esPremium ? (
                            <>
                                <p style={{ color: 'var(--color-text-2)', marginBottom: '12px' }}>
                                    Todavía no creaste ningún evento.
                                </p>
                                <Button onClick={abrirCrear}>+ Crear mi primer evento</Button>
                            </>
                        ) : (
                            <>
                                <p style={{ color: 'var(--color-text-2)', marginBottom: '6px' }}>
                                    Crear eventos es una feature Premium.
                                </p>
                                <p style={{ fontSize: '13px', color: 'var(--color-text-3)', marginBottom: '20px' }}>
                                    Difundí tus ferias a toda la comunidad y atraé visitantes a tu stand.
                                </p>
                                <Link to="/premium" style={{
                                    display: 'inline-block',
                                    background: '#f5b94f', color: '#0f0f0f',
                                    padding: '10px 22px', borderRadius: 'var(--radius-sm)',
                                    fontSize: '14px', fontWeight: '500'
                                }}>
                                    ★ Conocer Premium
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </div>

            {modalAbierto && (
                <EventoForm
                    evento={editando}
                    onClose={() => { setModalAbierto(false); setEditando(null) }}
                    onSaved={handleSaved}
                />
            )}
        </div>
    )
}
