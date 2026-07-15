import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import BotonWhatsApp from '../components/BotonWhatsApp'
import Icon from '../components/Icon'
import { useAuth } from '../context/AuthContext'

/*
 * Este componente carga las estadísticas del artesano logueado.
 * useEffect con array vacío [] se ejecuta UNA SOLA VEZ cuando el componente
 * aparece en pantalla — equivale al "al cargar la página" de JavaScript puro.
 */
export default function Panel() {
    const { usuario } = useAuth()
    const [stats, setStats] = useState(null)
    const [plan, setPlan] = useState(null)
    const [perfil, setPerfil] = useState(null)
    const [loading, setLoading] = useState(true)
    const [esArtesanoSemana, setEsArtesanoSemana] = useState(false)

    useEffect(() => {
        Promise.all([
            api.get('/artesanos/mi-panel/estadisticas'),
            api.get('/artesanos/mi-panel/plan')
        ])
        .then(([resStats, resPlan]) => {
            setStats(resStats.data)
            setPlan(resPlan.data)
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false))

        // Perfil propio — para el checklist de onboarding (foto, whatsapp)
        if (usuario?.slug) {
            api.get(`/artesanos/${usuario.slug}`)
                .then(res => setPerfil(res.data))
                .catch(() => {})
        }

        // ¿Soy el artesano destacado de la semana?
        api.get('/home/artesano-semana')
            .then(res => {
                if (res.data && usuario && res.data.id === usuario.id) {
                    setEsArtesanoSemana(true)
                }
            })
            .catch(() => {})
    }, [usuario])

    // Items del checklist de onboarding
    const checklist = (stats && perfil) ? [
        { ok: !!perfil.avatarUrl, label: 'Subí tu foto de perfil', to: '/panel/perfil' },
        { ok: stats.totalPiezas > 0, label: 'Cargá tu primera pieza', to: '/panel/piezas' },
        { ok: !!perfil.whatsapp, label: 'Agregá tu WhatsApp', to: '/panel/perfil' }
    ] : []
    const checklistCompleto = checklist.length > 0 && checklist.every(i => i.ok)

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <Navbar />

        <div className="container-page" style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '8px' }}>
            Panel
            </h1>
            <p style={{ color: 'var(--color-text-2)', fontSize: '14px', marginBottom: '24px' }}>
            Resumen de tu taller
            </p>

            {/* Checklist de onboarding — se oculta cuando está completo */}
            {checklist.length > 0 && !checklistCompleto && (
            <div style={{
                background: 'var(--color-bg-2)',
                border: '1px solid var(--color-accent)',
                borderRadius: 'var(--radius)', padding: '18px 22px', marginBottom: '24px'
            }}>
                <p style={{ fontSize: '15px', fontWeight: '600', marginBottom: '2px' }}>
                    🚀 Completá tu taller
                </p>
                <p style={{ fontSize: '13px', color: 'var(--color-text-2)', marginBottom: '14px' }}>
                    {checklist.filter(i => i.ok).length} de {checklist.length} pasos listos.
                    Un perfil completo recibe más consultas.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {checklist.map((item, i) => (
                        <Link key={i} to={item.to} style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            fontSize: '14px', textDecoration: 'none',
                            color: item.ok ? 'var(--color-text-3)' : 'var(--color-text)'
                        }}>
                            <span style={{
                                width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '12px',
                                background: item.ok ? 'var(--color-success)' : 'transparent',
                                border: item.ok ? 'none' : '1.5px solid var(--color-border)',
                                color: '#0f0f0f'
                            }}>
                                {item.ok ? '✓' : ''}
                            </span>
                            <span style={{ textDecoration: item.ok ? 'line-through' : 'none' }}>
                                {item.label}
                            </span>
                            {!item.ok && (
                                <span style={{ fontSize: '12px', color: 'var(--color-accent)', marginLeft: 'auto' }}>
                                    Hacelo →
                                </span>
                            )}
                        </Link>
                    ))}
                </div>
            </div>
            )}

            {/* Banner: sos el artesano destacado de la semana */}
            {esArtesanoSemana && (
            <div style={{
                background: 'linear-gradient(135deg, #f5b94f22, #f59f3315)',
                border: '1px solid #f5b94f',
                borderRadius: 'var(--radius)', padding: '18px 22px', marginBottom: '24px'
            }}>
                <p style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>
                    ⭐ ¡Sos el Artesano de la Semana!
                </p>
                <p style={{ fontSize: '13px', color: 'var(--color-text-2)', marginBottom: '12px' }}>
                    Esta semana tu taller aparece destacado en la portada de Artesanos.ar.
                    Aprovechá para contarlo.
                </p>
                <BotonWhatsApp
                    texto={
                        `Esta semana soy el Artesano de la Semana en Artesanos.ar ⭐\n\n` +
                        `Mirá mi catálogo 👇\n` +
                        (usuario?.slug ? `${window.location.origin}/artesano/${usuario.slug}` : window.location.origin)
                    }
                    label="Compartir por WhatsApp"
                />
            </div>
            )}

            {/* Tarjeta del plan actual */}
            {plan && (
            <div style={{
                background: plan.esPremium
                    ? 'linear-gradient(135deg, #f5b94f22, #f59f3322)'
                    : 'var(--color-bg-2)',
                border: `1px solid ${plan.esPremium ? 'var(--color-premium)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius)', padding: '18px 22px', marginBottom: '24px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap'
            }} className="stack-mobile">
                <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Plan actual
                    </span>
                    <span style={{
                    fontSize: '12px', fontWeight: '600',
                    background: plan.esPremium ? 'var(--color-premium)' : 'var(--color-bg-3)',
                    color: plan.esPremium ? '#0f0f0f' : 'var(--color-text-2)',
                    padding: '2px 10px', borderRadius: '20px'
                    }}>
                    {plan.esPremium ? '★ PREMIUM' : 'GRATIS'}
                    </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
                    {plan.maxPiezas
                    ? `${plan.piezasActuales} / ${plan.maxPiezas} piezas · hasta ${plan.maxFotosPorPieza} fotos por pieza`
                    : `${plan.piezasActuales} piezas · hasta ${plan.maxFotosPorPieza} fotos por pieza · piezas ilimitadas`}
                </p>
                {plan.esPremium && plan.fechaExpiracionPlan && (
                    <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '4px' }}>
                    Vence el {new Date(plan.fechaExpiracionPlan).toLocaleDateString('es-AR')}
                    </p>
                )}
                </div>
                {!plan.esPremium && (
                <Link to="/premium" style={{
                    background: 'var(--color-premium)', color: '#0f0f0f',
                    padding: '8px 18px', borderRadius: 'var(--radius-sm)',
                    fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap'
                }}>
                    Pasarme a Premium →
                </Link>
                )}
            </div>
            )}

            {loading ? (
            <p style={{ color: 'var(--color-text-2)' }}>Cargando estadísticas...</p>
            ) : stats ? (
            <>
                {/* Tarjetas de estadísticas */}
                <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '32px'
                }}>
                <StatCard label="Piezas activas" value={stats.totalPiezas} sub={`${stats.piezasDisponibles} disponibles`} />
                <StatCard label="Pedidos abiertos" value={stats.pedidosAbiertos} sub={`${stats.pedidosListos} listos para entregar`} color="var(--color-accent)" />
                <StatCard label="Piezas vendidas" value={stats.piezasVendidas} sub="historial total" />
                <StatCard label="Horas trabajadas" value={stats.totalHorasTrabajadas} sub="en todas las piezas" />
                <StatCard
                    label="Valor hora promedio"
                    value={stats.valorHoraPromedio ? `$${Number(stats.valorHoraPromedio).toLocaleString('es-AR')}` : '-'}
                    sub="basado en piezas vendidas"
                    color="var(--color-success)"
                />
                <StatCard label="Mensajes sin leer" value={stats.mensajesNoLeidos} sub="" color={stats.mensajesNoLeidos > 0 ? 'var(--color-accent)' : undefined} />
                <StatCard label="Visitas a tu perfil" value={stats.visitasPerfil ?? 0} sub="desde que te registraste" color="var(--color-accent)" />
                </div>

                {/* Accesos rápidos */}
                <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px'
                }}>
                <AccionCard to="/panel/piezas" icon="box" titulo="Gestionar piezas" desc="Agregar, editar o cambiar estado de tus piezas" />
                <AccionCard to="/panel/pedidos" icon="clipboard" titulo="Ver pedidos" desc="Seguí el estado de cada encargo" />
                <AccionCard to="/panel/mensajes" icon="chat" titulo="Mensajes recibidos" desc="Consultas desde tu catálogo público" />
                <AccionCard to="/panel/eventos" icon="calendar" titulo="Mis eventos" desc="Ferias y exposiciones donde vas a estar" />
                <AccionCard to="/panel/cupones" icon="ticket" titulo="Cupones" desc="Descuentos para atraer clientes (Premium)" />
                <AccionCard to="/panel/stats" icon="chart" titulo="Stats avanzadas" desc="Métricas de engagement (Premium)" />
                <AccionCard to="/panel/resumen" icon="sparkle" titulo="Tu resumen" desc="Tu recorrido en una tarjeta para compartir" />
                <AccionCard to="/favoritos" icon="bookmark" titulo="Mis favoritos" desc="Piezas que guardaste para volver" />
                <AccionCard to="/panel/perfil" icon="user" titulo="Editar perfil" desc="Bio, redes, ubicación y foto de perfil" />
                </div>
            </>
            ) : (
            <p style={{ color: 'var(--color-danger)' }}>No se pudieron cargar las estadísticas</p>
            )}
        </div>
        </div>
    )
    }

    // Componente interno — tarjeta de estadística
    function StatCard({ label, value, sub, color }) {
    return (
        <div style={{
        background: 'var(--color-bg-2)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        padding: '20px'
        }}>
        <p style={{ fontSize: '12px', color: 'var(--color-text-2)', marginBottom: '8px' }}>{label}</p>
        <p style={{ fontSize: '28px', fontWeight: '600', color: color || 'var(--color-text)', marginBottom: '4px' }}>
            {value ?? '-'}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>{sub}</p>
        </div>
    )
    }

    // Componente interno — tarjeta de acceso rápido
    function AccionCard({ to, titulo, desc, icon }) {
    return (
        <Link to={to} style={{ textDecoration: 'none' }}>
        <div style={{
            background: 'var(--color-bg-2)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            padding: '20px',
            transition: 'border-color 0.15s',
            cursor: 'pointer'
        }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                {icon && <span style={{ color: 'var(--color-accent)' }}><Icon name={icon} size={18} /></span>}
                <p style={{ fontWeight: '500', color: 'var(--color-text)' }}>{titulo}</p>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>{desc}</p>
        </div>
        </Link>
    )
    }