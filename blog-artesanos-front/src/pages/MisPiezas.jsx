import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import Input from '../components/Input'
import CarruselFotos from '../components/CarruselFotos'

const ESTADOS = ['DISPONIBLE', 'ENCARGO', 'RESERVADA', 'VENDIDA']

const colorEstado = {
    DISPONIBLE: 'var(--color-success)',
    ENCARGO: 'var(--color-accent)',
    RESERVADA: '#7c8cf8',
    VENDIDA: 'var(--color-text-3)'
    }

    // ── Visor de foto ampliada ─────────────────────────────────────────────────
    // Definido FUERA del componente principal para que React no lo trate
    // como parte del render. Recibe la URL y una función para cerrarlo.
    function VisorFoto({ url, onClose }) {
    if (!url) return null
    return (
        <div
        onClick={onClose}
        style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out'
        }}
        >
        <img
            src={url}
            alt="Vista ampliada"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }}
        />
        <button
            onClick={onClose}
            style={{
            position: 'fixed', top: '16px', right: '16px',
            background: 'rgba(255,255,255,0.12)', border: 'none',
            borderRadius: '50%', width: '36px', height: '36px',
            color: 'white', fontSize: '20px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
        >
            ×
        </button>
        </div>
    )
    }

    const labelEstado = {
    DISPONIBLE: 'Disponible',
    ENCARGO: 'En encargo',
    RESERVADA: 'Reservada',
    VENDIDA: 'Vendida'
    }

    // ── Componente principal ───────────────────────────────────────────────────
    export default function MisPiezas() {
    const [piezas, setPiezas] = useState([])
    const [plan, setPlan] = useState(null)
    const [loading, setLoading] = useState(true)
    const [filtroEstado, setFiltroEstado] = useState('TODAS')
    const [mostrarForm, setMostrarForm] = useState(false)
    const [editando, setEditando] = useState(null)
    const [form, setForm] = useState({
        titulo: '', descripcion: '', precio: '',
        horasTrabajo: '', categoria: '', oficio: '',
        estado: 'DISPONIBLE', destacada: false
    })
    const [oficios, setOficios] = useState([])
    const [guardando, setGuardando] = useState(false)
    const [error, setError] = useState('')
    const [subiendoFoto, setSubiendoFoto] = useState(null)
    const [piezaFotoId, setPiezaFotoId] = useState(null)
    const [fotoVisor, setFotoVisor] = useState(null)
    const [subiendoVideo, setSubiendoVideo] = useState(null)
    const [piezaVideoId, setPiezaVideoId] = useState(null)
    const fileInputRef = useRef(null)
    const videoInputRef = useRef(null)

    useEffect(() => {
        cargarPiezas()
        cargarPlan()
        api.get('/home/oficios').then(res => setOficios(res.data)).catch(() => {})
    }, [])

    const cargarPiezas = () => {
        api.get('/mis-piezas')
        .then(res => setPiezas(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
    }

    const cargarPlan = () => {
        api.get('/artesanos/mi-panel/plan')
        .then(res => setPlan(res.data))
        .catch(err => console.error(err))
    }

    // Helpers de plan
    const limitePiezasAlcanzado = plan?.maxPiezas != null && piezas.length >= plan.maxPiezas
    const maxFotos = plan?.maxFotosPorPieza ?? 10
    const puedeDestacar = plan?.puedeDestacar ?? false

    const eliminarFoto = async (piezaId, indice) => {
        try {
        const { data } = await api.delete(`/mis-piezas/${piezaId}/fotos/${indice}`)
        // Actualizamos solo la pieza afectada en el estado local, sin recargar todo
        setPiezas(prev => prev.map(p => p.id === piezaId ? data : p))
        } catch (err) {
        alert('Error al eliminar la foto')
        }
    }

    const handleChange = e => {
        const { name, value, type, checked } = e.target
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const abrirCrear = () => {
        setEditando(null)
        setForm({ titulo: '', descripcion: '', precio: '', horasTrabajo: '', categoria: '', oficio: '', estado: 'DISPONIBLE', destacada: false })
        setError('')
        setMostrarForm(true)
    }

    const abrirEditar = (pieza) => {
        setEditando(pieza)
        setForm({
        titulo: pieza.titulo,
        descripcion: pieza.descripcion || '',
        precio: pieza.precio,
        horasTrabajo: pieza.horasTrabajo || '',
        categoria: pieza.categoria || '',
        oficio: pieza.oficio || '',
        estado: pieza.estado,
        destacada: pieza.destacada
        })
        setError('')
        setMostrarForm(true)
    }

    const piezasFiltradas = filtroEstado === 'TODAS'
        ? piezas
        : piezas.filter(p => p.estado === filtroEstado)

    const handleGuardar = async e => {
        e.preventDefault()
        setError('')
        if (!form.oficio) {
            setError('Elegí el oficio al que pertenece la pieza')
            return
        }
        setGuardando(true)
        try {
        const payload = {
            ...form,
            precio: parseFloat(form.precio),
            horasTrabajo: form.horasTrabajo ? parseInt(form.horasTrabajo) : null
        }
        if (editando) {
            await api.put(`/mis-piezas/${editando.id}`, payload)
        } else {
            await api.post('/mis-piezas', payload)
        }
        setMostrarForm(false)
        cargarPiezas()
        cargarPlan()
        } catch (err) {
        // El backend manda mensajes específicos cuando se llega al límite
        const msg = err.response?.data?.message || 'Error al guardar la pieza'
        setError(msg)
        } finally {
        setGuardando(false)
        }
    }

    const handleEliminar = async (id) => {
        if (!confirm('¿Eliminar esta pieza?')) return
        try {
        await api.delete(`/mis-piezas/${id}`)
        cargarPiezas()
        } catch (err) {
        alert('Error al eliminar')
        }
    }

    const abrirSelectorFoto = (piezaId) => {
        setPiezaFotoId(piezaId)
        fileInputRef.current.click()
    }

    const abrirSelectorVideo = (piezaId) => {
        setPiezaVideoId(piezaId)
        videoInputRef.current.click()
    }

    const handleVideoSeleccionado = async e => {
        const archivo = e.target.files[0]
        if (!archivo) return
        // Pre-validación: 50MB max para que no espere subiendo en vano
        if (archivo.size > 50 * 1024 * 1024) {
            alert('El video supera los 50MB. Comprimilo o recortalo antes de subir.')
            e.target.value = ''
            return
        }
        setSubiendoVideo(piezaVideoId)
        const formData = new FormData()
        formData.append('video', archivo)
        try {
            await api.post(`/mis-piezas/${piezaVideoId}/video`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            cargarPiezas()
        } catch (err) {
            const msg = err.response?.data?.message || 'Error al subir el video'
            alert(msg)
        } finally {
            setSubiendoVideo(null)
            e.target.value = ''
        }
    }

    const eliminarVideo = async (piezaId) => {
        if (!confirm('¿Eliminar el video de esta pieza?')) return
        try {
            await api.delete(`/mis-piezas/${piezaId}/video`)
            cargarPiezas()
        } catch (err) {
            alert('Error al eliminar el video')
        }
    }

    const handleFotoSeleccionada = async e => {
        const archivo = e.target.files[0]
        if (!archivo) return
        setSubiendoFoto(piezaFotoId)
        const formData = new FormData()
        formData.append('foto', archivo)
        try {
        await api.post(`/mis-piezas/${piezaFotoId}/fotos`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        cargarPiezas()
        } catch (err) {
        const msg = err.response?.data?.message || 'Error al subir la foto'
        alert(msg)
        } finally {
        setSubiendoFoto(null)
        e.target.value = ''
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>

        {/* Visor de foto ampliada — se monta aquí arriba para que quede sobre todo */}
        <VisorFoto url={fotoVisor} onClose={() => setFotoVisor(null)} />

        <Navbar />

        {/* Input de archivo oculto — fotos */}
        <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFotoSeleccionada}
            style={{ display: 'none' }}
        />
        {/* Input de archivo oculto — video */}
        <input
            type="file"
            accept="video/*"
            ref={videoInputRef}
            onChange={handleVideoSeleccionado}
            style={{ display: 'none' }}
        />

        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

            {/* Encabezado */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
            <div>
                <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '4px' }}>Mis piezas</h1>
                {plan && (
                <p style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
                    {plan.maxPiezas
                    ? `${piezas.length} de ${plan.maxPiezas} piezas usadas`
                    : `${piezas.length} piezas (ilimitadas en Premium)`}
                </p>
                )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {limitePiezasAlcanzado && (
                <Link to="/premium" style={{
                    fontSize: '12px', color: '#f5b94f', fontWeight: '500',
                    border: '1px solid #f5b94f', borderRadius: '20px', padding: '4px 12px'
                }}>
                    Llegaste al límite — pasate a Premium
                </Link>
                )}
                <Button onClick={abrirCrear} disabled={limitePiezasAlcanzado}>+ Nueva pieza</Button>
            </div>
            </div>

            {/* Formulario crear / editar */}
            {mostrarForm && (
            <div style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '24px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '20px' }}>
                {editando ? 'Editar pieza' : 'Nueva pieza'}
                </h2>
                <form onSubmit={handleGuardar}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <Input label="Título *" name="titulo" value={form.titulo} onChange={handleChange} required />
                    <Input label="Precio ($) *" name="precio" type="number" value={form.precio} onChange={handleChange} required />
                    <div>
                        <label style={{ fontSize: '13px', color: 'var(--color-text-2)', display: 'block', marginBottom: '6px' }}>
                            Oficio <span style={{ color: 'var(--color-danger)' }}>*</span>
                        </label>
                        <select name="oficio" value={form.oficio} onChange={handleChange} required
                            style={{ width: '100%', background: 'var(--color-bg-3)', border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                                color: form.oficio ? 'var(--color-text)' : 'var(--color-text-3)',
                                fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}>
                            <option value="">— Elegí el oficio —</option>
                            {oficios.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                    <Input label="Sub-categoría (opcional)" name="categoria" placeholder="Ej: Facón, Pulsera" value={form.categoria} onChange={handleChange} />
                    <Input label="Horas de trabajo" name="horasTrabajo" type="number" value={form.horasTrabajo} onChange={handleChange} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--color-text-2)', display: 'block', marginBottom: '6px' }}>Descripción</label>
                    <textarea
                    name="descripcion" value={form.descripcion} onChange={handleChange} rows={3}
                    style={{ width: '100%', background: 'var(--color-bg-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', color: 'var(--color-text)', resize: 'vertical', outline: 'none' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                    <label style={{ fontSize: '13px', color: 'var(--color-text-2)', display: 'block', marginBottom: '6px' }}>Estado</label>
                    <select name="estado" value={form.estado} onChange={handleChange}
                        style={{ background: 'var(--color-bg-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', color: 'var(--color-text)', outline: 'none' }}>
                        {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                    </div>
                    <label style={{
                        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px',
                        color: puedeDestacar ? 'var(--color-text-2)' : 'var(--color-text-3)',
                        cursor: puedeDestacar ? 'pointer' : 'not-allowed', marginTop: '18px'
                    }}>
                    <input
                        type="checkbox" name="destacada"
                        checked={form.destacada && puedeDestacar}
                        onChange={handleChange}
                        disabled={!puedeDestacar}
                    />
                    Marcar como destacada
                    {!puedeDestacar && (
                        <Link to="/premium" style={{ fontSize: '11px', color: '#f5b94f', marginLeft: '4px' }}>
                        (Premium)
                        </Link>
                    )}
                    </label>
                </div>
                {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button type="submit" loading={guardando}>Guardar</Button>
                    <Button type="button" variant="ghost" onClick={() => setMostrarForm(false)}>Cancelar</Button>
                </div>
                </form>
            </div>
            )}

            {/* Tabs de estado */}
            {!loading && piezas.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {['TODAS', ...ESTADOS].map(e => {
                const count = e === 'TODAS' ? piezas.length : piezas.filter(p => p.estado === e).length
                return (
                    <button key={e} onClick={() => setFiltroEstado(e)} style={{
                    background: filtroEstado === e ? 'var(--color-accent)' : 'transparent',
                    color: filtroEstado === e ? '#0f0f0f' : 'var(--color-text-2)',
                    border: `1px solid ${filtroEstado === e ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    borderRadius: '20px', padding: '5px 14px', fontSize: '13px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                    {e === 'TODAS' ? 'Todas' : labelEstado[e]}
                    <span style={{
                        background: filtroEstado === e ? 'rgba(0,0,0,0.15)' : 'var(--color-bg-3)',
                        borderRadius: '20px', padding: '0px 6px', fontSize: '11px'
                    }}>{count}</span>
                    </button>
                )
                })}
            </div>
            )}

            {/* Lista de piezas */}
            {loading ? (
            <p style={{ color: 'var(--color-text-2)' }}>Cargando piezas...</p>
            ) : piezas.length === 0 ? (
            <div style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '48px', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-2)', marginBottom: '16px' }}>Todavía no cargaste ninguna pieza</p>
                <Button onClick={abrirCrear}>+ Crear primera pieza</Button>
            </div>
            ) : piezasFiltradas.length === 0 ? (
            <div style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '32px', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-2)' }}>No hay piezas en estado <strong>{labelEstado[filtroEstado]}</strong></p>
            </div>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {piezasFiltradas.map(pieza => (
                <div key={pieza.id} style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '16px 20px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

                    {/* Carrusel con X para borrar cada foto */}
                    <div style={{ width: '140px', flexShrink: 0, borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                        <CarruselFotos
                        fotos={pieza.fotos}
                        titulo={pieza.titulo}
                        height={100}
                        onEliminar={(indice) => eliminarFoto(pieza.id, indice)}
                        />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '500', fontSize: '15px' }}>{pieza.titulo}</span>
                        {pieza.destacada && (
                            <span style={{ fontSize: '11px', color: 'var(--color-accent)', border: '1px solid var(--color-accent)', borderRadius: '20px', padding: '1px 7px' }}>Destacada</span>
                        )}
                        <span style={{ fontSize: '11px', color: colorEstado[pieza.estado], border: `1px solid ${colorEstado[pieza.estado]}`, borderRadius: '20px', padding: '1px 7px' }}>
                            {pieza.estado}
                        </span>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--color-text-2)', marginBottom: '10px' }}>
                        <span>${Number(pieza.precio).toLocaleString('es-AR')}</span>
                        {pieza.horasTrabajo && <span>{pieza.horasTrabajo} hs</span>}
                        {pieza.categoria && <span>{pieza.categoria}</span>}
                        </div>

                        {/* Botón agregar foto con contador según el plan */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                        onClick={() => abrirSelectorFoto(pieza.id)}
                        disabled={subiendoFoto === pieza.id || pieza.fotos?.length >= maxFotos}
                        style={{
                            background: 'transparent',
                            border: '1px dashed var(--color-border)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '4px 10px',
                            color: pieza.fotos?.length >= maxFotos ? 'var(--color-text-3)' : 'var(--color-text-2)',
                            fontSize: '12px',
                            cursor: pieza.fotos?.length >= maxFotos ? 'not-allowed' : 'pointer'
                        }}
                        >
                        {subiendoFoto === pieza.id
                            ? 'Subiendo...'
                            : pieza.fotos?.length >= maxFotos
                            ? `Límite alcanzado (${maxFotos}/${maxFotos})`
                            : `+ Agregar foto (${pieza.fotos?.length ?? 0}/${maxFotos})`
                        }
                        </button>
                        {pieza.fotos?.length >= maxFotos && plan && !plan.esPremium && (
                            <Link to="/premium" style={{ fontSize: '11px', color: '#f5b94f' }}>
                            Más fotos en Premium →
                            </Link>
                        )}
                        </div>

                        {/* Video — solo premium. Free ve un CTA */}
                        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {plan?.esPremium ? (
                                pieza.videoUrl ? (
                                    <button onClick={() => eliminarVideo(pieza.id)} style={{
                                        background: 'transparent',
                                        border: '1px solid #f5b94f',
                                        borderRadius: 'var(--radius-sm)',
                                        padding: '4px 10px',
                                        color: '#f5b94f',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                    }}>
                                        ★ Quitar video
                                    </button>
                                ) : (
                                    <button onClick={() => abrirSelectorVideo(pieza.id)}
                                        disabled={subiendoVideo === pieza.id}
                                        style={{
                                            background: 'transparent',
                                            border: '1px dashed #f5b94f',
                                            borderRadius: 'var(--radius-sm)',
                                            padding: '4px 10px',
                                            color: '#f5b94f',
                                            fontSize: '12px',
                                            cursor: subiendoVideo === pieza.id ? 'wait' : 'pointer'
                                        }}>
                                        {subiendoVideo === pieza.id ? 'Subiendo video...' : '+ Agregar video (≤30s)'}
                                    </button>
                                )
                            ) : (
                                <Link to="/premium" style={{
                                    fontSize: '11px', color: 'var(--color-text-3)',
                                    border: '1px dashed var(--color-border)',
                                    borderRadius: 'var(--radius-sm)', padding: '4px 10px'
                                }}>
                                    🔒 Video disponible en Premium
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button
                        onClick={() => abrirEditar(pieza)}
                        style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', color: 'var(--color-text-2)', fontSize: '13px', cursor: 'pointer' }}
                        >
                        Editar
                        </button>
                        <button
                        onClick={() => handleEliminar(pieza.id)}
                        style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', color: 'var(--color-danger)', fontSize: '13px', cursor: 'pointer' }}
                        >
                        Eliminar
                        </button>
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