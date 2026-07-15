import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axios'
import CarruselFotos from '../components/CarruselFotos'
import SeccionComentarios from '../components/SeccionComentarios'
import BotonCompartir from '../components/BotonCompartir'
import BotonWhatsApp from '../components/BotonWhatsApp'
import BotonMeGusta from '../components/BotonMeGusta'
import BotonFavorito from '../components/BotonFavorito'
import BotonReportar from '../components/BotonReportar'
import ThemeToggle from '../components/ThemeToggle'
import PantallaError from '../components/PantallaError'
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

export default function PiezaDetalle() {
    const { id } = useParams()
    const { usuario } = useAuth()
    const [pieza, setPieza] = useState(null)
    const [relacionadas, setRelacionadas] = useState([])
    const [cupones, setCupones] = useState([])  // cupones aplicables a esta pieza
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            api.get(`/piezas/${id}`),
            api.get(`/piezas/${id}/relacionadas`),
            api.get(`/piezas/${id}/cupones`).catch(() => ({ data: [] }))
        ])
            .then(([resPieza, resRel, resCup]) => {
                setPieza(resPieza.data)
                setRelacionadas(resRel.data)
                setCupones(resCup.data)
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }, [id])

    // El mejor cupón aplicable (mayor %) para mostrar el precio descontado
    const mejorCupon = cupones.length > 0
        ? cupones.reduce((max, c) => c.porcentaje > max.porcentaje ? c : max, cupones[0])
        : null
    const precioConDescuento = mejorCupon && pieza
        ? Number(pieza.precio) * (1 - mejorCupon.porcentaje / 100)
        : null

    // SEO + Open Graph para esta pieza
    useSEO({
        title: pieza ? `${pieza.titulo} — ${pieza.artesanoNombre}` : 'Cargando pieza...',
        description: pieza
            ? `${pieza.descripcion || pieza.titulo} — $${Number(pieza.precio).toLocaleString('es-AR')}. Trabajo artesanal de ${pieza.artesanoNombre}.`
            : 'Pieza artesanal',
        image: pieza?.fotos?.[0],
        url: typeof window !== 'undefined' ? window.location.href : null,
        type: 'product'
    })

    if (loading) return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--color-text-2)' }}>Cargando...</p>
        </div>
    )

    if (!pieza) return (
        <PantallaError
            titulo="Pieza no encontrada"
            detalle="Esta pieza no existe, fue vendida o el artesano la quitó de su catálogo."
        />
    )

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>

            {/* Navbar */}
            <nav style={{
                background: 'var(--color-bg-2)', borderBottom: '1px solid var(--color-border)',
                padding: '0 24px', height: '48px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100
            }}>
                <Link to={`/artesano/${pieza.artesanoSlug}`} style={{ fontSize: '14px', color: 'var(--color-text-2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ← Volver al catálogo
                </Link>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <ThemeToggle size="sm" />
                    <Link to="/" style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>Inicio</Link>
                    {usuario ? (
                        <Link to="/panel" style={{ fontSize: '13px', color: 'var(--color-accent)' }}>Mi panel</Link>
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

            <div className="container-page" style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 24px' }}>

                {/* Breadcrumb */}
                <p style={{ fontSize: '13px', color: 'var(--color-text-3)', marginBottom: '20px' }}>
                    <Link to="/" style={{ color: 'var(--color-text-3)' }}>Inicio</Link>
                    {' / '}
                    <Link to={`/artesano/${pieza.artesanoSlug}`} style={{ color: 'var(--color-text-3)' }}>{pieza.artesanoNombre}</Link>
                    {' / '}
                    {pieza.titulo}
                </p>

                <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>

                    {/* Fotos + Video */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                            <CarruselFotos fotos={pieza.fotos} titulo={pieza.titulo} height={340} ajuste="contain" />
                        </div>
                        {pieza.videoUrl && (
                            <div style={{ background: 'var(--color-bg-2)', border: '1px solid color-mix(in srgb, var(--color-premium) 33%, transparent)', borderRadius: 'var(--radius)', overflow: 'hidden', position: 'relative' }}>
                                <span style={{
                                    position: 'absolute', top: '8px', right: '8px', zIndex: 2,
                                    fontSize: '10px', fontWeight: '700',
                                    background: 'var(--color-premium)', color: '#0f0f0f',
                                    padding: '2px 8px', borderRadius: '20px'
                                }}>★ VIDEO</span>
                                <video
                                    src={pieza.videoUrl}
                                    controls
                                    preload="metadata"
                                    style={{ width: '100%', display: 'block', maxHeight: '340px' }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            {pieza.destacada && (
                                <span style={{
                                    display: 'inline-block', marginBottom: '8px',
                                    fontSize: '11px', fontWeight: '700',
                                    background: 'var(--color-premium)', color: '#0f0f0f',
                                    padding: '3px 10px', borderRadius: '20px'
                                }}>
                                    ★ PIEZA DESTACADA
                                </span>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <h1 style={{ fontSize: '22px', fontWeight: '600', lineHeight: '1.3' }}>{pieza.titulo}</h1>
                                <span style={{
                                    fontSize: '12px', color: colorEstado[pieza.estado],
                                    border: `1px solid ${colorEstado[pieza.estado]}`,
                                    borderRadius: '20px', padding: '3px 10px', whiteSpace: 'nowrap', marginLeft: '12px', flexShrink: 0
                                }}>
                                    {labelEstado[pieza.estado]}
                                </span>
                            </div>

                            {mejorCupon ? (
                                <div style={{ marginBottom: '8px' }}>
                                    <p style={{ fontSize: '15px', color: 'var(--color-text-3)', textDecoration: 'line-through', marginBottom: '2px' }}>
                                        ${Number(pieza.precio).toLocaleString('es-AR')}
                                    </p>
                                    <p style={{ fontSize: '26px', fontWeight: '600', color: 'var(--color-premium)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                        ${Math.round(precioConDescuento).toLocaleString('es-AR')}
                                        <span style={{
                                            fontSize: '11px', fontWeight: '700',
                                            background: 'var(--color-premium)', color: '#0f0f0f',
                                            padding: '3px 9px', borderRadius: '20px'
                                        }}>
                                            -{mejorCupon.porcentaje}% con {mejorCupon.codigo}
                                        </span>
                                    </p>
                                    <p style={{ fontSize: '11px', color: 'var(--color-text-3)', marginTop: '4px' }}>
                                        Mencioná el código <strong style={{ color: 'var(--color-premium)' }}>{mejorCupon.codigo}</strong> al artesano para aplicar el descuento
                                    </p>
                                </div>
                            ) : (
                                <p style={{ fontSize: '26px', fontWeight: '600', color: 'var(--color-accent)', marginBottom: '4px' }}>
                                    ${Number(pieza.precio).toLocaleString('es-AR')}
                                </p>
                            )}
                            {pieza.horasTrabajo && (
                                <p style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>
                                    {pieza.horasTrabajo} horas de trabajo
                                </p>
                            )}
                        </div>

                        {pieza.descripcion && (
                            <p style={{ fontSize: '14px', color: 'var(--color-text-2)', lineHeight: '1.7' }}>
                                {pieza.descripcion}
                            </p>
                        )}

                        {pieza.materiales?.length > 0 && (
                            <div>
                                <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Materiales</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {pieza.materiales.map((m, i) => (
                                        <span key={i} style={{
                                            fontSize: '12px', background: 'var(--color-bg-3)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '20px', padding: '3px 10px', color: 'var(--color-text-2)'
                                        }}>{m}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Artesano */}
                        <div style={{
                            background: 'var(--color-bg-3)', border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)', padding: '14px 16px'
                        }}>
                            <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginBottom: '6px' }}>Artesano</p>
                            <Link to={`/artesano/${pieza.artesanoSlug}`} style={{ fontWeight: '500', color: 'var(--color-text)', fontSize: '15px' }}>
                                {pieza.artesanoNombre}
                            </Link>
                            <p style={{ fontSize: '12px', color: 'var(--color-accent)', marginTop: '4px' }}>Ver catálogo completo →</p>
                        </div>

                        {pieza.estado !== 'VENDIDA' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button
                                    onClick={() => {
                                        if (!usuario) {
                                            window.location.href = `/login?next=${window.location.pathname}`
                                            return
                                        }
                                        /*
                                         * Abrimos chat directo con el artesano. Si hay cupón aplicable
                                         * lo incluímos en el mensaje para que el cliente lo mencione directo.
                                         */
                                        const baseMsg = `Hola! Me interesa la pieza "${pieza.titulo}".`
                                        const conCupon = mejorCupon
                                            ? `${baseMsg} ¿Aplica el cupón ${mejorCupon.codigo} (${mejorCupon.porcentaje}% off)?`
                                            : baseMsg
                                        const mensaje = encodeURIComponent(conCupon)
                                        window.location.href = `/chat?con=${pieza.artesanoId}&mensaje=${mensaje}`
                                    }}
                                    style={{
                                        display: 'block', width: '100%', textAlign: 'center',
                                        background: 'var(--color-accent)', color: '#0f0f0f',
                                        border: 'none', borderRadius: 'var(--radius-sm)',
                                        padding: '12px', fontSize: '14px', fontWeight: '500', cursor: 'pointer'
                                    }}
                                >
                                    💬 Consultar por chat interno
                                </button>

                                {/* Consultar por WhatsApp — solo si el artesano cargó su número */}
                                {pieza.artesanoWhatsapp && (
                                    <BotonWhatsApp
                                        numero={pieza.artesanoWhatsapp}
                                        texto={
                                            `Hola! Me interesa la pieza "${pieza.titulo}" ` +
                                            `que vi en tu catálogo de Artesanos.ar` +
                                            (mejorCupon ? `. ¿Aplica el cupón ${mejorCupon.codigo}?` : '.')
                                        }
                                        label="Consultar por WhatsApp"
                                        style={{ width: '100%', padding: '12px' }}
                                    />
                                )}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <BotonMeGusta piezaId={pieza.id} initialCount={pieza.meGustaCount} size="md" />
                            <BotonFavorito piezaId={pieza.id} size="md" />
                            <BotonCompartir
                                titulo={pieza.titulo}
                                texto={`Mirá esta pieza artesanal de ${pieza.artesanoNombre}`}
                                style={{ flex: 1, justifyContent: 'center' }}
                            />
                        </div>
                        <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'flex-end' }}>
                            <BotonReportar tipo="PIEZA" objetoId={pieza.id} sutil />
                        </div>
                    </div>
                </div>

                {/* Comentarios */}
                <div style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                    <SeccionComentarios piezaId={pieza.id} usuario={usuario} />
                </div>

                {/* Más piezas como esta */}
                {relacionadas.length > 0 && (
                    <div style={{ marginTop: '40px' }}>
                        <h2 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '14px' }}>
                            Más piezas como esta
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                            gap: '12px'
                        }}>
                            {relacionadas.map(p => (
                                <Link key={p.id} to={`/artesano/${p.artesanoSlug}/pieza/${p.id}`}
                                    style={{ textDecoration: 'none', display: 'block' }}>
                                    <div style={{
                                        background: 'var(--color-bg-2)',
                                        border: `1px solid ${p.destacada ? 'color-mix(in srgb, var(--color-premium) 33%, transparent)' : 'var(--color-border)'}`,
                                        borderRadius: 'var(--radius-sm)', overflow: 'hidden'
                                    }}>
                                        <CarruselFotos fotos={p.fotos} titulo={p.titulo} height={130} />
                                        <div style={{ padding: '10px 12px' }}>
                                            <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-text)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {p.titulo}
                                            </p>
                                            <p style={{ fontSize: '11px', color: 'var(--color-text-3)', marginBottom: '6px' }}>
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
                )}
            </div>
        </div>
    )
}
