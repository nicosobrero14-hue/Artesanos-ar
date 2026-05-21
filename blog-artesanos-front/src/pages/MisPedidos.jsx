import { useEffect, useState } from 'react'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import Input from '../components/Input'

const ESTADOS = ['PENDIENTE', 'EN_PROCESO', 'LISTO', 'ENTREGADO', 'CANCELADO']

const colorEstado = {
    PENDIENTE: 'var(--color-text-3)',
    EN_PROCESO: 'var(--color-accent)',
    LISTO: 'var(--color-success)',
    ENTREGADO: '#7c8cf8',
    CANCELADO: 'var(--color-danger)'
    }

    export default function MisPedidos() {
    const [pedidos, setPedidos] = useState([])
    const [loading, setLoading] = useState(true)
    const [filtro, setFiltro] = useState('')
    const [mostrarForm, setMostrarForm] = useState(false)
    const [form, setForm] = useState({ descripcion: '', precioAcordado: '', senia: '', fechaEntregaEstimada: '', notas: '' })
    const [guardando, setGuardando] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => { cargarPedidos() }, [])

    const cargarPedidos = () => {
        const url = filtro ? `/mis-pedidos?estado=${filtro}` : '/mis-pedidos'
        api.get(url)
        .then(res => setPedidos(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
    }

    useEffect(() => {
        setLoading(true)
        cargarPedidos()
    }, [filtro])

    const handleChange = e => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleCrear = async e => {
        e.preventDefault()
        setError('')
        setGuardando(true)
        try {
        await api.post('/mis-pedidos', {
            ...form,
            precioAcordado: form.precioAcordado ? parseFloat(form.precioAcordado) : null,
            senia: form.senia ? parseFloat(form.senia) : 0,
            fechaEntregaEstimada: form.fechaEntregaEstimada || null
        })
        setMostrarForm(false)
        setForm({ descripcion: '', precioAcordado: '', senia: '', fechaEntregaEstimada: '', notas: '' })
        cargarPedidos()
        } catch (err) {
        setError('Error al guardar el pedido')
        } finally {
        setGuardando(false)
        }
    }

    const cambiarEstado = async (id, nuevoEstado) => {
        try {
        await api.put(`/mis-pedidos/${id}/estado?nuevoEstado=${nuevoEstado}`)
        cargarPedidos()
        } catch (err) {
        alert('Error al cambiar el estado')
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <Navbar />
        <div className="container-page" style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '600' }}>Pedidos</h1>
            <Button onClick={() => setMostrarForm(!mostrarForm)}>+ Nuevo pedido</Button>
            </div>

            {/* Filtro por estado */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <button
                onClick={() => setFiltro('')}
                style={{
                background: filtro === '' ? 'var(--color-accent)' : 'transparent',
                color: filtro === '' ? '#0f0f0f' : 'var(--color-text-2)',
                border: `1px solid ${filtro === '' ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: '20px', padding: '5px 14px', fontSize: '13px', cursor: 'pointer'
                }}
            >
                Todos
            </button>
            {ESTADOS.map(e => (
                <button
                key={e}
                onClick={() => setFiltro(e)}
                style={{
                    background: filtro === e ? colorEstado[e] : 'transparent',
                    color: filtro === e ? '#0f0f0f' : 'var(--color-text-2)',
                    border: `1px solid ${filtro === e ? colorEstado[e] : 'var(--color-border)'}`,
                    borderRadius: '20px', padding: '5px 14px', fontSize: '13px', cursor: 'pointer'
                }}
                >
                {e.replace('_', ' ')}
                </button>
            ))}
            </div>

            {/* Formulario nuevo pedido */}
            {mostrarForm && (
            <div style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '24px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '20px' }}>Nuevo pedido</h2>
                <form onSubmit={handleCrear}>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--color-text-2)', display: 'block', marginBottom: '6px' }}>Descripción *</label>
                    <textarea
                    name="descripcion" value={form.descripcion} onChange={handleChange} required rows={2}
                    placeholder="Ej: Facón gaucho, mango en quebracho, con vaina de cuero"
                    style={{ width: '100%', background: 'var(--color-bg-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', color: 'var(--color-text)', resize: 'vertical', outline: 'none' }}
                    />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    <Input label="Precio acordado ($)" name="precioAcordado" type="number" value={form.precioAcordado} onChange={handleChange} />
                    <Input label="Seña ($)" name="senia" type="number" value={form.senia} onChange={handleChange} />
                    <Input label="Fecha entrega estimada" name="fechaEntregaEstimada" type="date" value={form.fechaEntregaEstimada} onChange={handleChange} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--color-text-2)', display: 'block', marginBottom: '6px' }}>Notas internas</label>
                    <textarea
                    name="notas" value={form.notas} onChange={handleChange} rows={2}
                    placeholder="Notas privadas sobre este pedido..."
                    style={{ width: '100%', background: 'var(--color-bg-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', color: 'var(--color-text)', resize: 'vertical', outline: 'none' }}
                    />
                </div>
                {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button type="submit" loading={guardando}>Guardar</Button>
                    <Button type="button" variant="ghost" onClick={() => setMostrarForm(false)}>Cancelar</Button>
                </div>
                </form>
            </div>
            )}

            {/* Lista de pedidos */}
            {loading ? (
            <p style={{ color: 'var(--color-text-2)' }}>Cargando pedidos...</p>
            ) : pedidos.length === 0 ? (
            <div style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '48px', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-2)' }}>No hay pedidos en esta categoría</p>
            </div>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pedidos.map(pedido => (
                <div key={pedido.id} style={{
                    background: 'var(--color-bg-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    padding: '18px 20px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: '500', marginBottom: '6px' }}>{pedido.descripcion}</p>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--color-text-2)', flexWrap: 'wrap' }}>
                        {pedido.precioAcordado && (
                            <span>Precio: <strong style={{ color: 'var(--color-text)' }}>${Number(pedido.precioAcordado).toLocaleString('es-AR')}</strong></span>
                        )}
                        {pedido.senia > 0 && (
                            <span>Seña: <strong style={{ color: 'var(--color-text)' }}>${Number(pedido.senia).toLocaleString('es-AR')}</strong></span>
                        )}
                        {pedido.fechaEntregaEstimada && (
                            <span>Entrega: <strong style={{ color: 'var(--color-text)' }}>{pedido.fechaEntregaEstimada}</strong></span>
                        )}
                        <span>Encargado: {pedido.fechaEncargo}</span>
                        </div>
                        {pedido.notas && (
                        <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '6px' }}>
                            Nota: {pedido.notas}
                        </p>
                        )}
                    </div>

                    {/* Estado + cambiar estado */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <span style={{
                        fontSize: '12px',
                        color: colorEstado[pedido.estado],
                        border: `1px solid ${colorEstado[pedido.estado]}`,
                        borderRadius: '20px',
                        padding: '3px 10px',
                        whiteSpace: 'nowrap'
                        }}>
                        {pedido.estado.replace('_', ' ')}
                        </span>
                        <select
                        value={pedido.estado}
                        onChange={e => cambiarEstado(pedido.id, e.target.value)}
                        style={{
                            background: 'var(--color-bg-3)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '5px 8px',
                            color: 'var(--color-text)',
                            fontSize: '12px',
                            cursor: 'pointer',
                            outline: 'none'
                        }}
                        >
                        {ESTADOS.map(e => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}
                        </select>
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