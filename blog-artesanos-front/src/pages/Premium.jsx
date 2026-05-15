import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

/*
 * Página de upgrade a Premium.
 * Por ahora el flujo de pago es manual:
 *  1. El artesano transfiere el monto al alias / CBU mostrado
 *  2. Avisa por email/WhatsApp con el comprobante
 *  3. El admin corre POST /api/artesanos/admin/upgrade { email, meses } a mano
 *  4. La cuenta queda activada
 *
 * Más adelante esto se reemplaza con Mercado Pago Subscriptions.
 */
export default function Premium() {
    const { usuario } = useAuth()
    const [plan, setPlan] = useState(null)

    useEffect(() => {
        if (usuario) {
            api.get('/artesanos/mi-panel/plan')
                .then(res => setPlan(res.data))
                .catch(() => {})
        }
    }, [usuario])

    const yaEsPremium = plan?.esPremium

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>

            {/* Navbar */}
            <nav style={{
                background: 'var(--color-bg-2)', borderBottom: '1px solid var(--color-border)',
                padding: '0 24px', height: '48px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100
            }}>
                <Link to="/" style={{ fontSize: '14px', color: 'var(--color-text-2)' }}>← Inicio</Link>
                <div style={{ display: 'flex', gap: '16px' }}>
                    {usuario ? (
                        <Link to="/panel" style={{ fontSize: '13px', color: 'var(--color-accent)' }}>Mi panel</Link>
                    ) : (
                        <Link to="/login" style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>Ingresar</Link>
                    )}
                </div>
            </nav>

            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>

                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '12px' }}>
                        Pasate a <span style={{ color: '#f5b94f' }}>Premium ★</span>
                    </h1>
                    <p style={{ fontSize: '16px', color: 'var(--color-text-2)', maxWidth: '560px', margin: '0 auto', lineHeight: '1.6' }}>
                        Mostrá tu trabajo sin límites. Más fotos, piezas destacadas y posición prioritaria en el listado.
                    </p>

                    {yaEsPremium && (
                        <div style={{
                            marginTop: '24px', display: 'inline-block',
                            background: '#4caf8218', border: '1px solid var(--color-success)',
                            borderRadius: 'var(--radius-sm)', padding: '12px 20px',
                            color: 'var(--color-success)', fontSize: '14px'
                        }}>
                            ✓ Ya tenés Premium activo
                            {plan?.fechaExpiracionPlan && ` hasta el ${new Date(plan.fechaExpiracionPlan).toLocaleDateString('es-AR')}`}
                        </div>
                    )}
                </div>

                {/* Comparativa */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '48px' }}>

                    {/* Plan gratis */}
                    <div style={{
                        background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)', padding: '28px'
                    }}>
                        <p style={{ fontSize: '12px', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                            Plan Gratuito
                        </p>
                        <p style={{ fontSize: '28px', fontWeight: '600', marginBottom: '20px' }}>$0</p>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <Item ok>Hasta 3 piezas</Item>
                            <Item ok>3 fotos por pieza</Item>
                            <Item ok>Catálogo público</Item>
                            <Item ok>Mensajes y comentarios</Item>
                            <Item>Sin piezas destacadas</Item>
                            <Item>Posición estándar en el listado</Item>
                        </ul>
                    </div>

                    {/* Plan premium */}
                    <div style={{
                        background: 'linear-gradient(135deg, #f5b94f15, #f59f3315)',
                        border: '2px solid #f5b94f',
                        borderRadius: 'var(--radius)', padding: '28px', position: 'relative'
                    }}>
                        <span style={{
                            position: 'absolute', top: '-12px', right: '20px',
                            background: '#f5b94f', color: '#0f0f0f',
                            fontSize: '11px', fontWeight: '700',
                            padding: '4px 12px', borderRadius: '20px'
                        }}>RECOMENDADO</span>

                        <p style={{ fontSize: '12px', color: '#f5b94f', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: '600' }}>
                            ★ Premium
                        </p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '20px' }}>
                            <p style={{ fontSize: '28px', fontWeight: '600' }}>$5.000</p>
                            <span style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>/ mes</span>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <Item ok highlight>Piezas ilimitadas</Item>
                            <Item ok highlight>15 fotos por pieza</Item>
                            <Item ok highlight>Piezas destacadas con badge</Item>
                            <Item ok highlight>Aparecés primero en el listado</Item>
                            <Item ok>Catálogo público</Item>
                            <Item ok>Mensajes y comentarios</Item>
                        </ul>
                    </div>
                </div>

                {/* Cómo pagar */}
                {!yaEsPremium && (
                    <div style={{
                        background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)', padding: '32px'
                    }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                            Cómo activar tu Premium
                        </h2>
                        <p style={{ fontSize: '14px', color: 'var(--color-text-2)', marginBottom: '24px' }}>
                            Por ahora la activación es manual. En 24hs hábiles te activamos la cuenta.
                        </p>

                        <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', lineHeight: '1.6' }}>
                            <li>
                                <strong>Transferí $5.000</strong> a:
                                <div style={{
                                    background: 'var(--color-bg-3)', border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-sm)', padding: '12px 16px',
                                    marginTop: '8px', fontFamily: 'monospace', fontSize: '13px'
                                }}>
                                    <p>Alias: <strong style={{ color: 'var(--color-accent)' }}>n.sobrero.mp</strong></p>
                                    <p>CBU: 0000003100080612548910</p>
                                    <p>Titular: Nicolas Sobrero</p>
                                </div>
                            </li>
                            <li>
                                <strong>Mandanos el comprobante</strong> a{' '}
                                <a href="mailto:gestioncomplejodeportivo@gmail.com" style={{ color: 'var(--color-accent)' }}>
                                    blogartesanos.soporte.2026@gmail.com
                                </a>{' '}
                                con tu email de cuenta {usuario?.email && `(${usuario.email})`}.
                            </li>
                            <li>
                                <strong>Activación en 24hs</strong>. Te llega un email cuando tu cuenta queda Premium.
                            </li>
                        </ol>

                        <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '24px', fontStyle: 'italic' }}>
                            Próximamente vamos a integrar Mercado Pago para pago automático y renovación.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

function Item({ ok, highlight, children }) {
    return (
        <li style={{
            display: 'flex', gap: '8px', alignItems: 'flex-start',
            fontSize: '14px',
            color: ok
                ? (highlight ? 'var(--color-text)' : 'var(--color-text-2)')
                : 'var(--color-text-3)'
        }}>
            <span style={{ color: ok ? (highlight ? '#f5b94f' : 'var(--color-success)') : 'var(--color-text-3)', flexShrink: 0 }}>
                {ok ? '✓' : '×'}
            </span>
            <span style={{ fontWeight: highlight ? '500' : '400' }}>{children}</span>
        </li>
    )
}
