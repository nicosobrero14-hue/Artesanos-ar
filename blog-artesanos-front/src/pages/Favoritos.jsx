import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import CarruselFotos from '../components/CarruselFotos'
import BotonMeGusta from '../components/BotonMeGusta'
import BotonFavorito from '../components/BotonFavorito'
import { useSEO } from '../hooks/useSEO'

export default function Favoritos() {
    const [piezas, setPiezas] = useState([])
    const [loading, setLoading] = useState(true)

    useSEO({ title: 'Mis favoritos' })

    useEffect(() => {
        api.get('/mis-favoritos')
            .then(res => setPiezas(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }, [])

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
            <Navbar />

            <div className="container-page" style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '4px' }}>
                    🔖 Mis favoritos
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--color-text-2)', marginBottom: '24px' }}>
                    Piezas que guardaste para volver a verlas
                </p>

                {loading ? (
                    <p style={{ color: 'var(--color-text-2)' }}>Cargando...</p>
                ) : piezas.length === 0 ? (
                    <div style={{
                        background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)', padding: '48px', textAlign: 'center'
                    }}>
                        <p style={{ color: 'var(--color-text-2)', marginBottom: '12px' }}>
                            Todavía no guardaste ninguna pieza
                        </p>
                        <Link to="/" style={{ color: 'var(--color-accent)', fontSize: '14px' }}>
                            Explorar piezas →
                        </Link>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: '14px'
                    }}>
                        {piezas.map(p => (
                            <div key={p.id} style={{
                                background: 'var(--color-bg-2)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius)',
                                overflow: 'hidden', position: 'relative'
                            }}>
                                <Link to={`/artesano/${p.artesanoSlug}/pieza/${p.id}`}>
                                    <CarruselFotos fotos={p.fotos} titulo={p.titulo} height={160} />
                                </Link>
                                <div style={{ padding: '12px 14px' }}>
                                    <Link to={`/artesano/${p.artesanoSlug}/pieza/${p.id}`}
                                        style={{ textDecoration: 'none' }}>
                                        <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text)', marginBottom: '4px', lineHeight: '1.3' }}>
                                            {p.titulo}
                                        </p>
                                    </Link>
                                    <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginBottom: '8px' }}>
                                        por <Link to={`/artesano/${p.artesanoSlug}`} style={{ color: 'var(--color-text-2)' }}>{p.artesanoNombre}</Link>
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                                        <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--color-accent)' }}>
                                            ${Number(p.precio).toLocaleString('es-AR')}
                                        </p>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <BotonMeGusta piezaId={p.id} initialCount={p.meGustaCount} size="sm" />
                                            <BotonFavorito piezaId={p.id} size="sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
