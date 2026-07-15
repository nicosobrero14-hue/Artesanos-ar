import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import Input from '../components/Input'
import { useConfirm } from '../context/ConfirmContext'
import { useToast } from '../context/ToastContext'

export default function MiPerfil() {
    const { usuario, login, logout } = useAuth()
    const confirm = useConfirm()
    const toast = useToast()
    const navigate = useNavigate()
    const [form, setForm] = useState({
        nombre: '', bio: '', ubicacion: '', rubros: '', instagram: '', whatsapp: ''
    })
    const [avatarUrl, setAvatarUrl] = useState(null)
    const [guardando, setGuardando] = useState(false)
    const [guardado, setGuardado] = useState(false)
    const [subiendoAvatar, setSubiendoAvatar] = useState(false)
    const [error, setError] = useState('')
    const fileInputRef = useRef(null)  // ← estaba faltando el import de useRef

    useEffect(() => {
        if (!usuario?.slug) return
        api.get(`/artesanos/${usuario.slug}`)
        .then(res => {
            const a = res.data
            setForm({
            nombre: a.nombre || '', bio: a.bio || '',
            ubicacion: a.ubicacion || '', rubros: a.rubros || '',
            instagram: a.instagram || '', whatsapp: a.whatsapp || ''
            })
            setAvatarUrl(a.avatarUrl || null)
        })
        .catch(err => console.error(err))
    }, [usuario])

    const handleChange = e => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleGuardar = async e => {
        e.preventDefault()
        setError('')
        setGuardado(false)
        setGuardando(true)
        try {
        // El backend tiene @RequestMapping("/api/artesanos") + @PutMapping("/mi-perfil")
        // así que la ruta correcta es /artesanos/mi-perfil (axios baseURL ya agrega /api)
        await api.put('/artesanos/mi-perfil', form)
        login({ ...usuario, nombre: form.nombre })
        setGuardado(true)
        } catch (err) {
        const msg = err.response?.data?.message || 'Error al guardar los cambios'
        setError(msg)
        } finally {
        setGuardando(false)
        }
    }

    const seleccionarAvatar = () => fileInputRef.current.click()

    const handleAvatarSeleccionado = async e => {
        const archivo = e.target.files[0]
        if (!archivo) return
        setSubiendoAvatar(true)
        const formData = new FormData()
        formData.append('foto', archivo)
        try {
        const { data } = await api.post('/artesanos/mi-perfil/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        setAvatarUrl(data.avatarUrl)
        } catch {
        toast('Error al subir el avatar', 'error')
        } finally {
        setSubiendoAvatar(false)
        e.target.value = ''
        }
    }

    const eliminarAvatar = async () => {
        if (!await confirm({ mensaje: '¿Eliminar tu foto de perfil?', confirmLabel: 'Eliminar', danger: true })) return
        try {
        await api.delete('/artesanos/mi-perfil/avatar')
        setAvatarUrl(null)
        } catch {
        toast('Error al eliminar el avatar', 'error')
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <Navbar />

        {/* Input oculto para seleccionar archivo */}
        <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleAvatarSeleccionado}
            style={{ display: 'none' }}
        />

        <div className="container-page" style={{ maxWidth: '700px', margin: '0 auto', padding: '32px 24px' }}>

            <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '8px' }}>Mi perfil</h1>
            <p style={{ fontSize: '13px', color: 'var(--color-text-2)', marginBottom: '32px' }}>
            Esta información se muestra en tu catálogo público en{' '}
            <a href={`/artesano/${usuario?.slug}`} target="_blank">
                /artesano/{usuario?.slug}
            </a>
            </p>

            {/* Sección avatar */}
            <div style={{
            background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)', padding: '24px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '20px'
            }}>
            <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'var(--color-bg-3)', border: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', fontWeight: '600', color: 'var(--color-accent)',
                overflow: 'hidden', flexShrink: 0
            }}>
                {avatarUrl
                ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : usuario?.nombre?.charAt(0).toUpperCase()
                }
            </div>

            <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>Foto de perfil</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-2)', marginBottom: '12px' }}>
                Una foto cuadrada se ve mejor. Tamaño recomendado: 400x400px.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                <button
                    onClick={seleccionarAvatar}
                    disabled={subiendoAvatar}
                    style={{
                    background: 'transparent', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)', padding: '6px 14px',
                    color: 'var(--color-text)', fontSize: '13px',
                    cursor: subiendoAvatar ? 'not-allowed' : 'pointer'
                    }}
                >
                    {subiendoAvatar ? 'Subiendo...' : avatarUrl ? 'Cambiar foto' : 'Subir foto'}
                </button>
                {avatarUrl && (
                    <button
                    onClick={eliminarAvatar}
                    style={{
                        background: 'transparent', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)', padding: '6px 14px',
                        color: 'var(--color-danger)', fontSize: '13px', cursor: 'pointer'
                    }}
                    >
                    Eliminar
                    </button>
                )}
                </div>
            </div>
            </div>

            {/* Formulario de perfil */}
            <form onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            <Input label="Nombre o nombre del taller" name="nombre"
                value={form.nombre} onChange={handleChange} required />

            <div>
                <label style={{ fontSize: '13px', color: 'var(--color-text-2)', display: 'block', marginBottom: '6px' }}>
                Biografia
                </label>
                <textarea
                name="bio" value={form.bio} onChange={handleChange} rows={4}
                placeholder="Conta brevemente tu historia, tu proceso, que materiales usas..."
                style={{
                    width: '100%', background: 'var(--color-bg-3)',
                    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px', color: 'var(--color-text)',
                    resize: 'vertical', outline: 'none', lineHeight: '1.6'
                }}
                />
            </div>

            <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Input label="Ubicacion" name="ubicacion" placeholder="Ej: Rafaela, Santa Fe"
                value={form.ubicacion} onChange={handleChange} />
                <Input label="Rubros" name="rubros" placeholder="Ej: Cuchilleria, Cuero"
                value={form.rubros} onChange={handleChange} />
            </div>

            <div style={{
                background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)', padding: '20px'
            }}>
                <p style={{ fontSize: '13px', fontWeight: '500', marginBottom: '16px' }}>Redes y contacto</p>
                <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Input label="Instagram (usuario)" name="instagram" placeholder="@tu_usuario"
                    value={form.instagram} onChange={handleChange} />
                <Input label="WhatsApp (con codigo de pais)" name="whatsapp" placeholder="5493404xxxxxx"
                    value={form.whatsapp} onChange={handleChange} />
                </div>
            </div>

            {error && (
                <p style={{
                color: 'var(--color-danger)', fontSize: '13px',
                background: '#e05c5c18', padding: '10px 12px',
                borderRadius: 'var(--radius-sm)', border: '1px solid #e05c5c33'
                }}>
                {error}
                </p>
            )}

            {guardado && (
                <p style={{
                color: 'var(--color-success)', fontSize: '13px',
                background: '#4caf8218', padding: '10px 12px',
                borderRadius: 'var(--radius-sm)', border: '1px solid #4caf8233'
                }}>
                Perfil actualizado correctamente
                </p>
            )}

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Button type="submit" loading={guardando}>Guardar cambios</Button>
                <a href={`/artesano/${usuario?.slug}`} target="_blank"
                style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
                Ver catalogo publico
                </a>
            </div>
            </form>

            {/* Zona peligrosa: eliminar cuenta */}
            {usuario?.rol !== 'ADMIN' && (
            <div style={{
                marginTop: '60px',
                background: 'var(--color-bg-2)',
                border: '1px solid #e05c5c33',
                borderRadius: 'var(--radius)',
                padding: '24px'
            }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--color-danger)', marginBottom: '6px' }}>
                Zona peligrosa
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-2)', marginBottom: '16px', lineHeight: '1.6' }}>
                Eliminar tu cuenta borra para siempre tus piezas, clientes, pedidos y mensajes.
                Las reseñas que dejaste a otros artesanos se conservan. Esta acción <strong>no se puede deshacer</strong>.
                </p>
                <button
                onClick={async () => {
                    const confirmacion = prompt(`Para confirmar escribí: "ELIMINAR ${usuario.nombre}"`)
                    if (confirmacion !== `ELIMINAR ${usuario.nombre}`) {
                    if (confirmacion !== null) toast('Texto incorrecto, no se eliminó nada.', 'error')
                    return
                    }
                    try {
                    await api.delete('/artesanos/mi-cuenta')
                    toast('Cuenta eliminada. Hasta pronto.', 'success')
                    logout()
                    navigate('/')
                    } catch {
                    toast('Error al eliminar la cuenta', 'error')
                    }
                }}
                style={{
                    background: 'transparent',
                    border: '1px solid var(--color-danger)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 16px',
                    color: 'var(--color-danger)',
                    fontSize: '13px',
                    cursor: 'pointer'
                }}
                >
                Eliminar mi cuenta permanentemente
                </button>
            </div>
            )}
        </div>
        </div>
    )
}