import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axios'
import CarruselFotos from '../components/CarruselFotos'
import SeccionComentarios from '../components/SeccionComentarios'
import SeccionResenas from '../components/SeccionResenas'
import CuponesVigentes from '../components/CuponesVigentes'
import BotonCompartir from '../components/BotonCompartir'
import ThemeToggle from '../components/ThemeToggle'
import BotonWhatsApp from '../components/BotonWhatsApp'
import BotonMeGusta from '../components/BotonMeGusta'
import { useAuth } from '../context/AuthContext'
import { useSEO } from '../hooks/useSEO'

const colorEstado = {
    DISPONIBLE: 'var(--color-success)',
    ENCARGO: 'var(--color-accent)',
    RESERVADA: 'var(--color-reservada)',
    VENDIDA: 'var(--color-text-3)'
}

const labelEstado = {
    DISPONIBLE: 'Disponible',
    ENCARGO: 'En encargo',
    RESERVADA: 'Reservada',
    VENDIDA: 'Vendida'
}

export default function CatalogoPublico() {
    const { slug } = useParams()
    const { usuario } = useAuth()
    const [artesano, setArtesano] = useState(null)
    const [piezas, setPiezas] = useState([])
    const [filtro, setFiltro] = useState('TODAS')
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({ nombre: '', email: '', mensaje: '' })
    const [enviando, setEnviando] = useState(false)
    const [enviado, setEnviado] = useState(false)
    const [piezaSeleccionada, setPiezaSeleccionada] = useState(null)

    useEffect(() => {
        Promise.all([
            api.get(`/artesanos/${slug}`),
            api.get(`/artesanos/${slug}/piezas`)
        ])
            .then(([resArtesano, resPiezas]) => {
                setArtesano(resArtesano.data)
                setPiezas(resPiezas.data)
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }, [slug])

    useSEO({
        title: artesano ? `${artesano.nombre} — Catálogo` : 'Cargando catálogo...',
        description: artesano
            ? `${artesano.bio || `Catálogo de ${artesano.nombre}.`} Conocé sus piezas y consultá directo.`
            : 'Catálogo de artesano',
        image: artesano?.avatarUrl,
        url: typeof window !== 'undefined' ? window.location.href : null,
        type: 'profile'
    })

    // Pre-llenar el form con los datos del usuario logueado
    useEffect(() => {
        if (usuario) {
            setForm(f => ({
                ...f,
                nombre: usuario.nombre || '',
                email: usuario.email || ''
            }))
        }
    }, [usuario])

    const piezasFiltradas = filtro === 'TODAS'
        ? piezas
        : piezas.filter(p => p.estado === filtro)

    const handleContacto = async e => {
        e.preventDefault()
        setEnviando(true)
        try {
            await api.post(`/artesanos/${slug}/contacto`, {
                ...form, piezaId: piezaSeleccionada?.id || null
            })
            setEnviado(true)
            setForm(f => ({ ...f, mensaje: '' }))
            setPiezaSeleccionada(null)
        } catch {
            alert('Error al enviar el mensaje')
        } finally {
            setEnviando(false)
        }
    }

    if (loading) return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--color-text-2)' }}>Cargando catalogo...</p>
        </div>
    )

    if (!artesano) return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--color-danger)' }}>Artesano no encontrado</p>
        </div>
    )

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>

            {/* Navbar */}
            <nav style={{
                background: 'var(--color-bg-2)', borderBottom: '1px solid var(--color-border)',
                padding: '0 24px', height: '48px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100
            }}>
                <Link to="/" style={{ fontSize: '14px', color: 'var(--color-text-2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ← Inicio
                </Link>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <ThemeToggle size="sm" />
                    {usuario ? (
                        <>
                            <span className="solo-desktop" style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>{usuario.nombre}</span>
                            <Link to="/panel" style={{ fontSize: '13px', color: 'var(--color-accent)' }}>Mi panel</Link>
                        </>
                    ) : (
                        <>
                            <Link to="/login" style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>Ingresar</Link>
                            <Link to="/registro" style={{
                                fontSize: '13px', background: 'var(--color-accent)', color: '#0f0f0f',
                                padding: '5px 14px', borderRadius: 'var(--radius-sm)', fontWeight: '500'
                            }}>Registrarse</Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Header del artesano */}
            <div style={{ background: 'var(--color-bg-2)', borderBottom: '1px solid var(--color-border)', padding: '40px 24px' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                    <div style={{
                        width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0,
                        background: 'var(--color-bg-3)', border: '1px solid var(--color-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '26px', fontWeight: '600', color: 'var(--color-accent)', overflow: 'hidden'
                    }}>
                        {artesano.avatarUrl
                            ? <img src={artesano.avatarUrl} alt={artesano.nombre} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            : artesano.nombre?.charAt(0).toUpperCase()
                        }
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '4px' }}>{artesano.nombre}</h1>
                        {artesano.ubicacion && <p style={{ fontSize: '13px', color: 'var(--color-text-2)', marginBottom: '10px' }}>{artesano.ubicacion}</p>}
                        {artesano.bio && <p style={{ fontSize: '14px', color: 'var(--color-text-2)', lineHeight: '1.6', maxWidth: '600px', marginBottom: '14px' }}>{artesano.bio}</p>}
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                            {artesano.instagram && (
                                <a href={`https://instagram.com/${artesano.instagram.replace('@', '')}`}
                                    target="_blank" rel="noreferrer"
                                    aria-label="Ver Instagram"
                                    title={`@${artesano.instagram.replace('@', '')}`}
                                    style={iconLinkStyle}>
                                    <IconInstagram />
                                </a>
                            )}
                            {artesano.whatsapp && (
                                <a href={`https://wa.me/${artesano.whatsapp.replace(/\D/g, '')}`}
                                    target="_blank" rel="noreferrer"
                                    aria-label="Escribir por WhatsApp"
                                    title="WhatsApp"
                                    style={iconLinkStyle}>
                                    <IconWhatsApp />
                                </a>
                            )}
                            <BotonCompartir
                                titulo={`${artesano.nombre} — Artesanos.ar`}
                                texto={`Mirá el trabajo de ${artesano.nombre}`}
                                style={{ padding: '5px 12px', fontSize: '13px' }}
                            />
                            {/*
                             * "Compartir catálogo" solo tiene sentido en el propio perfil —
                             * si estoy mirando el catálogo de otra persona no soy yo quien lo
                             * "comparte", así que lo escondemos para no confundir.
                             */}
                            {usuario?.slug === slug && (
                                <BotonWhatsApp
                                    texto={
                                        `Mirá mi catálogo en Artesanos.ar 👇\n` +
                                        (typeof window !== 'undefined' ? window.location.href : '')
                                    }
                                    label="Compartir catálogo"
                                    style={{ padding: '5px 12px', fontSize: '13px' }}
                                />
                            )}
                            {usuario && usuario.slug !== slug && (
                                <Link to={`/chat?con=${artesano.id}`} style={{
                                    fontSize: '13px',
                                    background: 'var(--color-accent)', color: '#0f0f0f',
                                    border: '1px solid var(--color-accent)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '5px 12px',
                                    fontWeight: '500'
                                }}>
                                    💬 Iniciar chat
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container-page" style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

                {/* Cupones vigentes (si hay) */}
                <CuponesVigentes slug={slug} />

                {/* Reseñas del artesano */}
                <SeccionResenas slug={slug} usuario={usuario} />

                {/* Filtros */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    {['TODAS', 'DISPONIBLE', 'ENCARGO', 'VENDIDA'].map(f => (
                        <button key={f} onClick={() => setFiltro(f)} style={{
                            background: filtro === f ? 'var(--color-accent)' : 'transparent',
                            color: filtro === f ? '#0f0f0f' : 'var(--color-text-2)',
                            border: `1px solid ${filtro === f ? 'var(--color-accent)' : 'var(--color-border)'}`,
                            borderRadius: '20px', padding: '5px 14px', fontSize: '13px', cursor: 'pointer'
                        }}>
                            {f === 'TODAS' ? 'Todas' : labelEstado[f]}
                        </button>
                    ))}
                </div>

                {/* Grid de piezas */}
                {piezasFiltradas.length === 0 ? (
                    <p style={{ color: 'var(--color-text-2)', textAlign: 'center', padding: '48px 0' }}>
                        No hay piezas en esta categoria
                    </p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginBottom: '48px' }}>
                        {piezasFiltradas.map(pieza => (
                            <div key={pieza.id} style={{
                                background: 'var(--color-bg-2)',
                                border: `1px solid ${pieza.destacada ? 'var(--color-premium)' : 'var(--color-border)'}`,
                                borderRadius: 'var(--radius)', overflow: 'hidden', position: 'relative'
                            }}>
                                {pieza.destacada && (
                                    <span style={{
                                        position: 'absolute', top: '10px', left: '10px', zIndex: 2,
                                        fontSize: '10px', fontWeight: '700',
                                        background: 'var(--color-premium)', color: '#0f0f0f',
                                        padding: '3px 9px', borderRadius: '20px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                                    }}>
                                        ★ DESTACADA
                                    </span>
                                )}

                                <Link to={`/artesano/${slug}/pieza/${pieza.id}`} style={{ display: 'block' }}>
                                    <CarruselFotos fotos={pieza.fotos} titulo={pieza.titulo} height={180} />
                                </Link>

                                <div style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                        <Link to={`/artesano/${slug}/pieza/${pieza.id}`} style={{ textDecoration: 'none' }}>
                                            <h3 style={{ fontSize: '15px', fontWeight: '500', color: 'var(--color-text)' }}>{pieza.titulo}</h3>
                                        </Link>
                                        <span style={{ fontSize: '11px', color: colorEstado[pieza.estado], border: `1px solid ${colorEstado[pieza.estado]}`, borderRadius: '20px', padding: '2px 8px', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                                            {labelEstado[pieza.estado]}
                                        </span>
                                    </div>

                                    {pieza.descripcion && (
                                        <p style={{ fontSize: '13px', color: 'var(--color-text-2)', marginBottom: '10px', lineHeight: '1.5' }}>
                                            {pieza.descripcion.length > 80 ? pieza.descripcion.slice(0, 80) + '...' : pieza.descripcion}
                                        </p>
                                    )}

                                    {pieza.materiales?.length > 0 && (
                                        <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginBottom: '10px' }}>
                                            {pieza.materiales.join(' · ')}
                                        </p>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--color-accent)' }}>
                                            ${Number(pieza.precio).toLocaleString('es-AR')}
                                        </span>
                                        <BotonMeGusta piezaId={pieza.id} initialCount={pieza.meGustaCount} size="sm" />
                                    </div>

                                    {pieza.estado !== 'VENDIDA' && (
                                        <button
                                            onClick={() => {
                                                if (!usuario) {
                                                    window.location.href = `/login?next=${window.location.pathname}`
                                                    return
                                                }
                                                /*
                                                 * Abrimos chat directo con el artesano, con el título
                                                 * de la pieza pre-llenado en el mensaje inicial via querystring.
                                                 */
                                                const mensaje = encodeURIComponent(`Hola! Me interesa la pieza "${pieza.titulo}".`)
                                                window.location.href = `/chat?con=${artesano.id}&mensaje=${mensaje}`
                                            }}
                                            style={{
                                                marginTop: '12px', width: '100%', background: 'transparent',
                                                border: '1px solid var(--color-accent)', borderRadius: 'var(--radius-sm)',
                                                padding: '8px', color: 'var(--color-accent)', fontSize: '13px', cursor: 'pointer'
                                            }}
                                        >
                                            💬 Consultar
                                        </button>
                                    )}
                                </div>

                                <SeccionComentarios piezaId={pieza.id} usuario={usuario} />
                            </div>
                        ))}
                    </div>
                )}

                {/* CTA de contacto — unificado con el chat in-app */}
                {usuario && usuario.slug !== slug ? (
                    <div id="form-contacto" style={{
                        background: 'linear-gradient(135deg, var(--color-bg-2), var(--color-bg-3))',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)', padding: '32px', textAlign: 'center'
                    }}>
                        <p style={{ fontSize: '28px', marginBottom: '8px' }}>💬</p>
                        <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '6px' }}>
                            ¿Querés consultarle algo a {artesano.nombre}?
                        </h2>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-2)', marginBottom: '20px' }}>
                            Abrí un chat directo. Las respuestas las vas a ver acá mismo, con notificaciones en tiempo real.
                        </p>
                        <Link to={`/chat?con=${artesano.id}`} style={{
                            display: 'inline-block', background: 'var(--color-accent)', color: '#0f0f0f',
                            padding: '12px 28px', borderRadius: 'var(--radius-sm)',
                            fontWeight: '600', fontSize: '15px'
                        }}>
                            💬 Iniciar chat con {artesano.nombre}
                        </Link>
                    </div>
                ) : !usuario ? (
                    <div id="form-contacto" style={{
                        background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)', padding: '32px', textAlign: 'center'
                    }}>
                        <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                            ¿Querés contactar a {artesano.nombre}?
                        </p>
                        <p style={{ fontSize: '14px', color: 'var(--color-text-2)', marginBottom: '20px' }}>
                            Tenés que tener una cuenta para chatear directo. Es gratis.
                        </p>
                        <a href={`/login?next=${window.location.pathname}`} style={{
                            display: 'inline-block', background: 'var(--color-accent)', color: '#0f0f0f',
                            padding: '10px 24px', borderRadius: 'var(--radius-sm)',
                            fontWeight: '500', fontSize: '14px'
                        }}>
                            Ingresar para chatear
                        </a>
                        <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--color-text-3)' }}>
                            ¿No tenés cuenta? <a href="/registro" style={{ color: 'var(--color-accent)' }}>Registrate gratis</a>
                        </p>
                    </div>
                ) : null}
            </div>
        </div>
    )
}

/* ── Estilos e iconos compartidos del header ────────────────────────────── */

const iconLinkStyle = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '34px', height: '34px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-2)',
    background: 'transparent',
    transition: 'color 0.15s, border-color 0.15s'
}

function IconInstagram() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
    )
}

function IconWhatsApp() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.52 3.48A11.94 11.94 0 0 0 12.05 0C5.5 0 .17 5.33.17 11.88c0 2.09.55 4.13 1.59 5.93L0 24l6.34-1.66a11.86 11.86 0 0 0 5.7 1.45h.01c6.55 0 11.88-5.33 11.88-11.88 0-3.17-1.24-6.15-3.41-8.43zM12.05 21.6h-.01a9.7 9.7 0 0 1-4.94-1.35l-.35-.21-3.76.98 1-3.67-.23-.38a9.68 9.68 0 0 1-1.48-5.09c0-5.36 4.36-9.72 9.72-9.72 2.6 0 5.03 1.01 6.87 2.85a9.66 9.66 0 0 1 2.85 6.87c0 5.36-4.36 9.72-9.72 9.72zm5.32-7.28c-.29-.15-1.72-.85-1.99-.94-.27-.1-.46-.15-.66.15-.19.29-.75.94-.92 1.13-.17.19-.34.22-.63.07-.29-.15-1.23-.45-2.34-1.44-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.44.13-.59.13-.13.29-.34.44-.51.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.15-.66-1.59-.9-2.18-.24-.57-.48-.49-.66-.5l-.56-.01a1.09 1.09 0 0 0-.79.37c-.27.29-1.03 1.01-1.03 2.46 0 1.45 1.05 2.85 1.2 3.05.15.19 2.07 3.16 5.02 4.43.7.3 1.25.48 1.68.61.7.22 1.34.19 1.85.12.56-.08 1.72-.7 1.97-1.38.24-.68.24-1.26.17-1.38-.07-.12-.27-.19-.56-.34z" />
        </svg>
    )
}
