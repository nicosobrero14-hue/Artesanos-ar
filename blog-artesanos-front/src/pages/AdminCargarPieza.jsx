import { useEffect, useRef, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import Input from '../components/Input'
import Select from '../components/Select'
import Button from '../components/Button'
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
        horasTrabajo: '', categoria: '', oficio: '', estado: 'DISPONIBLE',
        destacada: false
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
        const { name, value, type, checked } = e.target
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
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
                estado: form.estado,
                destacada: form.destacada
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
            setForm({ titulo: '', descripcion: '', precio: '', horasTrabajo: '', categoria: '', oficio: '', estado: 'DISPONIBLE', destacada: false })
            setFotos([])
        } catch (err) {
            setError(err.response?.data?.message || 'Error al crear la pieza')
        } finally {
            setGuardando(false)
        }
    }

    const artesanoOptions = artesanos.map(a => ({ value: a.id, label: `${a.nombre} (${a.email})` }))

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
            <Navbar />
            <div className="container-page" style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)' }}>
                        📦 Cargar pieza para un artesano
                    </h1>
                    <span style={{
                        background: 'var(--color-premium)', color: '#0f0f0f',
                        fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)',
                        padding: '2px 10px', borderRadius: '20px'
                    }}>⚙ ADMIN</span>
                </div>
                <p style={{ color: 'var(--color-text-2)', fontSize: 'var(--text-base)', marginBottom: '16px' }}>
                    Para onboarding asistido — cargá el catálogo del artesano sin pedirle la contraseña.
                </p>
                <div style={{ marginBottom: '20px' }}>
                    <Link to="/admin" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-2)' }}>
                        ← Volver al admin
                    </Link>
                </div>

                <form onSubmit={handleSubmit} style={{
                    background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)', padding: '20px',
                    display: 'flex', flexDirection: 'column', gap: '14px'
                }}>
                    <Select
                        label="Artesano destino *"
                        value={artesanoId}
                        onChange={e => setArtesanoId(e.target.value)}
                        placeholder="— Elegí el artesano —"
                        options={artesanoOptions}
                    />

                    <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <Input label="Título *" name="titulo" value={form.titulo} onChange={handleChange} required />
                        <Input label="Precio ($) *" name="precio" type="number" value={form.precio} onChange={handleChange} required />
                        <Select
                            label="Oficio *"
                            name="oficio"
                            value={form.oficio}
                            onChange={handleChange}
                            required
                            placeholder="— Elegí —"
                            options={oficios}
                        />
                        <Select
                            label="Estado"
                            name="estado"
                            value={form.estado}
                            onChange={handleChange}
                            options={ESTADOS}
                        />
                        <Input label="Sub-categoría" name="categoria" value={form.categoria} onChange={handleChange} />
                        <Input label="Horas de trabajo" name="horasTrabajo" type="number" value={form.horasTrabajo} onChange={handleChange} />
                    </div>

                    <div>
                        <label htmlFor="ad-desc" style={{
                            display: 'block', fontSize: 'var(--text-sm)',
                            color: 'var(--color-text-2)', marginBottom: '6px'
                        }}>Descripción</label>
                        <textarea
                            id="ad-desc"
                            name="descripcion"
                            value={form.descripcion}
                            onChange={handleChange}
                            rows={3}
                            style={{
                                width: '100%', boxSizing: 'border-box',
                                background: 'var(--color-bg-3)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                                color: 'var(--color-text)', resize: 'vertical',
                                outline: 'none', fontFamily: 'inherit', fontSize: 'var(--text-base)'
                            }}
                        />
                    </div>

                    {/* Destacada — el backend la fuerza a false si el plan del artesano no lo permite */}
                    <label style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', cursor: 'pointer'
                    }}>
                        <input
                            type="checkbox"
                            name="destacada"
                            checked={form.destacada}
                            onChange={handleChange}
                        />
                        Marcar como destacada
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)' }}>
                            (solo se aplica si el artesano tiene Premium activo)
                        </span>
                    </label>

                    {/* Fotos */}
                    <div>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', marginBottom: '6px' }}>
                            Fotos {fotos.length > 0 && <span style={{ color: 'var(--color-text-3)' }}>({fotos.length})</span>}
                        </p>
                        {fotos.length > 0 && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
                                gap: '6px', marginBottom: '8px'
                            }}>
                                {fotos.map((f, idx) => (
                                    <div key={idx} style={{
                                        position: 'relative', aspectRatio: '1',
                                        borderRadius: 'var(--radius-sm)', overflow: 'hidden',
                                        border: '1px solid var(--color-border)'
                                    }}>
                                        <img src={URL.createObjectURL(f)} alt={`Foto ${idx + 1}`}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <button
                                            type="button"
                                            onClick={() => quitarFoto(idx)}
                                            aria-label={`Quitar foto ${idx + 1}`}
                                            className="btn-sm"
                                            style={{
                                                position: 'absolute', top: '2px', right: '2px',
                                                background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none',
                                                borderRadius: '50%', width: '20px', height: '20px',
                                                fontSize: 'var(--text-sm)', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                padding: 0, lineHeight: 1
                                            }}
                                        ><span aria-hidden="true">×</span></button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <input type="file" accept="image/*" multiple ref={fotosRef} onChange={handleFotos} style={{ display: 'none' }} />
                        <button
                            type="button"
                            onClick={() => fotosRef.current?.click()}
                            style={{
                                background: 'transparent',
                                border: '1px dashed var(--color-border)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '12px 14px', fontSize: 'var(--text-base)',
                                color: 'var(--color-text-2)', cursor: 'pointer',
                                width: '100%', textAlign: 'center'
                            }}
                        >
                            📷 Agregar fotos
                        </button>
                    </div>

                    {error && (
                        <p role="alert" style={{ color: 'var(--color-danger)', fontSize: 'var(--text-base)' }}>
                            {error}
                        </p>
                    )}
                    {okMsg && (
                        <p role="status" style={{ color: 'var(--color-success)', fontSize: 'var(--text-base)' }}>
                            {okMsg}
                        </p>
                    )}
                    {progreso && (
                        <p role="status" style={{ color: 'var(--color-accent)', fontSize: 'var(--text-base)' }}>
                            Subiendo foto {progreso.subiendo} de {progreso.total}...
                        </p>
                    )}

                    <Button type="submit" loading={guardando} fullWidth>
                        Crear pieza
                    </Button>
                </form>
            </div>
        </div>
    )
}
