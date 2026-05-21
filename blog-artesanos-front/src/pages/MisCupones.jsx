import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'

/*
 * Panel de cupones — premium-only.
 * Free ve un CTA con explicación.
 */
export default function MisCupones() {
    const [cupones, setCupones] = useState([])
    const [misPiezas, setMisPiezas] = useState([])
    const [plan, setPlan] = useState(null)
    const [loading, setLoading] = useState(true)
    const [creando, setCreando] = useState(false)
    const [form, setForm] = useState({
        codigo: '', porcentaje: 10, descripcion: '',
        fechaVencimiento: '', usosMax: '',
        piezasIds: [] // vacío = aplica a todas (cupón global)
    })

    useEffect(() => {
        cargar()
        api.get('/artesanos/mi-panel/plan').then(res => setPlan(res.data)).catch(() => {})
        api.get('/mis-piezas').then(res => setMisPiezas(res.data)).catch(() => {})
    }, [])

    const cargar = () => {
        setLoading(true)
        api.get('/mis-cupones')
            .then(res => setCupones(res.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }

    const togglePieza = (id) => {
        setForm(f => ({
            ...f,
            piezasIds: f.piezasIds.includes(id)
                ? f.piezasIds.filter(p => p !== id)
                : [...f.piezasIds, id]
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await api.post('/mis-cupones', {
                ...form,
                porcentaje: parseInt(form.porcentaje),
                usosMax: form.usosMax ? parseInt(form.usosMax) : null
            })
            setCreando(false)
            setForm({ codigo: '', porcentaje: 10, descripcion: '', fechaVencimiento: '', usosMax: '', piezasIds: [] })
            cargar()
        } catch (err) {
            alert(err.response?.data?.message || 'Error al crear cupón')
        }
    }

    const handleEliminar = async (id) => {
        if (!confirm('¿Eliminar este cupón?')) return
        try {
            await api.delete(`/mis-cupones/${id}`)
            cargar()
        } catch {
            alert('Error al eliminar')
        }
    }

    const toggleActivo = async (c) => {
        try {
            await api.put(`/mis-cupones/${c.id}`, { activo: !c.activo })
            cargar()
        } catch {}
    }

    const esPremium = plan?.esPremium

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
            <Navbar />

            <div className="container-page" style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '4px' }}>Cupones de descuento</h1>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
                            Generá códigos de descuento. El cliente los menciona al consultarte.
                        </p>
                    </div>
                    {esPremium && !creando && (
                        <button onClick={() => setCreando(true)} style={{
                            background: 'var(--color-accent)', color: '#0f0f0f',
                            border: 'none', borderRadius: 'var(--radius-sm)',
                            padding: '8px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer'
                        }}>+ Nuevo cupón</button>
                    )}
                </div>

                {!esPremium && (
                    <div style={{
                        background: 'var(--color-bg-2)', border: '1px solid #f5b94f55',
                        borderRadius: 'var(--radius)', padding: '32px', textAlign: 'center'
                    }}>
                        <p style={{ fontSize: '15px', marginBottom: '12px' }}>
                            🎟 Los cupones de descuento son una feature <strong style={{ color: '#f5b94f' }}>Premium</strong>
                        </p>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-2)', marginBottom: '20px' }}>
                            Atraé más clientes con descuentos por temporada, ferias o lanzamientos.
                        </p>
                        <Link to="/premium" style={{
                            display: 'inline-block', background: '#f5b94f', color: '#0f0f0f',
                            padding: '10px 22px', borderRadius: 'var(--radius-sm)',
                            fontSize: '14px', fontWeight: '500'
                        }}>★ Conocer Premium</Link>
                    </div>
                )}

                {esPremium && creando && (
                    <form onSubmit={handleSubmit} style={{
                        background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)', padding: '20px', marginBottom: '20px',
                        display: 'flex', flexDirection: 'column', gap: '12px'
                    }}>
                        <h2 style={{ fontSize: '15px', fontWeight: '500' }}>Nuevo cupón</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                            <input required placeholder="CODIGO (ej: VERANO20)" maxLength={30}
                                value={form.codigo}
                                onChange={e => setForm(f => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                                style={inputStyle} />
                            <input required type="number" placeholder="% off" min="1" max="100"
                                value={form.porcentaje}
                                onChange={e => setForm(f => ({ ...f, porcentaje: e.target.value }))}
                                style={inputStyle} />
                        </div>
                        <input placeholder="Descripción opcional (qué incluye, condiciones)"
                            value={form.descripcion}
                            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                            style={inputStyle} maxLength={200} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={labelStyle}>Vence el</label>
                                <input required type="date" value={form.fechaVencimiento}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={e => setForm(f => ({ ...f, fechaVencimiento: e.target.value }))}
                                    style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Usos máximos (vacío = ilimitado)</label>
                                <input type="number" min="1" placeholder="∞"
                                    value={form.usosMax}
                                    onChange={e => setForm(f => ({ ...f, usosMax: e.target.value }))}
                                    style={inputStyle} />
                            </div>
                        </div>

                        {/* Selector de piezas: vacío = aplica a todas */}
                        <div>
                            <label style={labelStyle}>
                                ¿A qué piezas aplica este cupón?
                            </label>
                            <p style={{ fontSize: '11px', color: 'var(--color-text-3)', marginBottom: '10px' }}>
                                {form.piezasIds.length === 0
                                    ? '⚡ Sin selección = cupón GLOBAL (aplica a todas tus piezas)'
                                    : `Aplica solo a las ${form.piezasIds.length} piezas seleccionadas`}
                            </p>
                            {misPiezas.length === 0 ? (
                                <p style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>
                                    Todavía no tenés piezas. Creá algunas primero.
                                </p>
                            ) : (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                                    gap: '8px',
                                    maxHeight: '220px',
                                    overflowY: 'auto',
                                    padding: '8px',
                                    background: 'var(--color-bg-3)',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--color-border)'
                                }}>
                                    {misPiezas.map(p => {
                                        const seleccionada = form.piezasIds.includes(p.id)
                                        return (
                                            <button type="button" key={p.id}
                                                onClick={() => togglePieza(p.id)}
                                                style={{
                                                    background: seleccionada ? '#f5b94f22' : 'var(--color-bg-2)',
                                                    border: `1px solid ${seleccionada ? '#f5b94f' : 'var(--color-border)'}`,
                                                    borderRadius: 'var(--radius-sm)',
                                                    padding: '8px',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    display: 'flex', alignItems: 'center', gap: '8px'
                                                }}>
                                                <span style={{
                                                    width: '16px', height: '16px',
                                                    borderRadius: '4px',
                                                    background: seleccionada ? '#f5b94f' : 'transparent',
                                                    border: `1px solid ${seleccionada ? '#f5b94f' : 'var(--color-border)'}`,
                                                    flexShrink: 0,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '11px', color: '#0f0f0f', fontWeight: '700'
                                                }}>
                                                    {seleccionada && '✓'}
                                                </span>
                                                <span style={{
                                                    fontSize: '12px', color: 'var(--color-text)',
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                }}>
                                                    {p.titulo}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setCreando(false)}
                                style={btnGhost}>Cancelar</button>
                            <button type="submit" style={btnPrimario}>Crear cupón</button>
                        </div>
                    </form>
                )}

                {esPremium && (
                    loading ? (
                        <p style={{ color: 'var(--color-text-2)' }}>Cargando...</p>
                    ) : cupones.length === 0 ? (
                        !creando && (
                            <div style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '32px', textAlign: 'center' }}>
                                <p style={{ color: 'var(--color-text-2)' }}>Todavía no creaste ningún cupón.</p>
                            </div>
                        )
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {cupones.map(c => (
                                <div key={c.id} style={{
                                    background: 'var(--color-bg-2)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius)', padding: '16px 20px',
                                    display: 'flex', alignItems: 'center', gap: '16px',
                                    opacity: c.activo ? 1 : 0.5
                                }}>
                                    <div style={{
                                        width: '60px', textAlign: 'center', flexShrink: 0,
                                        background: 'var(--color-bg-3)',
                                        border: '1px dashed #f5b94f',
                                        borderRadius: 'var(--radius-sm)',
                                        padding: '10px 6px'
                                    }}>
                                        <p style={{ fontSize: '20px', fontWeight: '700', color: '#f5b94f', lineHeight: 1 }}>
                                            {c.porcentaje}%
                                        </p>
                                        <p style={{ fontSize: '10px', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>
                                            off
                                        </p>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: '15px', fontWeight: '600', fontFamily: 'monospace', marginBottom: '2px' }}>
                                            {c.codigo}
                                        </p>
                                        {c.descripcion && (
                                            <p style={{ fontSize: '12px', color: 'var(--color-text-2)', marginBottom: '4px' }}>
                                                {c.descripcion}
                                            </p>
                                        )}
                                        <p style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>
                                            Vence el {new Date(c.fechaVencimiento).toLocaleDateString('es-AR')}
                                            {c.usosMax && ` · ${c.usosCantidad}/${c.usosMax} usos`}
                                            {!c.usosMax && ` · ${c.usosCantidad} usos`}
                                        </p>
                                        <p style={{ fontSize: '11px', color: c.piezasIds?.length > 0 ? '#f5b94f' : 'var(--color-text-3)', marginTop: '2px', fontWeight: '500' }}>
                                            {c.piezasIds?.length > 0
                                                ? `🎯 Aplica a ${c.piezasIds.length} ${c.piezasIds.length === 1 ? 'pieza' : 'piezas'} específica${c.piezasIds.length === 1 ? '' : 's'}`
                                                : '🌐 Cupón global (todas tus piezas)'}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button onClick={() => toggleActivo(c)}
                                            style={{ ...btnGhost, color: c.activo ? 'var(--color-text-2)' : 'var(--color-success)' }}>
                                            {c.activo ? 'Desactivar' : 'Activar'}
                                        </button>
                                        <button onClick={() => handleEliminar(c.id)}
                                            style={{ ...btnGhost, color: 'var(--color-danger)' }}>
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    )
}

const inputStyle = {
    background: 'var(--color-bg-3)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)', padding: '10px 12px',
    color: 'var(--color-text)', fontSize: '14px', outline: 'none',
    width: '100%', boxSizing: 'border-box'
}
const labelStyle = { fontSize: '12px', color: 'var(--color-text-2)', display: 'block', marginBottom: '4px' }
const btnPrimario = {
    background: 'var(--color-accent)', color: '#0f0f0f', border: 'none',
    borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer'
}
const btnGhost = {
    background: 'transparent', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)', padding: '6px 12px', color: 'var(--color-text-2)',
    fontSize: '12px', cursor: 'pointer'
}
