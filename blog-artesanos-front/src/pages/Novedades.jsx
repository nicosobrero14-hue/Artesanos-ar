import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import CarruselFotos from '../components/CarruselFotos'
import { useAuth } from '../context/AuthContext'
import { useSEO } from '../hooks/useSEO'

/*
 * Feed de Novedades — las últimas piezas subidas por toda la comunidad.
 * Le da a los artesanos una razón de volver: ver qué hay de nuevo.
 */
export default function Novedades() {
    const { estaLogueado } = useAuth()
    const [piezas, setPiezas] = useState([])
    const [loading, setLoading] = useState(true)

    useSEO({
        title: 'Novedades — lo último de la comunidad',
        description: 'Las piezas más recientes subidas por los artesanos de Artesanos.ar.'
    })

    useEffect(() => {
        api.get('/piezas/novedades')
            .then(res => setPiezas(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }, [])

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
            {estaLogueado ? <Navbar /> : <NavbarPublico />}

            <div className="container-page" style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '4px' }}>
                    ✨ Novedades
                </h1>
                <p style={{ color: 'var(--color-text-2)', fontSize: '14px', marginBottom: '24px' }}>
                    Lo último que subió la comunidad de artesanos.
                </p>

                {loading ? (
                    <p style={{ color: 'var(--color-text-2)' }}>Cargando...</p>
                ) : piezas.length === 0 ? (
                    <div style={{
                        background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)', padding: '48px', textAlign: 'center'
                    }}>
                        <p style={{ color: 'var(--color-text-2)' }}>Todavía no hay piezas publicadas.</p>
                    </div>
                ) : (
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
                )}
            </div>
        </div>
    )
}

/*
 * Navbar mínima para visitantes no logueados — la página es pública.
 */
function NavbarPublico() {
    return (
        <nav style={{
            background: 'var(--color-bg-2)', borderBottom: '1px solid var(--color-border)',
            padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100
        }}>
            <Link to="/" style={{ color: 'var(--color-accent)', fontWeight: '700', fontSize: '17px' }}>
                Artesanos<span style={{ color: 'var(--color-text-3)', fontWeight: '400' }}>.ar</span>
            </Link>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <Link to="/" style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>Inicio</Link>
                <Link to="/login" style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>Ingresar</Link>
                <Link to="/registro" style={{
                    fontSize: '13px', background: 'var(--color-accent)', color: '#0f0f0f',
                    padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontWeight: '500'
                }}>Registrarse</Link>
            </div>
        </nav>
    )
}
