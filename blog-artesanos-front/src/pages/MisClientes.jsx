import { useEffect, useState } from 'react'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import Input from '../components/Input'

export default function MisClientes() {
    const [clientes, setClientes] = useState([])
    const [loading, setLoading] = useState(true)
    const [mostrarForm, setMostrarForm] = useState(false)
    const [editando, setEditando] = useState(null)
    const [form, setForm] = useState({ nombre: '', email: '', telefono: '', notas: '' })
    const [guardando, setGuardando] = useState(false)
    const [busqueda, setBusqueda] = useState('')

    useEffect(() => { cargarClientes() }, [])

    const cargarClientes = () => {
        api.get('/mis-clientes')
        .then(res => setClientes(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
    }

    const handleChange = e => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const abrirCrear = () => {
        setEditando(null)
        setForm({ nombre: '', email: '', telefono: '', notas: '' })
        setMostrarForm(true)
    }

    const abrirEditar = (cliente) => {
        setEditando(cliente)
        setForm({
        nombre: cliente.nombre,
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        notas: cliente.notas || ''
        })
        setMostrarForm(true)
    }

    const handleGuardar = async e => {
        e.preventDefault()
        setGuardando(true)
        try {
        if (editando) {
            await api.put(`/mis-clientes/${editando.id}`, form)
        } else {
            await api.post('/mis-clientes', form)
        }
        setMostrarForm(false)
        cargarClientes()
        } catch {
        alert('Error al guardar el cliente')
        } finally {
        setGuardando(false)
        }
    }

    const handleEliminar = async (id) => {
        if (!confirm('Eliminar este cliente?')) return
        try {
        await api.delete(`/mis-clientes/${id}`)
        cargarClientes()
        } catch {
        alert('Error al eliminar')
        }
    }

    // Filtro local por nombre, email o telefono
    const clientesFiltrados = clientes.filter(c => {
        const q = busqueda.toLowerCase()
        return (
        c.nombre?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.telefono?.includes(q)
        )
    })

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <Navbar />
        <div className="container-page" style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
                <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '4px' }}>Clientes</h1>
                <p style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
                {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} registrado{clientes.length !== 1 ? 's' : ''}
                </p>
            </div>
            <Button onClick={abrirCrear}>+ Nuevo cliente</Button>
            </div>

            {/* Buscador */}
            {clientes.length > 0 && (
            <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, email o telefono..."
                style={{
                width: '100%', marginBottom: '16px',
                background: 'var(--color-bg-3)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px', color: 'var(--color-text)',
                fontSize: '14px', outline: 'none'
                }}
            />
            )}

            {/* Formulario */}
            {mostrarForm && (
            <div style={{
                background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)', padding: '24px', marginBottom: '20px'
            }}>
                <h2 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '20px' }}>
                {editando ? 'Editar cliente' : 'Nuevo cliente'}
                </h2>
                <form onSubmit={handleGuardar}>
                <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <Input label="Nombre *" name="nombre" value={form.nombre}
                    onChange={handleChange} required />
                    <Input label="Telefono" name="telefono" placeholder="Ej: 3492xxxxxx"
                    value={form.telefono} onChange={handleChange} />
                    <Input label="Email" name="email" type="email"
                    value={form.email} onChange={handleChange} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--color-text-2)', display: 'block', marginBottom: '6px' }}>
                    Notas internas
                    </label>
                    <textarea
                    name="notas" value={form.notas} onChange={handleChange} rows={2}
                    placeholder="Preferencias, historial, observaciones..."
                    style={{
                        width: '100%', background: 'var(--color-bg-3)',
                        border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                        padding: '10px 12px', color: 'var(--color-text)',
                        resize: 'vertical', outline: 'none'
                    }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button type="submit" loading={guardando}>Guardar</Button>
                    <Button type="button" variant="ghost" onClick={() => setMostrarForm(false)}>Cancelar</Button>
                </div>
                </form>
            </div>
            )}

            {/* Lista */}
            {loading ? (
            <p style={{ color: 'var(--color-text-2)' }}>Cargando clientes...</p>
            ) : clientesFiltrados.length === 0 ? (
            <div style={{
                background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)', padding: '48px', textAlign: 'center'
            }}>
                <p style={{ color: 'var(--color-text-2)', marginBottom: '16px' }}>
                {busqueda ? 'No hay resultados para esa busqueda' : 'Todavia no registraste ningun cliente'}
                </p>
                {!busqueda && <Button onClick={abrirCrear}>+ Agregar primer cliente</Button>}
            </div>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {clientesFiltrados.map(cliente => (
                <div key={cliente.id} style={{
                    background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)', padding: '16px 20px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px'
                }}>
                    <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '500', fontSize: '15px', marginBottom: '4px' }}>
                        {cliente.nombre}
                    </p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--color-text-2)', flexWrap: 'wrap' }}>
                        {cliente.telefono && (
                        <a href={`https://wa.me/${cliente.telefono.replace(/\D/g, '')}`}
                            target="_blank" rel="noreferrer"
                            style={{ color: 'var(--color-success)' }}>
                            {cliente.telefono}
                        </a>
                        )}
                        {cliente.email && <span>{cliente.email}</span>}
                    </div>
                    {cliente.notas && (
                        <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '6px' }}>
                        {cliente.notas}
                        </p>
                    )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button onClick={() => abrirEditar(cliente)}
                        style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', color: 'var(--color-text-2)', fontSize: '13px', cursor: 'pointer' }}>
                        Editar
                    </button>
                    <button onClick={() => handleEliminar(cliente.id)}
                        style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', color: 'var(--color-danger)', fontSize: '13px', cursor: 'pointer' }}>
                        Eliminar
                    </button>
                    </div>
                </div>
                ))}
            </div>
            )}
        </div>
        </div>
    )
}