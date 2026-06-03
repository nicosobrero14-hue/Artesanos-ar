import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import api from '../api/axios'
import CarruselFotos from '../components/CarruselFotos'
import BannerEventos from '../components/BannerEventos'
import SidebarOficios from '../components/SidebarOficios'
import MobileDrawer from '../components/MobileDrawer'
import { useAuth } from '../context/AuthContext'
import { useSEO } from '../hooks/useSEO'
import useIsMobile from '../hooks/useIsMobile'


export default function Inicio() {
    const { usuario } = useAuth()
    const isMobile = useIsMobile()
    const [artesanos, setArtesanos] = useState([])
    const [destacadas, setDestacadas] = useState([])
    const [recientes, setRecientes] = useState([])
    const [artesanosDestacados, setArtesanosDestacados] = useState([])
    const [stats, setStats] = useState({ artesanos: 0, piezas: 0, destacadas: 0 })
    const [eventos, setEventos] = useState([])
    const [oficios, setOficios] = useState([])
    const [oficioSeleccionado, setOficioSeleccionado] = useState(null)
    const [artesanoSemana, setArtesanoSemana] = useState(null)
    const [loading, setLoading] = useState(true)
    const [busqueda, setBusqueda] = useState('')
    const [rubroSeleccionado, setRubroSeleccionado] = useState(null)

    useSEO({
        title: 'Trabajo artesanal argentino, directo del taller',
        description: 'Descubrí cuchilleros, joyeros, marroquineros y más artesanos. Conectá directo con quien hace cada pieza.',
        url: typeof window !== 'undefined' ? window.location.origin : null
    })

    useEffect(() => {
        Promise.all([
            api.get('/artesanos'),
            api.get('/home/stats'),
            api.get('/eventos/proximos'),
            api.get('/home/oficios')
        ])
            .then(([resArt, resStats, resEv, resOf]) => {
                setArtesanos(resArt.data)
                setStats(resStats.data)
                setEventos(resEv.data.slice(0, 5))
                setOficios(resOf.data)
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false))

        // Artesano destacado de la semana (independiente, no bloquea el resto)
        api.get('/home/artesano-semana')
            .then(res => setArtesanoSemana(res.data))
            .catch(() => {})
    }, [])

    /*
     * Re-cargar destacadas y recientes cuando cambia el filtro de oficio.
     * Además: polling cada 25 segundos para rotar piezas EN VIVO sin que el
     * usuario tenga que recargar. El backend hace shuffle en cada request, así
     * que cada poll trae el mismo set pero en orden distinto (la rotación visual).
     *
     * Pausamos el poll si la pestaña no está visible para no gastar bandwidth.
     */
    useEffect(() => {
        const params = oficioSeleccionado ? `?oficio=${oficioSeleccionado}` : ''
        const tick = () => {
            if (document.hidden) return
            Promise.all([
                api.get(`/piezas/destacadas${params}`),
                api.get(`/piezas/recientes${params}`),
                api.get('/home/artesanos-destacados')
            ])
                .then(([resDest, resRec, resArtDest]) => {
                    setDestacadas(resDest.data)
                    setRecientes(resRec.data)
                    // Artesanos destacados rotativos (los mostramos primero en el carrusel)
                    setArtesanosDestacados(resArtDest.data)
                })
                .catch(err => console.error(err))
        }
        tick() // fetch inicial
        const id = setInterval(tick, 7500) // refresh cada 25s
        return () => clearInterval(id)
    }, [oficioSeleccionado])

    // Extraemos los rubros únicos de todos los artesanos (split por coma, lowercase)
    const rubrosDisponibles = Array.from(new Set(
        artesanos.flatMap(a => (a.rubros || '').split(',').map(r => r.trim()).filter(Boolean))
    )).sort()

    /*
     * Lista final del carrusel de artesanos:
     *  - Primero los "Artesanos destacados del mes" (rotan en tiempo real, vienen
     *    del endpoint /home/artesanos-destacados que mezcla por engagement)
     *  - Después el resto, alfabético (sin duplicar los que ya están arriba)
     *
     * Aplicamos los filtros de búsqueda y rubro a ambos.
     */
    const idsDestacados = new Set(artesanosDestacados.map(a => a.id))
    const restoArtesanos = artesanos.filter(a => !idsDestacados.has(a.id))
    const artesanosOrdenados = [...artesanosDestacados, ...restoArtesanos]

    const artesanosFiltrados = artesanosOrdenados.filter(a => {
        const q = busqueda.toLowerCase()
        const matchBusqueda = !q
            || a.nombre?.toLowerCase().includes(q)
            || a.ubicacion?.toLowerCase().includes(q)
            || a.rubros?.toLowerCase().includes(q)
        const matchRubro = !rubroSeleccionado
            || (a.rubros || '').toLowerCase().split(',').map(r => r.trim()).includes(rubroSeleccionado.toLowerCase())
        return matchBusqueda && matchRubro
    })

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>

            {/* ── Top bar — siempre visible arriba ─────────────────────── */}
            <TopBar usuario={usuario} />

            {/* ── Banner de próximos eventos (rotativo) ────────────────── */}
            <BannerEventos eventos={eventos} />

            {/* ── Hero ──────────────────────────────────────────────────── */}
            <Hero
                busqueda={busqueda}
                setBusqueda={setBusqueda}
                stats={stats}
                loading={loading}
            />

            {/*
              * Filtros de oficio — patrón distinto por dispositivo:
              *  - Desktop: sidebar lateral que se expande con hover (no invasivo).
              *  - Mobile: fila horizontal de chips sticky bajo el navbar (el hover
              *    no aplica en táctil y el sidebar fijo molestaba).
              */}
            {!loading && oficios.length > 0 && (
                isMobile ? (
                    <FiltrosOficio
                        oficios={oficios}
                        seleccionado={oficioSeleccionado}
                        onSeleccionar={setOficioSeleccionado}
                    />
                ) : (
                    <SidebarOficios
                        oficios={oficios}
                        seleccionado={oficioSeleccionado}
                        onSeleccionar={setOficioSeleccionado}
                    />
                )
            )}

            {/* ── Artesano destacado de la semana ──────────────────────── */}
            {artesanoSemana && <SeccionArtesanoSemana artesano={artesanoSemana} />}

            {/* ── Vidriera de piezas destacadas (solo premium) ─────────── */}
            {!loading && destacadas.length > 0 && (
                <SeccionDestacadas piezas={destacadas} />
            )}

            {/* ── Piezas recientes (todos, cards más chicas) ───────────── */}
            {!loading && recientes.length > 0 && (
                <SeccionRecientes piezas={recientes} />
            )}

            {/* ── Carrusel de artesanos ────────────────────────────────── */}
            <SeccionArtesanos
                artesanos={artesanosFiltrados}
                loading={loading}
                busqueda={busqueda}
            />

            {/* ── Footer simple ────────────────────────────────────────── */}
            <Footer />
        </div>
    )
}

// ────────────────────────────────────────────────────────────────────────
// Top bar — barra superior con logo y auth.
// En mobile colapsa todo a un menú hamburguesa + drawer.
// ────────────────────────────────────────────────────────────────────────
function TopBar({ usuario }) {
    const { logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [drawerAbierto, setDrawerAbierto] = useState(false)

    useEffect(() => { setDrawerAbierto(false) }, [location.pathname])

    const handleSalir = () => {
        logout()
        navigate('/')
        setDrawerAbierto(false)
    }

    return (
        <>
            <nav style={{
                background: 'var(--color-bg-2)',
                borderBottom: '1px solid var(--color-border)',
                padding: '0 24px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                backdropFilter: 'blur(10px)'
            }}>
                <Link to="/" style={{
                    color: 'var(--color-accent)',
                    fontWeight: '700',
                    fontSize: '17px',
                    letterSpacing: '-0.01em',
                    flexShrink: 0
                }}>
                    Artesanos<span style={{ color: 'var(--color-text-3)', fontWeight: '400' }}>.ar</span>
                </Link>

                {/* Links desktop */}
                <div className="solo-desktop" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <Link to="/novedades" style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
                        ✨ Novedades
                    </Link>
                    <Link to="/eventos" style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
                        📅 Eventos
                    </Link>
                    <Link to="/ranking" style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
                        🏆 Ranking
                    </Link>
                    {usuario ? (
                        <>
                            <span style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
                                Hola, <strong style={{ color: 'var(--color-text)' }}>{usuario.nombre}</strong>
                            </span>
                            {usuario.slug && (
                                <Link to={`/artesano/${usuario.slug}`}
                                    style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
                                    Mi catálogo
                                </Link>
                            )}
                            <Link to="/panel" style={btnAccent}>
                                Mi panel
                            </Link>
                            <button onClick={handleSalir} title="Cerrar sesión" style={btnGhost}>
                                Salir
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
                                Ingresar
                            </Link>
                            <Link to="/registro" style={btnAccent}>
                                Registrá tu taller
                            </Link>
                        </>
                    )}
                </div>

                {/* Hamburguesa — solo mobile */}
                <button
                    className="solo-mobile-flex"
                    onClick={() => setDrawerAbierto(true)}
                    aria-label="Abrir menú"
                    style={{
                        display: 'none',
                        background: 'transparent',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        width: '38px', height: '38px',
                        alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-text)'
                    }}
                >
                    <span style={{ fontSize: '18px', lineHeight: 1 }}>☰</span>
                </button>
            </nav>

            {/* Drawer mobile */}
            <MobileDrawer abierto={drawerAbierto} onClose={() => setDrawerAbierto(false)}>
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '15px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {usuario ? `Hola, ${usuario.nombre}` : 'Menú'}
                        </p>
                        {usuario?.email && (
                            <p style={{ fontSize: '11px', color: 'var(--color-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {usuario.email}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => setDrawerAbierto(false)}
                        aria-label="Cerrar"
                        style={{
                            background: 'transparent', border: 'none',
                            color: 'var(--color-text-2)', fontSize: '22px',
                            lineHeight: 1, padding: '4px 8px'
                        }}
                    >×</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 0', flex: 1 }}>
                    <Link to="/" style={linkDrawer}>🏠 Inicio</Link>
                    <Link to="/novedades" style={linkDrawer}>✨ Novedades</Link>
                    <Link to="/eventos" style={linkDrawer}>📅 Eventos</Link>
                    <Link to="/ranking" style={linkDrawer}>🏆 Ranking</Link>
                    {usuario && usuario.slug && (
                        <Link to={`/artesano/${usuario.slug}`} style={linkDrawer}>📖 Mi catálogo</Link>
                    )}
                    {usuario && (
                        <Link to="/panel" style={{ ...linkDrawer, color: 'var(--color-accent)', fontWeight: '600' }}>
                            ⚙ Mi panel
                        </Link>
                    )}
                </div>

                <div style={{
                    borderTop: '1px solid var(--color-border)',
                    padding: '14px 20px',
                    display: 'flex', flexDirection: 'column', gap: '8px'
                }}>
                    {usuario ? (
                        <button onClick={handleSalir} style={{ ...btnGhost, width: '100%' }}>
                            Cerrar sesión
                        </button>
                    ) : (
                        <>
                            <Link to="/login" style={{ ...btnGhost, textAlign: 'center' }}>
                                Ingresar
                            </Link>
                            <Link to="/registro" style={{ ...btnAccent, textAlign: 'center' }}>
                                Registrá tu taller
                            </Link>
                        </>
                    )}
                </div>
            </MobileDrawer>
        </>
    )
}

const linkDrawer = {
    padding: '12px 20px',
    fontSize: '14px',
    color: 'var(--color-text)',
    borderBottom: '1px solid var(--color-border)'
}

const btnAccent = {
    fontSize: '13px',
    background: 'var(--color-accent)',
    color: '#0f0f0f',
    padding: '8px 16px',
    borderRadius: 'var(--radius-sm)',
    fontWeight: '500',
    border: 'none'
}

const btnGhost = {
    background: 'transparent',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 14px',
    color: 'var(--color-text-2)',
    fontSize: '13px',
    cursor: 'pointer'
}

// ────────────────────────────────────────────────────────────────────────
// Hero — título + buscador + stats
// ────────────────────────────────────────────────────────────────────────
function Hero({ busqueda, setBusqueda, stats, loading }) {
    const navigate = useNavigate()
    const submitBusqueda = (e) => {
        e.preventDefault()
        if (busqueda.trim()) navigate(`/buscar?q=${encodeURIComponent(busqueda.trim())}`)
    }
    return (
        <div className="hero-section" style={{
            background: `
                radial-gradient(circle at 20% 0%, rgba(245, 185, 79, 0.08), transparent 40%),
                radial-gradient(circle at 80% 100%, rgba(76, 175, 130, 0.05), transparent 40%),
                var(--color-bg-2)
            `,
            borderBottom: '1px solid var(--color-border)',
            padding: '72px 24px 48px',
            position: 'relative'
        }}>
            <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
                <p style={{
                    fontSize: '12px',
                    color: 'var(--color-accent)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    fontWeight: '600',
                    marginBottom: '14px'
                }}>
                    ✦ Hecho en Argentina
                </p>
                <h1 style={{
                    fontSize: 'clamp(32px, 5vw, 44px)',
                    fontWeight: '700',
                    marginBottom: '14px',
                    color: 'var(--color-text)',
                    lineHeight: '1.15',
                    letterSpacing: '-0.02em'
                }}>
                    Trabajo artesanal,<br />
                    <span style={{ color: 'var(--color-accent)' }}>directo del taller</span>
                </h1>
                <p style={{
                    fontSize: '16px',
                    color: 'var(--color-text-2)',
                    marginBottom: '32px',
                    lineHeight: '1.6',
                    maxWidth: '540px',
                    margin: '0 auto 32px'
                }}>
                    Cuchilleros, joyeros, marroquineros y más. Descubrí piezas únicas y conectá directo con quien las hace.
                </p>

                {/* Buscador con icono */}
                <form onSubmit={submitBusqueda} style={{
                    position: 'relative',
                    maxWidth: '520px',
                    margin: '0 auto 28px'
                }}>
                    <span style={{
                        position: 'absolute',
                        left: '20px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--color-text-3)',
                        fontSize: '16px',
                        pointerEvents: 'none'
                    }}>⌕</span>
                    <input
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        placeholder="Buscar piezas, artesanos, rubros..."
                        style={{
                            width: '100%',
                            background: 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '40px',
                            padding: '14px 20px 14px 46px',
                            color: 'var(--color-text)',
                            fontSize: '15px',
                            outline: 'none',
                            boxSizing: 'border-box',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                    />
                    {busqueda && (
                        <button type="submit" style={{
                            position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                            background: 'var(--color-accent)', color: '#0f0f0f',
                            border: 'none', borderRadius: '40px', padding: '8px 18px',
                            fontSize: '13px', fontWeight: '500', cursor: 'pointer'
                        }}>Buscar →</button>
                    )}
                </form>

                {/* Stats */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '40px',
                    flexWrap: 'wrap',
                    paddingTop: '8px'
                }}>
                    <Stat number={stats.artesanos} label="artesanos" loading={loading} />
                    <Stat number={stats.piezas} label="piezas publicadas" loading={loading} />
                    <Stat number={stats.destacadas} label="destacadas" loading={loading} highlight />
                </div>
            </div>
        </div>
    )
}

function Stat({ number, label, loading, highlight }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <p style={{
                fontSize: '26px',
                fontWeight: '700',
                color: highlight ? '#f5b94f' : 'var(--color-text)',
                lineHeight: '1',
                marginBottom: '4px',
                fontVariantNumeric: 'tabular-nums'
            }}>
                {loading ? '—' : number}
            </p>
            <p style={{
                fontSize: '11px',
                color: 'var(--color-text-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
            }}>
                {label}
            </p>
        </div>
    )
}

// ────────────────────────────────────────────────────────────────────────
// Filtros por oficio (chips horizontales scrolleables, sticky bajo el topbar)
// ────────────────────────────────────────────────────────────────────────
function FiltrosOficio({ oficios, seleccionado, onSeleccionar }) {
    return (
        <div style={{
            background: 'var(--color-bg-2)',
            borderBottom: '1px solid var(--color-border)',
            padding: '10px 16px',
            position: 'sticky', top: '56px', zIndex: 90
        }}>
            <div style={{
                maxWidth: '1100px', margin: '0 auto',
                display: 'flex', gap: '6px', flexWrap: 'nowrap',
                overflowX: 'auto', alignItems: 'center',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
            }}>
                <button onClick={() => onSeleccionar(null)} style={chipStyle(!seleccionado)}>
                    Todos
                </button>
                {oficios.map(o => (
                    <button key={o.value}
                        onClick={() => onSeleccionar(o.value === seleccionado ? null : o.value)}
                        style={chipStyle(seleccionado === o.value)}>
                        {o.label}
                    </button>
                ))}
            </div>
        </div>
    )
}

function chipStyle(activo) {
    return {
        background: activo ? 'var(--color-accent)' : 'transparent',
        color: activo ? '#0f0f0f' : 'var(--color-text-2)',
        border: `1px solid ${activo ? 'var(--color-accent)' : 'var(--color-border)'}`,
        borderRadius: '20px',
        padding: '6px 14px',
        fontSize: '13px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        fontWeight: activo ? '500' : '400'
    }
}

// ────────────────────────────────────────────────────────────────────────
// Artesano destacado de la semana
// ────────────────────────────────────────────────────────────────────────
function SeccionArtesanoSemana({ artesano }) {
    return (
        <div className="section-pad" style={{
            borderBottom: '1px solid var(--color-border)',
            padding: '36px 24px',
            background: 'linear-gradient(135deg, #1c1710, var(--color-bg))'
        }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <p style={{
                    fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'var(--color-accent)', fontWeight: '600', marginBottom: '14px'
                }}>
                    ⭐ Artesano de la semana
                </p>
                <Link to={`/artesano/${artesano.slug}`} style={{ textDecoration: 'none' }}>
                    <div className="stack-mobile" style={{
                        display: 'flex', gap: '20px', alignItems: 'center',
                        background: 'var(--color-bg-2)',
                        border: '1px solid var(--color-accent)',
                        borderRadius: 'var(--radius)',
                        padding: '20px'
                    }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
                            background: 'var(--color-bg-3)', border: '1px solid var(--color-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '30px', fontWeight: '600', color: 'var(--color-accent)',
                            overflow: 'hidden'
                        }}>
                            {artesano.avatarUrl
                                ? <img src={artesano.avatarUrl} alt={artesano.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : artesano.nombre?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '2px' }}>
                                {artesano.nombre}
                            </p>
                            {artesano.ubicacion && (
                                <p style={{ fontSize: '13px', color: 'var(--color-text-3)', marginBottom: '6px' }}>
                                    {artesano.ubicacion}
                                </p>
                            )}
                            {artesano.bio && (
                                <p style={{
                                    fontSize: '13px', color: 'var(--color-text-2)', lineHeight: '1.5',
                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}>
                                    {artesano.bio}
                                </p>
                            )}
                        </div>
                        <span style={{
                            flexShrink: 0,
                            background: 'var(--color-accent)', color: '#0f0f0f',
                            borderRadius: 'var(--radius-sm)', padding: '8px 16px',
                            fontSize: '13px', fontWeight: '600'
                        }}>
                            Ver catálogo →
                        </span>
                    </div>
                </Link>
            </div>
        </div>
    )
}

// ────────────────────────────────────────────────────────────────────────
// Sección destacadas
// ────────────────────────────────────────────────────────────────────────
function SeccionDestacadas({ piezas }) {
    return (
        <div style={{
            background: 'linear-gradient(180deg, rgba(245, 185, 79, 0.06), rgba(245, 185, 79, 0))',
            borderBottom: '1px solid var(--color-border)',
            padding: '48px 24px'
        }} className="section-pad">
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <SectionHeader
                    titulo={<><span style={{ color: '#f5b94f' }}>★</span> Piezas destacadas</>}
                    subtitulo="Lo mejor de nuestros artesanos premium"
                    contador={`${piezas.length} ${piezas.length === 1 ? 'pieza' : 'piezas'}`}
                />
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '14px'
                }}>
                    {piezas.map(p => (
                        <Link key={p.id} to={`/artesano/${p.artesanoSlug}/pieza/${p.id}`}
                            style={{ textDecoration: 'none', display: 'block' }}>
                            <div className="card-destacada" style={{
                                background: 'var(--color-bg-2)',
                                border: '1px solid #f5b94f55',
                                borderRadius: 'var(--radius)',
                                overflow: 'hidden',
                                transition: 'all 0.2s',
                                position: 'relative'
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#f5b94f'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 185, 79, 0.15)' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#f5b94f55'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                                <span style={{
                                    position: 'absolute', top: '10px', left: '10px', zIndex: 2,
                                    fontSize: '10px', fontWeight: '700',
                                    background: '#f5b94f', color: '#0f0f0f',
                                    padding: '3px 9px', borderRadius: '20px',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                                }}>★ DESTACADA</span>
                                <CarruselFotos fotos={p.fotos} titulo={p.titulo} height={170} />
                                <div style={{ padding: '14px 16px' }}>
                                    <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', lineHeight: '1.3' }}>
                                        {p.titulo}
                                    </p>
                                    <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginBottom: '8px' }}>
                                        por {p.artesanoNombre}
                                    </p>
                                    <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--color-accent)' }}>
                                        ${Number(p.precio).toLocaleString('es-AR')}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ────────────────────────────────────────────────────────────────────────
// Sección recientes
// ────────────────────────────────────────────────────────────────────────
function SeccionRecientes({ piezas }) {
    return (
        <div className="section-pad" style={{ borderBottom: '1px solid var(--color-border)', padding: '40px 24px' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <SectionHeader
                    titulo="Piezas recientes"
                    subtitulo="Lo nuevo de toda la comunidad"
                    contador={`${piezas.length} ${piezas.length === 1 ? 'pieza' : 'piezas'}`}
                />
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                    gap: '12px'
                }}>
                    {piezas.map(p => (
                        <Link key={p.id} to={`/artesano/${p.artesanoSlug}/pieza/${p.id}`}
                            style={{ textDecoration: 'none', display: 'block' }}>
                            <div style={{
                                background: 'var(--color-bg-2)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-sm)',
                                overflow: 'hidden',
                                transition: 'all 0.15s'
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                                <CarruselFotos fotos={p.fotos} titulo={p.titulo} height={130} />
                                <div style={{ padding: '10px 12px' }}>
                                    <p style={{ fontSize: '13px', fontWeight: '500', marginBottom: '2px', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {p.titulo}
                                    </p>
                                    <p style={{ fontSize: '11px', color: 'var(--color-text-3)', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {p.artesanoNombre}
                                    </p>
                                    <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-accent)' }}>
                                        ${Number(p.precio).toLocaleString('es-AR')}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ────────────────────────────────────────────────────────────────────────
// Sección artesanos — carrusel horizontal
// ────────────────────────────────────────────────────────────────────────
function SeccionArtesanos({ artesanos, loading, busqueda }) {
    const scrollRef = useRef(null)

    const scroll = (dir) => {
        const el = scrollRef.current
        if (!el) return
        const cardWidth = 296 // 280 + 16 gap
        el.scrollBy({ left: dir * cardWidth * 2, behavior: 'smooth' })
    }

    return (
        <div className="section-pad" style={{ padding: '48px 24px' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '20px', gap: '8px' }}>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>Nuestros artesanos</h2>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
                            {loading ? 'Cargando...' : `${artesanos.length} ${artesanos.length === 1 ? 'taller' : 'talleres'}`}
                        </p>
                    </div>
                    {/* Botones de scroll — solo en desktop */}
                    {!loading && artesanos.length > 3 && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <BotonScroll onClick={() => scroll(-1)}>‹</BotonScroll>
                            <BotonScroll onClick={() => scroll(1)}>›</BotonScroll>
                        </div>
                    )}
                </div>

                {loading ? (
                    <p style={{ color: 'var(--color-text-2)' }}>Cargando artesanos...</p>
                ) : artesanos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', background: 'var(--color-bg-2)', borderRadius: 'var(--radius)' }}>
                        <p style={{ color: 'var(--color-text-2)', marginBottom: '8px' }}>
                            {busqueda ? `No encontramos artesanos con "${busqueda}"` : 'Todavía no hay artesanos registrados'}
                        </p>
                        {!busqueda && (
                            <Link to="/registro" style={{ color: 'var(--color-accent)', fontSize: '14px' }}>
                                Sé el primero en registrarte →
                            </Link>
                        )}
                    </div>
                ) : (
                    <div
                        ref={scrollRef}
                        style={{
                            display: 'flex',
                            gap: '16px',
                            overflowX: 'auto',
                            scrollBehavior: 'smooth',
                            scrollSnapType: 'x mandatory',
                            paddingBottom: '8px',
                            // Hide scrollbar — opcional, queda más limpio
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'var(--color-border) transparent'
                        }}
                    >
                        {artesanos.map(a => <CardArtesano key={a.id} artesano={a} />)}
                    </div>
                )}
            </div>
        </div>
    )
}

function CardArtesano({ artesano }) {
    return (
        <Link to={`/artesano/${artesano.slug}`} style={{ textDecoration: 'none', flexShrink: 0, scrollSnapAlign: 'start' }}>
            <div style={{
                width: '280px',
                background: 'var(--color-bg-2)',
                border: `1px solid ${artesano.esPremium ? '#f5b94f55' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius)',
                padding: '20px',
                transition: 'all 0.2s',
                height: '100%',
                position: 'relative'
            }}
                onMouseEnter={e => {
                    e.currentTarget.style.borderColor = artesano.esPremium ? '#f5b94f' : 'var(--color-accent)'
                    e.currentTarget.style.transform = 'translateY(-3px)'
                    e.currentTarget.style.boxShadow = artesano.esPremium
                        ? '0 8px 24px rgba(245, 185, 79, 0.12)'
                        : '0 4px 16px rgba(0,0,0,0.2)'
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.borderColor = artesano.esPremium ? '#f5b94f55' : 'var(--color-border)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                }}>
                {artesano.esPremium && (
                    <span style={{
                        position: 'absolute', top: '12px', right: '12px',
                        fontSize: '9px', fontWeight: '700',
                        background: '#f5b94f', color: '#0f0f0f',
                        padding: '2px 7px', borderRadius: '20px'
                    }}>★ PREMIUM</span>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <div style={{
                        width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
                        background: 'var(--color-bg-3)',
                        border: `2px solid ${artesano.esPremium ? '#f5b94f' : 'var(--color-border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '20px', fontWeight: '600', color: 'var(--color-accent)',
                        overflow: 'hidden'
                    }}>
                        {artesano.avatarUrl
                            ? <img src={artesano.avatarUrl} alt={artesano.nombre}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : artesano.nombre?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                            fontWeight: '600', color: 'var(--color-text)', fontSize: '15px',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                            {artesano.nombre}
                        </p>
                        {artesano.ubicacion && (
                            <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '2px' }}>
                                ◉ {artesano.ubicacion}
                            </p>
                        )}
                    </div>
                </div>

                {artesano.bio && (
                    <p style={{
                        fontSize: '13px', color: 'var(--color-text-2)', lineHeight: '1.55',
                        marginBottom: '14px',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}>
                        {artesano.bio}
                    </p>
                )}

                {artesano.rubros && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                        {artesano.rubros.split(',').slice(0, 3).map((r, i) => (
                            <span key={i} style={{
                                fontSize: '11px',
                                background: 'var(--color-bg-3)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '20px',
                                padding: '2px 9px',
                                color: 'var(--color-text-2)'
                            }}>
                                {r.trim()}
                            </span>
                        ))}
                    </div>
                )}

                <p style={{ fontSize: '12px', color: 'var(--color-accent)', fontWeight: '500' }}>
                    Ver catálogo →
                </p>
            </div>
        </Link>
    )
}

function BotonScroll({ children, onClick }) {
    return (
        <button onClick={onClick} style={{
            width: '36px', height: '36px',
            background: 'var(--color-bg-2)',
            border: '1px solid var(--color-border)',
            borderRadius: '50%',
            color: 'var(--color-text-2)',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: '1', paddingBottom: '2px',
            transition: 'all 0.15s'
        }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-2)' }}>
            {children}
        </button>
    )
}

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────
function SectionHeader({ titulo, subtitulo, contador }) {
    return (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {titulo}
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>
                    {subtitulo}
                </p>
            </div>
            {contador && (
                <span style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>{contador}</span>
            )}
        </div>
    )
}

function Footer() {
    return (
        <footer className="section-pad" style={{
            borderTop: '1px solid var(--color-border)',
            padding: '32px 24px',
            background: 'var(--color-bg-2)'
        }}>
            <div className="stack-mobile" style={{
                maxWidth: '1100px', margin: '0 auto',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', gap: '16px', flexWrap: 'wrap'
            }}>
                <div>
                    <p style={{ fontWeight: '600', color: 'var(--color-accent)', marginBottom: '4px' }}>
                        Artesanos<span style={{ color: 'var(--color-text-3)', fontWeight: '400' }}>.ar</span>
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>
                        Trabajo artesanal argentino, directo del taller.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '20px', fontSize: '13px', flexWrap: 'wrap' }}>
                    <Link to="/premium" style={{ color: 'var(--color-text-2)' }}>Premium</Link>
                    <Link to="/eventos" style={{ color: 'var(--color-text-2)' }}>Eventos</Link>
                    <Link to="/ranking" style={{ color: 'var(--color-text-2)' }}>Ranking</Link>
                    <Link to="/registro" style={{ color: 'var(--color-text-2)' }}>Registrate</Link>
                    <Link to="/terminos" style={{ color: 'var(--color-text-3)' }}>Términos</Link>
                    <Link to="/privacidad" style={{ color: 'var(--color-text-3)' }}>Privacidad</Link>
                </div>
            </div>
        </footer>
    )
}
