package com.nsobrero.blogArtesanos.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${resend.api-key}")
    private String apiKey;

    @Value("${app.mail-from}")
    private String emailRemitente;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    private void enviar(String to, String subject, String text) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> body = Map.of(
            "from", emailRemitente,
            "to", List.of(to),
            "subject", subject,
            "text", text
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        restTemplate.postForObject("https://api.resend.com/emails", request, String.class);
    }

    /*
     * Manda la respuesta del artesano al email del contacto.
     * Incluye el mensaje original para dar contexto al destinatario.
     */
    @Async
    public void enviarRespuesta(String destinatario, String nombreDestinatario,
                                 String mensajeOriginal, String respuesta,
                                 String nombreArtesano) {
        enviar(
            destinatario,
            nombreArtesano + " respondió tu consulta — Artesanos",
            "Hola " + nombreDestinatario + ",\n\n" +
            nombreArtesano + " te respondió:\n\n" +
            "\"" + respuesta + "\"\n\n" +
            "---\n" +
            "Tu consulta original:\n" +
            "\"" + mensajeOriginal + "\"\n\n" +
            "Equipo Artesanos"
        );
    }

    /*
     * Reenvía feedback recibido al admin por email — para tener respaldo
     * fuera de la DB. Si la DB se corrompe, el admin igual tiene el email.
     */
    @Async
    public void enviarFeedbackAlAdmin(String adminEmail, String tipo,
                                       String mensaje, String autorNombre,
                                       String autorEmail) {
        enviar(
            adminEmail,
            "[Feedback " + (tipo != null ? tipo : "") + "] Artesanos.ar",
            "Recibiste un feedback nuevo en Artesanos.ar:\n\n" +
            "Tipo: " + (tipo != null ? tipo : "(sin tipo)") + "\n" +
            "Autor: " + (autorNombre != null ? autorNombre : "Anónimo") +
                (autorEmail != null ? " (" + autorEmail + ")" : "") + "\n\n" +
            "Mensaje:\n" + mensaje + "\n\n" +
            "---\n" +
            "Ver todos los feedbacks: " + frontendUrl + "/admin/feedback"
        );
    }

    /*
     * Email para recuperar contraseña. Manda link con token único que vence en 1 hora.
     */
    @Async
    public void enviarResetPassword(String destinatario, String nombre, String token) {
        enviar(
            destinatario,
            "Recuperar tu contraseña — Artesanos.ar",
            "Hola " + nombre + ",\n\n" +
            "Recibimos una solicitud para restablecer tu contraseña. Si no fuiste vos, ignorá este email.\n\n" +
            "Para crear una nueva contraseña, hacé click en este link:\n\n" +
            frontendUrl + "/recuperar-password?token=" + token + "\n\n" +
            "El link vence en 1 hora.\n\n" +
            "Equipo Artesanos.ar"
        );
    }

    @Async
    public void enviarNotificacionContacto(String artesanoEmail, String artesanoNombre,
                                            String remitente, String mensajeTexto, String remitenteEmail) {
        enviar(
            artesanoEmail,
            "Nuevo mensaje de " + remitente + " — Artesanos",
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
    }

    /*
     * Manda el email de verificación con el link de activación.
     * El link lleva al frontend que a su vez llama al backend para confirmar.
     */
    @Async
    public void enviarVerificacion(String destinatario, String nombre, String token) {
        enviar(
            destinatario,
            "Activá tu cuenta en Artesanos",
            "Hola " + nombre + ",\n\n" +
            "Gracias por registrarte. Hacé click en el siguiente link para activar tu cuenta:\n\n" +
            frontendUrl + "/verificar?token=" + token + "\n\n" +
            "🎁 Bonus: al verificar tu cuenta te activamos automáticamente 1 mes de Premium gratis.\n" +
            "Con Premium podés destacar tus piezas, subir más fotos por pieza, agregar videos y más.\n\n" +
            "El link vence en 24 horas.\n\n" +
            "Si no te registraste, ignorá este email.\n\n" +
            "Equipo Artesanos"
        );
    }
}
