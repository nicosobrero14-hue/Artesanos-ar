package com.nsobrero.blogArtesanos.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.mail-from}")
    private String emailRemitente;

    /*
     * Manda la respuesta del artesano al email del contacto.
     * Incluye el mensaje original para dar contexto al destinatario.
     */
    @Async
    public void enviarRespuesta(String destinatario, String nombreDestinatario,
                                 String mensajeOriginal, String respuesta,
                                 String nombreArtesano) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(emailRemitente);
        msg.setTo(destinatario);
        msg.setSubject(nombreArtesano + " respondió tu consulta — Artesanos");
        msg.setText(
            "Hola " + nombreDestinatario + ",\n\n" +
            nombreArtesano + " te respondió:\n\n" +
            "\"" + respuesta + "\"\n\n" +
            "---\n" +
            "Tu consulta original:\n" +
            "\"" + mensajeOriginal + "\"\n\n" +
            "Equipo Artesanos"
        );
        mailSender.send(msg);
    }

    /*
     * Reenvía feedback recibido al admin por email — para tener respaldo
     * fuera de la DB. Si la DB se corrompe, el admin igual tiene el email.
     */
    @Async
    public void enviarFeedbackAlAdmin(String adminEmail, String tipo,
                                       String mensaje, String autorNombre,
                                       String autorEmail) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(emailRemitente);
        msg.setTo(adminEmail);
        msg.setSubject("[Feedback " + (tipo != null ? tipo : "") + "] Artesanos.ar");
        msg.setText(
            "Recibiste un feedback nuevo en Artesanos.ar:\n\n" +
            "Tipo: " + (tipo != null ? tipo : "(sin tipo)") + "\n" +
            "Autor: " + (autorNombre != null ? autorNombre : "Anónimo") +
                (autorEmail != null ? " (" + autorEmail + ")" : "") + "\n\n" +
            "Mensaje:\n" + mensaje + "\n\n" +
            "---\n" +
            "Ver todos los feedbacks: " + frontendUrl + "/admin/feedback"
        );
        mailSender.send(msg);
    }

    /*
     * Email para recuperar contraseña. Manda link con token único que vence en 1 hora.
     */
    @Async
    public void enviarResetPassword(String destinatario, String nombre, String token) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(emailRemitente);
        msg.setTo(destinatario);
        msg.setSubject("Recuperar tu contraseña — Artesanos.ar");
        msg.setText(
            "Hola " + nombre + ",\n\n" +
            "Recibimos una solicitud para restablecer tu contraseña. Si no fuiste vos, ignorá este email.\n\n" +
            "Para crear una nueva contraseña, hacé click en este link:\n\n" +
            frontendUrl + "/recuperar-password?token=" + token + "\n\n" +
            "El link vence en 1 hora.\n\n" +
            "Equipo Artesanos.ar"
        );
        mailSender.send(msg);
    }

    @Async
    public void enviarNotificacionContacto(String artesanoEmail, String artesanoNombre,
                                            String remitente, String mensajeTexto, String remitenteEmail) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(emailRemitente);
        msg.setTo(artesanoEmail);
        msg.setSubject("Nuevo mensaje de " + remitente + " — Artesanos");
        msg.setText(
            "Hola " + artesanoNombre + ",\n\n" +
            "Recibiste un nuevo mensaje de " + remitente + ":\n\n" +
            "\"" + mensajeTexto + "\"\n\n" +
            (remitenteEmail != null && !remitenteEmail.isBlank()
                ? "Podés responderle a: " + remitenteEmail + "\n\n"
                : "") +
            "Ver todos tus mensajes:\n" +
            frontendUrl + "/panel/mensajes\n\n" +
            "Equipo Artesanos"
        );
        mailSender.send(msg);
    }

    /*
     * Manda el email de verificación con el link de activación.
     * El link lleva al frontend que a su vez llama al backend para confirmar.
     */
    @Async
    public void enviarVerificacion(String destinatario, String nombre, String token) {
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setFrom(emailRemitente);
        mensaje.setTo(destinatario);
        mensaje.setSubject("Activá tu cuenta en Artesanos");
        mensaje.setText(
            "Hola " + nombre + ",\n\n" +
            "Gracias por registrarte. Hacé click en el siguiente link para activar tu cuenta:\n\n" +
            frontendUrl + "/verificar?token=" + token + "\n\n" +
            "El link vence en 24 horas.\n\n" +
            "Si no te registraste, ignorá este email.\n\n" +
            "Equipo Artesanos"
        );
        mailSender.send(mensaje);
    }
}
