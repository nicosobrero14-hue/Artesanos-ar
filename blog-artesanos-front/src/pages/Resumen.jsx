import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import BotonCompartir from '../components/BotonCompartir'
import BotonWhatsApp from '../components/BotonWhatsApp'
import { useAuth } from '../context/AuthContext'

/*
 * "Tu resumen en Artesanos" — tarjeta con las estadísticas acumuladas del
 * artesano, pensada para compartir. Funciona en cualquier momento del año.
 *
 * No necesita endpoint nuevo: reusa /artesanos/mi-panel/estadisticas.
 */
export default function Resumen() {
    const { usuario } = useAuth()
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/artesanos/mi-panel/estadisticas')
            .then(res => setStats(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }, [])

    const catalogoUrl = usuario?.slug
        ? `${window.location.origin}/artesano/${usuario.slug}`
        : window.location.origin

    // Texto que se comparte (WhatsApp / share nativo)
    const textoCompartir = stats
        ? `Mi resumen en Artesanos.ar 🎨\n\n` +
          `📦 ${stats.totalPiezas} piezas publicadas\n` +
          `👁 ${stats.visitasPerfil ?? 0} visitas a mi perfil\n` +
          `⏱ ${stats.totalHorasTrabajadas} horas de trabajo\n` +
          `✅ ${stats.piezasVendidas} piezas vendidas\n\n` +
          `Mirá mi catálogo 👇\n${catalogoUrl}`
        : ''

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
            <Navbar />
            <div className="container-page" style={{ maxWidth: '560px', margin: '0 auto', padding: '32px 24px' }}>

                <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '4px' }}>
                    Tu resumen en Artesanos
                </h1>
                <p style={{ color: 'var(--color-text-2)', fontSize: '14px', marginBottom: '24px' }}>
                    Tu recorrido hasta hoy. Compartilo si querés mostrar tu trabajo.
                </p>

                {loading ? (
                    <p style={{ color: 'var(--color-text-2)' }}>Cargando...</p>
                ) : !stats ? (
                    <p style={{ color: 'var(--color-danger)' }}>No se pudo cargar el resumen.</p>
                ) : (
                    <>
                        {/* Tarjeta compartible */}
                        <div style={{
                            background: 'linear-gradient(135deg, #1f1a12, #14110c)',
                            border: '1px solid var(--color-accent)',
                            borderRadius: 'var(--radius)',
                            padding: '28px 24px',
                            marginBottom: '20px'
                        }}>
                            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                <p style={{
                                    fontSize: '11px', letterSpacing: '0.1em',
                                    textTransform: 'uppercase', color: 'var(--color-accent)',
                                    marginBottom: '4px'
                                }}>
                                    Artesanos.ar
                                </p>
                                <p style={{ fontSize: '18px', fontWeight: '600' }}>
                                    {usuario?.nombre}
                                </p>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '16px'
                            }}>
                                <StatGrande icono="📦" valor={stats.totalPiezas} label="Piezas publicadas" />
                                <StatGrande icono="👁" valor={stats.visitasPerfil ?? 0} label="Visitas a tu perfil" />
                                <StatGrande icono="⏱" valor={stats.totalHorasTrabajadas} label="Horas de trabajo" />
                                <StatGrande icono="✅" valor={stats.piezasVendidas} label="Piezas vendidas" />
                            </div>
                        </div>

                        {/* Acciones de compartir */}
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <BotonWhatsApp
                                texto={textoCompartir}
                                label="Compartir por WhatsApp"
                                style={{ flex: 1, minWidth: '180px' }}
                            />
                            <BotonCompartir
                                titulo="Mi resumen en Artesanos.ar"
                                texto={textoCompartir}
                                url={catalogoUrl}
                                style={{ flex: 1, minWidth: '140px', justifyContent: 'center', padding: '10px 14px' }}
                            />
                        </div>

                        <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '16px', textAlign: 'center' }}>
                            Tip: compartilo en tu estado de WhatsApp o historia de Instagram.
                        </p>

                        <div style={{ marginTop: '24px', textAlign: 'center' }}>
                            <Link to="/panel" style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
                                ← Volver al panel
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

function StatGrande({ icono, valor, label }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px 12px',
            textAlign: 'center'
        }}>
            <p style={{ fontSize: '20px', marginBottom: '4px' }}>{icono}</p>
            <p style={{ fontSize: '26px', fontWeight: '700', color: 'var(--color-accent)', lineHeight: 1.1 }}>
                {valor}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--color-text-2)', marginTop: '4px' }}>
                {label}
            </p>
        </div>
    )
}
