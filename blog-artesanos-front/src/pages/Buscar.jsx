import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import CarruselFotos from '../components/CarruselFotos'
import { useSEO } from '../hooks/useSEO'
import { useAuth } from '../context/AuthContext'

/*
 * Búsqueda global. Acepta `?q=...` desde la URL para que sea bookmarkeable.
 * Muestra resultados en dos secciones: piezas y artesanos.
 */
export default function Buscar() {
    const { usuario } = useAuth()
    const [params, setParams] = useSearchParams()
    const q = params.get('q') || ''
    const [input, setInput] = useState(q)
    const [piezas, setPiezas] = useState([])
    const [artesanos, setArtesanos] = useState([])
    const [loading, setLoading] = useState(false)

    useSEO({ title: q ? `Buscando "${q}"` : 'Buscar' })

    useEffect(() => {
        if (!q || q.trim().length < 2) {
            setPiezas([]); setArtesanos([])
            return
        }
        setLoading(true)
        Promise.all([
            api.get(`/piezas/buscar?q=${encodeURIComponent(q)}`),
            api.get('/artesanos')
        ])
            .then(([resPiezas, resArt]) => {
                setPiezas(resPiezas.data)
                // Filtramos artesanos en frontend por simplicidad
                const ql = q.toLowerCase()
                setArtesanos(resArt.data.filter(a =>
                    a.nombre?.toLowerCase().includes(ql)
                    || a.ubicacion?.toLowerCase().includes(ql)
                    || a.rubros?.toLowerCase().includes(ql)
                ))
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [q])

    const handleSubmit = (e) => {
        e.preventDefault()
        if (input.trim()) setParams({ q: input.trim() })
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>

            {/* Topbar */}
            <nav style={{
                background: 'var(--color-bg-2)', borderBottom: '1px solid var(--color-border)',
                padding: '0 24px', height: '56px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'sticky', top: 0, zIndex: 100
            }}>
                <Link to="/" style={{ color: 'var(--color-accent)', fontWeight: '700', fontSize: '17px' }}>
                    Artesanos<span style={{ color: 'var(--color-text-3)', fontWeight: '400' }}>.ar</span>
                </Link>
                <div style={{ display: 'flex', gap: '14px', fontSize: '13px' }}>
                    <Link to="/" style={{ color: 'var(--color-text-2)' }}>Inicio</Link>
                    {usuario ? (
                        <Link to="/panel" style={{ color: 'var(--color-accent)' }}>Mi panel</Link>
                    ) : (
                        <Link to="/login" style={{ color: 'var(--color-text-2)' }}>Ingresar</Link>
                    )}
                </div>
            </nav>

            <div className="container-page" style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>

                <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px' }}>
                    Buscar
                </h1>

                <form onSubmit={handleSubmit} style={{ marginBottom: '32px' }}>
                    <input
                        autoFocus
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Buscar piezas, artesanos, rubros..."
                        style={{
                            width: '100%', boxSizing: 'border-box',
                            background: 'var(--color-bg-3)', border: '1px solid var(--color-border)',
                            borderRadius: '40px', padding: '14px 22px',
                            color: 'var(--color-text)', fontSize: '15px', outline: 'none'
                        }}
                    />
                </form>

                {q && q.trim().length < 2 && (
                    <p style={{ color: 'var(--color-text-3)', textAlign: 'center', padding: '40px' }}>
                        Escribí al menos 2 caracteres para buscar
                    </p>
                )}

                {loading && <p style={{ color: 'var(--color-text-2)' }}>Buscando...</p>}

                {!loading && q && q.trim().length >= 2 && (
                    <>
                        {/* Artesanos encontrados */}
                        {artesanos.length > 0 && (
                            <div style={{ marginBottom: '32px' }}>
                                <h2 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                                    Artesanos ({artesanos.length})
                                </h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                                    {artesanos.map(a => (
                                        <Link key={a.id} to={`/artesano/${a.slug}`} style={{ textDecoration: 'none' }}>
                                            <div style={{
                                                background: 'var(--color-bg-2)',
                                                border: `1px solid ${a.esPremium ? '#f5b94f55' : 'var(--color-border)'}`,
                                                borderRadius: 'var(--radius)',
                                                padding: '16px',
                                                display: 'flex', alignItems: 'center', gap: '12px'
                                            }}>
                                                <div style={{
                                                    width: '44px', height: '44px', borderRadius: '50%',
                                                    background: 'var(--color-bg-3)', flexShrink: 0,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '18px', fontWeight: '600', color: 'var(--color-accent)',
                                                    overflow: 'hidden'
                                                }}>
                                                    {a.avatarUrl
                                                        ? <img src={a.avatarUrl} alt={a.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        : a.nombre?.charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontWeight: '500', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {a.nombre}
                                                        {a.esPremium && <span style={{ color: '#f5b94f', marginLeft: '6px' }}>★</span>}
                                                    </p>
                                                    {a.ubicacion && (
                                                        <p style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>{a.ubicacion}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Piezas encontradas */}
                        {piezas.length > 0 && (
                            <div>
                                <h2 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                                    Piezas ({piezas.length})
                                </h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                                    {piezas.map(p => (
                                        <Link key={p.id} to={`/artesano/${p.artesanoSlug}/pieza/${p.id}`}
                                            style={{ textDecoration: 'none', display: 'block' }}>
                                            <div style={{
                                                background: 'var(--color-bg-2)',
                                                border: `1px solid ${p.destacada ? '#f5b94f55' : 'var(--color-border)'}`,
                                                borderRadius: 'var(--radius-sm)',
                                                overflow: 'hidden'
                                            }}>
                                                <CarruselFotos fotos={p.fotos} titulo={p.titulo} height={140} />
                                                <div style={{ padding: '10px 12px' }}>
                                                    <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-text)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {p.destacada && <span style={{ color: '#f5b94f', marginRight: '4px' }}>★</span>}
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
                        )}

                        {piezas.length === 0 && artesanos.length === 0 && (
                            <div style={{
                                background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius)', padding: '48px', textAlign: 'center'
                            }}>
                                <p style={{ color: 'var(--color-text-2)', marginBottom: '8px' }}>
                                    No encontramos resultados para <strong>"{q}"</strong>
                                </p>
                                <p style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>
                                    Probá con otra palabra o explorá <Link to="/" style={{ color: 'var(--color-accent)' }}>desde el inicio</Link>
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
