import { useState } from 'react'

/*
 * Sidebar lateral de oficios. Por defecto está colapsado (~38px) mostrando
 * solo "OFICIOS" vertical. Al hover se expande mostrando todos los oficios.
 *
 * Pensado para reemplazar la barra horizontal de chips: menos invasivo,
 * más original visualmente.
 *
 * El array `oficios` puede venir como:
 *   - strings simples: ['CUCHILLERIA', 'JOYERIA']
 *   - objetos {value, label}: del backend con el label legible
 * Lo normalizamos abajo para que funcione con ambas formas.
 */
export default function SidebarOficios({ oficios = [], seleccionado, onSeleccionar }) {
    const [expandido, setExpandido] = useState(false)

    // Normalizar: si vienen objetos {value, label} dejamos así, si vienen strings los convertimos
    const items = oficios.map(o =>
        typeof o === 'string' ? { value: o, label: o } : o
    )

    // El label legible del oficio seleccionado para mostrar en la tira vertical
    const labelSeleccionado = items.find(o => o.value === seleccionado)?.label || seleccionado

    return (
        <aside
            onMouseEnter={() => setExpandido(true)}
            onMouseLeave={() => setExpandido(false)}
            style={{
                position: 'fixed',
                top: '50%',
                left: 0,
                transform: 'translateY(-50%)',
                zIndex: 80,
                display: 'flex',
                background: 'var(--color-bg-2)',
                border: '1px solid var(--color-border)',
                borderLeft: 'none',
                borderRadius: '0 var(--radius) var(--radius) 0',
                boxShadow: expandido ? '4px 8px 32px rgba(0,0,0,0.3)' : '2px 4px 12px rgba(0,0,0,0.15)',
                transition: 'box-shadow 0.3s, transform 0.3s'
            }}
        >
            {/* Tira vertical "OFICIOS" — siempre visible */}
            <div style={{
                width: '38px',
                background: 'var(--color-bg-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 0',
                cursor: 'pointer',
                borderRight: expandido ? '1px solid var(--color-border)' : 'none',
                transition: 'border-color 0.3s'
            }}>
                <p style={{
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    fontSize: '12px',
                    fontWeight: '700',
                    letterSpacing: '0.3em',
                    color: seleccionado ? 'var(--color-premium)' : 'var(--color-text-2)',
                    textTransform: 'uppercase',
                    userSelect: 'none'
                }}>
                    {seleccionado ? `◆ ${labelSeleccionado}` : 'Oficios'}
                </p>
            </div>

            {/* Panel desplegable — solo cuando expandido */}
            <div style={{
                width: expandido ? '220px' : '0',
                overflow: 'hidden',
                transition: 'width 0.3s ease',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{
                    padding: '16px 18px 12px',
                    borderBottom: '1px solid var(--color-border)'
                }}>
                    <p style={{
                        fontSize: '10px',
                        color: 'var(--color-text-3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '2px'
                    }}>
                        Filtrá por
                    </p>
                    <p style={{ fontSize: '15px', fontWeight: '600' }}>Tipo de artesanía</p>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '8px',
                    maxHeight: '60vh',
                    overflowY: 'auto'
                }}>
                    <ItemOficio
                        activo={!seleccionado}
                        onClick={() => onSeleccionar?.(null)}
                    >
                        Todos
                    </ItemOficio>
                    {items.map(o => (
                        <ItemOficio
                            key={o.value}
                            activo={seleccionado === o.value}
                            onClick={() => onSeleccionar?.(o.value === seleccionado ? null : o.value)}
                        >
                            {o.label}
                        </ItemOficio>
                    ))}
                </div>
            </div>
        </aside>
    )
}

function ItemOficio({ activo, onClick, children }) {
    return (
        <button onClick={onClick} style={{
            background: activo ? '#f5b94f22' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 12px',
            color: activo ? 'var(--color-premium)' : 'var(--color-text-2)',
            fontSize: '13px',
            cursor: 'pointer',
            textAlign: 'left',
            fontWeight: activo ? '600' : '400',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
            textTransform: 'capitalize'
        }}
            onMouseEnter={e => { if (!activo) e.currentTarget.style.background = 'var(--color-bg-3)' }}
            onMouseLeave={e => { if (!activo) e.currentTarget.style.background = 'transparent' }}
        >
            {activo && '◆ '}{children}
        </button>
    )
}
