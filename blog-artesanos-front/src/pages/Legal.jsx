import { Link, useLocation } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'

/*
 * Páginas legales. Una sola componente que renderiza T&C o Privacidad
 * según la ruta. Lo modelamos así para no duplicar el layout (topbar + footer).
 *
 * IMPORTANTE: estos textos son una BASE razonable pero no son consulta legal.
 * Antes de ir a producción real, hacelos revisar por un abogado especializado
 * en e-commerce/datos personales en Argentina.
 */
export default function Legal() {
    const { pathname } = useLocation()
    const esPrivacidad = pathname.includes('privacidad')
    const titulo = esPrivacidad ? 'Política de Privacidad' : 'Términos y Condiciones'

    useSEO({ title: titulo, description: `${titulo} de Artesanos-ar` })

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
            {/* Topbar simple */}
            <nav style={{
                background: 'var(--color-bg-2)', borderBottom: '1px solid var(--color-border)',
                padding: '0 24px', height: '56px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <Link to="/" style={{ color: 'var(--color-accent)', fontWeight: '700', fontSize: '17px' }}>
                    Artesanos<span style={{ color: 'var(--color-text-3)', fontWeight: '400' }}>.ar</span>
                </Link>
            </nav>

            <article style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px 80px' }}>
                <p style={{ fontSize: '12px', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                    Documento legal
                </p>
                <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>{titulo}</h1>
                <p style={{ fontSize: '13px', color: 'var(--color-text-3)', marginBottom: '32px' }}>
                    Última actualización: {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>

                <div style={{ fontSize: '15px', lineHeight: '1.7', color: 'var(--color-text-2)' }}>
                    {esPrivacidad ? <Privacidad /> : <Terminos />}
                </div>

                <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--color-border)', fontSize: '13px', color: 'var(--color-text-3)' }}>
                    ¿Dudas?{' '}
                    <a href="mailto:gestioncomplejodeportivo@gmail.com" style={{ color: 'var(--color-accent)' }}>
                        Escribinos
                    </a>
                </div>
            </article>
        </div>
    )
}

function Terminos() {
    return (
        <>
            <H>1. Aceptación</H>
            <P>
                Al usar Artesanos-ar aceptás estos Términos. Si no estás de acuerdo, no uses el sitio.
            </P>

            <H>2. Quiénes somos</H>
            <P>
                Artesanos-ar es una plataforma que conecta artesanos argentinos con personas interesadas
                en su trabajo. No somos parte de las transacciones — solo facilitamos el contacto.
            </P>

            <H>3. Cuentas de usuario</H>
            <P>
                Para registrarte como artesano necesitás un email válido. Tu cuenta es personal e
                intransferible. Sos responsable de mantener tu contraseña segura. Si detectás un uso
                no autorizado, avisanos enseguida.
            </P>

            <H>4. Contenido publicado</H>
            <P>
                Como artesano, sos el único responsable del contenido (piezas, fotos, descripciones,
                precios) que publicás. Te comprometés a:
            </P>
            <ul style={ulStyle}>
                <li>Publicar solo trabajo de tu autoría o con autorización</li>
                <li>No publicar contenido ofensivo, ilegal o que infrinja derechos de terceros</li>
                <li>Mantener actualizado el estado de tus piezas (disponible/vendida/reservada)</li>
                <li>Cumplir tus compromisos con los clientes que te contacten</li>
            </ul>

            <H>5. Plan Premium</H>
            <P>
                El plan Premium se contrata mensualmente. El pago se realiza por transferencia bancaria
                (próximamente vía Mercado Pago). El plan se activa dentro de las 24 horas de recibido
                el comprobante. No hay reembolsos parciales por meses iniciados. Podés bajar a Gratis
                en cualquier momento — el plan se mantiene activo hasta su fecha de expiración.
            </P>

            <H>6. Moderación</H>
            <P>
                Nos reservamos el derecho de moderar, ocultar o eliminar contenido que viole estos
                términos. También podemos suspender o eliminar cuentas que abusen del sistema (spam,
                contenido falso, comportamiento abusivo).
            </P>

            <H>7. Comisiones e impuestos</H>
            <P>
                Hoy Artesanos.ar no cobra comisión por venta. Cada artesano es responsable de sus
                obligaciones impositivas (Monotributo, IVA, etc.) sobre las ventas que concrete.
            </P>

            <H>8. Limitación de responsabilidad</H>
            <P>
                Artesanos.ar se ofrece "como está". No garantizamos disponibilidad ininterrumpida.
                No somos responsables por disputas entre artesanos y compradores. Cualquier reclamo
                debe resolverse directamente entre las partes.
            </P>

            <H>9. Cambios en los términos</H>
            <P>
                Podemos modificar estos términos. Si los cambios son importantes te avisamos por email.
                Si seguís usando el sitio después de los cambios, los aceptás.
            </P>

            <H>10. Jurisdicción</H>
            <P>
                Estos términos se rigen por las leyes de la República Argentina. Cualquier conflicto
                se resolverá en los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.
            </P>
        </>
    )
}

function Privacidad() {
    return (
        <>
            <H>1. Qué datos recolectamos</H>
            <P>
                Cuando te registrás:
            </P>
            <ul style={ulStyle}>
                <li>Nombre, email, contraseña (hasheada con BCrypt)</li>
                <li>Bio, ubicación, rubros, redes sociales (los que vos cargás)</li>
                <li>Fotos de tus piezas (alojadas en Cloudinary)</li>
            </ul>
            <P>Cuando navegás:</P>
            <ul style={ulStyle}>
                <li>Cookies técnicas necesarias para el login (token JWT en localStorage)</li>
                <li>NO usamos cookies de tracking ni analytics de terceros por ahora</li>
            </ul>

            <H>2. Para qué usamos tus datos</H>
            <ul style={ulStyle}>
                <li>Crear y mantener tu cuenta</li>
                <li>Mostrar tu catálogo público (nombre, bio, ubicación, rubros, redes)</li>
                <li>Permitir que potenciales clientes te contacten</li>
                <li>Enviarte notificaciones por email (verificación, mensajes recibidos, respuestas)</li>
                <li>Mejorar el servicio</li>
            </ul>

            <H>3. Qué NO hacemos con tus datos</H>
            <ul style={ulStyle}>
                <li>NO los vendemos ni cedemos a terceros con fines comerciales</li>
                <li>NO compartimos tu email o teléfono fuera de la plataforma sin tu consentimiento</li>
                <li>NO accedemos a tus comunicaciones privadas con clientes (los emails se mandan
                    desde nuestro servidor pero no los leemos)</li>
            </ul>

            <H>4. Información pública vs privada</H>
            <P>
                Es público (cualquiera puede ver): nombre, slug, bio, ubicación, rubros, fotos de
                piezas, precios, comentarios, reseñas.
            </P>
            <P>
                Es privado (solo vos): email, contraseña, mensajes de contacto recibidos, datos de
                clientes que cargues.
            </P>

            <H>5. Tus derechos</H>
            <P>
                Tenés derecho a:
            </P>
            <ul style={ulStyle}>
                <li><strong>Acceder</strong> a tus datos (los podés ver en /panel/perfil)</li>
                <li><strong>Rectificar</strong> tus datos (podés editarlos en cualquier momento)</li>
                <li><strong>Eliminar</strong> tu cuenta y todos tus datos (en /panel/perfil →
                    "Eliminar mi cuenta")</li>
                <li><strong>Solicitar</strong> una copia de tus datos por email</li>
            </ul>

            <H>6. Almacenamiento</H>
            <P>
                Los datos se guardan en MySQL en Argentina. Las fotos en Cloudinary
                (servicio internacional). Los emails se envían vía Gmail SMTP.
            </P>

            <H>7. Seguridad</H>
            <P>
                Usamos HTTPS (próximamente, en producción), hashing de contraseñas con BCrypt, y
                tokens JWT firmados. No almacenamos datos de tarjetas de crédito (los pagos pasan
                por Mercado Pago).
            </P>

            <H>8. Cookies</H>
            <P>
                Solo usamos almacenamiento local (localStorage) para el token de sesión. No hay
                tracking. Si en el futuro agregamos analytics, te vamos a pedir consentimiento.
            </P>

            <H>9. Menores</H>
            <P>
                El servicio es para mayores de 18 años. Si sos menor, necesitás autorización de
                tu tutor para registrarte.
            </P>

            <H>10. Contacto</H>
            <P>
                Para cualquier consulta sobre privacidad, escribinos a{' '}
                <a href="mailto:blogartesanos.soporte.2026@gmail.com" style={{ color: 'var(--color-accent)' }}>
                    blogartesanos.soporte.2026@gmail.com
                </a>.
                Esta política se rige por la Ley 25.326 de Protección de Datos Personales de Argentina.
            </P>
        </>
    )
}

const ulStyle = { paddingLeft: '20px', marginBottom: '16px' }
const H = ({ children }) => (
    <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)', marginTop: '32px', marginBottom: '12px' }}>
        {children}
    </h2>
)
const P = ({ children }) => (
    <p style={{ marginBottom: '12px' }}>{children}</p>
)
