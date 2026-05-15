import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

/*
 * Botón "guardar para después". Marcador (bookmark) dorado cuando está activo.
 * Es DIFERENTE del like (corazón rojo, público): el favorito es privado.
 *
 * Sin auth → click redirige a login.
 */
export default function BotonFavorito({ piezaId, size = 'md' }) {
    const { usuario } = useAuth()
    const [esFavorito, setEsFavorito] = useState(false)
    const [cargando, setCargando] = useState(false)

    useEffect(() => {
        if (!usuario) return
        api.get(`/piezas/${piezaId}/favorito`)
            .then(res => setEsFavorito(res.data.esFavorito))
            .catch(() => {})
    }, [piezaId, usuario])

    const handleClick = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        if (!usuario) {
            window.location.href = `/login?next=${window.location.pathname}`
            return
        }
        if (cargando) return

        setCargando(true)
        try {
            const { data } = await api.post(`/piezas/${piezaId}/favorito`)
            setEsFavorito(data.esFavorito)
        } catch (err) {
            console.error(err)
        } finally {
            setCargando(false)
        }
    }

    const sizes = {
        sm: { fontSize: '12px', padding: '4px 10px', iconSize: '14px' },
        md: { fontSize: '13px', padding: '6px 12px', iconSize: '16px' }
    }
    const s = sizes[size]

    return (
        <button onClick={handleClick} disabled={cargando}
            title={esFavorito ? 'Sacar de favoritos' : 'Guardar para después'}
            style={{
                background: esFavorito ? '#f5b94f22' : 'transparent',
                border: `1px solid ${esFavorito ? '#f5b94f' : 'var(--color-border)'}`,
                borderRadius: '20px',
                padding: s.padding,
                color: esFavorito ? '#f5b94f' : 'var(--color-text-2)',
                fontSize: s.fontSize,
                cursor: cargando ? 'wait' : 'pointer',
                display: 'inline-flex', alignItems: 'center',
                transition: 'all 0.2s',
                lineHeight: 1
            }}>
            <span style={{ fontSize: s.iconSize }}>
                {esFavorito ? '🔖' : '🏷'}
            </span>
        </button>
    )
}
