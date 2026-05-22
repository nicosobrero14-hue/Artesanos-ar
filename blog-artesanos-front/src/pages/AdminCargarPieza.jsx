import { useEffect, useRef, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

/*
 * Admin → Cargar pieza para un artesano.
 * Onboarding asistido: el admin crea piezas (con fotos) en la cuenta de
 * cualquier artesano, sin pedirle la contraseña. Sirve para migrar catálogos.
 */
const ESTADOS = ['DISPONIBLE', 'ENCARGO', 'RESERVADA', 'VENDIDA']

export default function AdminCargarPieza() {
    const { usuario } = useAuth()
    const [artesanos, setArtesanos] = useState([])
    const [oficios, setOficios] = useState([])
    const [artesanoId, setArtesanoId] = useState('')
    const [form, setForm] = useState({
        titulo: '', descripcion: '', precio: '',
        horasTrabajo: '', categoria: '', oficio: '', estado: 'DISPONIBLE'
    })
    const [fotos, setFotos] = useState([])
    const [guardando, setGuardando] = useState(false)
    const [progreso, setProgreso] = useState(null)
    const [error, setError] = useState('')
    const [okMsg, setOkMsg] = useState('')
    const fotosRef = useRef(null)

    useEffect(() => {
        if (usuario?.rol !== 'ADMIN') return
        api.get('/admin/artesanos').then(res => {
            // Excluimos admins de la lista de destino
            setArtesanos(res.data.filter(a => a.rol !== 'ADMIN'))
        }).catch(() => {})
        api.get('/home/oficios').then(res => setOficios(res.data)).catch(() => {})
    }, [usuario])

    if (usuario && usuario.rol !== 'ADMIN') return <Navigate to="/panel" replace />

    const handleChange = e => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    const handleFotos = e => {
        const archivos = Array.from(e.target.files || []).filter(a => a.type.startsWith('image/'))
        setFotos(prev => [...prev, ...archivos])
        e.target.value = ''
    }

    const quitarFoto = (idx) => setFotos(prev => prev.filter((_, i) => i !== idx))

    const handleSubmit = async e => {
        e.preventDefault()
        setError('')
        setOkMsg('')
        if (!artesanoId) { setError('Elegí el artesano destino'); return }
        if (!form.oficio) { setError('Elegí el oficio'); return }

        setGuardando(true)
        try {
            const payload = {
                titulo: form.titulo,
                descripcion: form.descripcion,
                precio: parseFloat(form.precio),
                horasTrabajo: form.horasTrabajo ? parseInt(form.horasTrabajo) : null,
                categoria: form.categoria,
                oficio: form.oficio,
                estado: form.estado
            }
            const { data: pieza } = await api.post(`/admin/artesanos/${artesanoId}/piezas`, payload)

            // Subir fotos una por una
            for (let i = 0; i < fotos.length; i++) {
                setProgreso({ subiendo: i + 1, total: fotos.length })
                const fd = new FormData()
                fd.append('foto', fotos[i])
                try {
                    await api.post(`/admin/piezas/${pieza.id}/fotos`, fd, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    })
                } catch {
                    setError(`La pieza se creó pero falló la foto ${i + 1}.`)
                    break
                }
            }
            setProgreso(null)

            const nombreArt = artesanos.find(a => String(a.id) === String(artesanoId))?.nombre || ''
            setOkMsg(`✓ Pieza "${form.titulo}" creada para ${nombreArt}.`)
            // Reset form (mantiene el artesano seleccionado para cargar varias seguidas)
            setForm({ titulo: '', descripcion: '', precio: '', horasTrabajo: '', categoria: '', oficio: '', estado: 'DISPONIBLE' })
            setFotos([])
        } catch (err) {
            setError(err.response?.data?.message || 'Error al crear la pieza')
        } finally {
            setGuardando(false)
        }
    }

    const inputStyle = {
        width: '100%', boxSizing: 'border-box',
        background: 'var(--color-bg-3)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)', padding: '10px 12px',
        color: 'var(--color-text)', fontSize: '14px', outline: 'none'
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
            <Navbar />
            <div className="container-page" style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h1 style={{ fontSize: '22px', fontWeight: '600' }}>📦 Cargar pieza para un artesano</h1>
                    <span style={{
                        background: '#f5b94f', color: '#0f0f0f',
                        fontSize: '11px', fontWeight: '700', padding: '2px 10px', borderRadius: '20px'
                    }}>⚙ ADMIN</span>
                </div>
                <p style={{ color: 'var(--color-text-2)', fontSize: '14px', marginBottom: '16px' }}>
                    Para onboarding asistido — cargá el catálogo del artesano sin pedirle la contraseña.
                </p>
                <div style={{ marginBottom: '20px' }}>
                    <Link to="/admin" style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>← Volver al admin</Link>
                </div>

                <form onSubmit={handleSubmit} style={{
                    background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)', padding: '20px',
                    display: 'flex', flexDirection: 'column', gap: '14px'
                }}>
                    <div>
                        <label style={labelStyle}>Artesano destino *</label>
                        <select value={artesanoId} onChange={e => setArtesanoId(e.target.value)} style={inputStyle}>
                            <option value="">— Elegí el artesano —</option>
                            {artesanos.map(a => (
                                <option key={a.id} value={a.id}>{a.nombre} ({a.email})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={labelStyle}>Título *</label>
                            <input name="titulo" value={form.titulo} onChange={handleChange} required style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Precio ($) *</label>
                            <input name="precio" type="number" value={form.precio} onChange={handleChange} required style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Oficio *</label>
                            <select name="oficio" value={form.oficio} onChange={handleChange} required style={inputStyle}>
                                <option value="">— Elegí —</option>
                                {oficios.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Estado</label>
                            <select name="estado" value={form.estado} onChange={handleChange} style={inputStyle}>
                                {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Sub-categoría</label>
                            <input name="categoria" value={form.categoria} onChange={handleChange} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Horas de trabajo</label>
                            <input name="horasTrabajo" type="number" value={form.horasTrabajo} onChange={handleChange} style={inputStyle} />
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Descripción</label>
                        <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={3}
                            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
                    </div>

                    {/* Fotos */}
                    <div>
                        <label style={labelStyle}>Fotos</label>
                        {fotos.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '6px', marginBottom: '8px' }}>
                                {fotos.map((f, idx) => (
                                    <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                                        <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <button type="button" onClick={() => quitarFoto(idx)} style={{
                                            position: 'absolute', top: '2px', right: '2px',
                                            background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none',
                                            borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px', cursor: 'pointer'
                                        }}>×</button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <input type="file" accept="image/*" multiple ref={fotosRef} onChange={handleFotos} style={{ display: 'none' }} />
                        <button type="button" onClick={() => fotosRef.current?.click()} style={{
                            background: 'transparent', border: '1px dashed var(--color-border)',
                            borderRadius: 'var(--radius-sm)', padding: '8px 14px',
                            fontSize: '13px', color: 'var(--color-text-2)', cursor: 'pointer'
                        }}>📷 Agregar fotos</button>
                    </div>

                    {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px' }}>{error}</p>}
                    {okMsg && <p style={{ color: 'var(--color-success)', fontSize: '13px' }}>{okMsg}</p>}
                    {progreso && (
                        <p style={{ color: 'var(--color-accent)', fontSize: '13px' }}>
                            Subiendo foto {progreso.subiendo} de {progreso.total}...
                        </p>
                    )}

                    <button type="submit" disabled={guardando} style={{
                        background: 'var(--color-accent)', color: '#0f0f0f', border: 'none',
                        borderRadius: 'var(--radius-sm)', padding: '11px', fontSize: '14px',
                        fontWeight: '600', cursor: guardando ? 'wait' : 'pointer', opacity: guardando ? 0.6 : 1
                    }}>
                        {guardando ? 'Creando...' : 'Crear pieza'}
                    </button>
                </form>
            </div>
        </div>
    )
}

const labelStyle = {
    display: 'block', fontSize: '13px', color: 'var(--color-text-2)', marginBottom: '6px'
}
