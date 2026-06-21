import { useEffect, useState } from 'react'
import api from '../api/axios'

/*
 * Sección de reseñas para un artesano.
 * - Muestra promedio + cantidad arriba
 * - Form para que un usuario logueado deje su reseña (1 por usuario)
 * - Lista de reseñas existentes
 *
 * El backend valida que el usuario no se reseñe a sí mismo y que no duplique.
 */
export default function SeccionResenas({ slug, usuario }) {
    const [data, setData] = useState({ resenas: [], promedio: 0, total: 0 })
    const [loading, setLoading] = useState(true)
    const [calificacion, setCalificacion] = useState(0)
    const [hover, setHover] = useState(0)
    const [texto, setTexto] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [yaResenado, setYaResenado] = useState(false)

    useEffect(() => {
        cargar()
    }, [slug])

    const cargar = () => {
        setLoading(true)
        api.get(`/artesanos/${slug}/resenas`)
            .then(res => {
                setData(res.data)
                if (usuario) {
                    setYaResenado(res.data.resenas.some(r => r.autorId === usuario.id))
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!calificacion) {
            alert('Elegí una calificación de 1 a 5 estrellas')
            return
        }
        setEnviando(true)
        try {
            await api.post(`/artesanos/${slug}/resenas`, { calificacion, texto })
            setCalificacion(0)
            setTexto('')
            cargar()
        } catch (err) {
            alert(err.response?.data?.message || 'Error al enviar la reseña')
        } finally {
            setEnviando(false)
        }
    }

    const handleEliminar = async (id) => {
        if (!confirm('¿Eliminar esta reseña?')) return
        try {
            await api.delete(`/artesanos/${slug}/resenas/${id}`)
            cargar()
        } catch {
            alert('Error al eliminar')
        }
    }

    if (loading) return null

    return (
        <div style={{
            background: 'var(--color-bg-2)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            padding: '28px',
            marginBottom: '24px'
        }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Reseñas</h2>
                {data.total > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Estrellas valor={data.promedio} readOnly tamano={16} />
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{data.promedio.toFixed(1)}</span>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>
                            ({data.total} {data.total === 1 ? 'reseña' : 'reseñas'})
                        </span>
                    </div>
                )}
            </div>

            {/* Form para nueva reseña — solo si está logueado, no es el mismo artesano y no resenó todavía */}
            {usuario && usuario.slug !== slug && !yaResenado && (
                <form onSubmit={handleSubmit} style={{
                    background: 'var(--color-bg-3)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '16px',
                    marginBottom: '20px'
                }}>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-2)', marginBottom: '10px' }}>
                        ¿Compraste o conocés a este artesano? Dejale una reseña.
                    </p>
                    <div style={{ marginBottom: '12px' }}>
                        <Estrellas
                            valor={hover || calificacion}
                            onChange={setCalificacion}
                            onHover={setHover}
                            tamano={26}
                        />
                    </div>
                    <textarea
                        value={texto}
                        onChange={e => setTexto(e.target.value)}
                        placeholder="Contá tu experiencia (opcional, máx 1000 caracteres)"
                        maxLength={1000}
                        rows={3}
                        style={{
                            width: '100%', background: 'var(--color-bg-2)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                            color: 'var(--color-text)', fontSize: '13px',
                            outline: 'none', resize: 'vertical', boxSizing: 'border-box'
                        }}
                    />
                    <button type="submit" disabled={enviando || !calificacion} style={{
                        marginTop: '10px',
                        background: calificacion ? 'var(--color-accent)' : 'var(--color-bg-3)',
                        color: calificacion ? '#0f0f0f' : 'var(--color-text-3)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 18px',
                        fontSize: '13px', fontWeight: '500',
                        cursor: calificacion ? 'pointer' : 'not-allowed',
                        opacity: enviando ? 0.6 : 1
                    }}>
                        {enviando ? 'Enviando...' : 'Publicar reseña'}
                    </button>
                </form>
            )}

            {usuario && usuario.slug !== slug && yaResenado && (
                <p style={{ fontSize: '13px', color: 'var(--color-text-3)', marginBottom: '20px', fontStyle: 'italic' }}>
                    Ya dejaste tu reseña a este artesano.
                </p>
            )}

            {!usuario && (
                <div style={{
                    background: 'var(--color-bg-3)', borderRadius: 'var(--radius-sm)',
                    padding: '12px 16px', marginBottom: '20px',
                    fontSize: '13px', color: 'var(--color-text-2)'
                }}>
                    <a href={`/login?next=${window.location.pathname}`} style={{ color: 'var(--color-accent)' }}>
                        Ingresá
                    </a>{' '}para dejar una reseña.
                </div>
            )}

            {/* Lista */}
            {data.resenas.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>
                    Todavía no hay reseñas. Sé el primero.
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {data.resenas.map(r => (
                        <div key={r.id} style={{
                            background: 'var(--color-bg-3)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '14px 16px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{r.autorNombre}</span>
                                        <Estrellas valor={r.calificacion} readOnly tamano={14} />
                                    </div>
                                    <span style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>
                                        {new Date(r.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                {usuario && (usuario.id === r.autorId || usuario.slug === slug) && (
                                    <button onClick={() => handleEliminar(r.id)} style={{
                                        background: 'none', border: 'none',
                                        color: 'var(--color-text-3)', cursor: 'pointer',
                                        fontSize: '14px'
                                    }}>×</button>
                                )}
                            </div>
                            {r.texto && (
                                <p style={{ fontSize: '13px', color: 'var(--color-text-2)', lineHeight: '1.6' }}>
                                    {r.texto}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

/*
 * Componente de estrellas reutilizable.
 *  - readOnly=true: solo muestra
 *  - readOnly=false: el usuario puede clickear para elegir
 */
function Estrellas({ valor, onChange, onHover, readOnly, tamano = 18 }) {
    const valorRedondeado = Math.round(valor * 2) / 2 // soporta medias estrellas en display

    return (
        <div style={{ display: 'inline-flex', gap: '2px' }}>
            {[1, 2, 3, 4, 5].map(n => {
                const lleno = readOnly
                    ? n <= valorRedondeado
                    : n <= valor
                return (
                    <span
                        key={n}
                        onClick={readOnly ? undefined : () => onChange?.(n)}
                        onMouseEnter={readOnly ? undefined : () => onHover?.(n)}
                        onMouseLeave={readOnly ? undefined : () => onHover?.(0)}
                        style={{
                            fontSize: `${tamano}px`,
                            color: lleno ? 'var(--color-premium)' : 'var(--color-text-3)',
                            cursor: readOnly ? 'default' : 'pointer',
                            lineHeight: 1,
                            transition: 'color 0.15s'
                        }}
                    >
                        {lleno ? '★' : '☆'}
                    </span>
                )
            })}
        </div>
    )
}
