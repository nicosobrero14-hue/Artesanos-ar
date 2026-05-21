package com.nsobrero.blogArtesanos.service;

import com.nsobrero.blogArtesanos.dto.ChatDTO;
import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.entity.Conversacion;
import com.nsobrero.blogArtesanos.entity.MensajeChat;
import com.nsobrero.blogArtesanos.enums.RolUsuario;
import com.nsobrero.blogArtesanos.enums.TipoNotificacion;
import com.nsobrero.blogArtesanos.repository.ArtesanoRepository;
import com.nsobrero.blogArtesanos.repository.ConversacionRepository;
import com.nsobrero.blogArtesanos.repository.MensajeChatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ConversacionRepository conversacionRepository;
    private final MensajeChatRepository mensajeChatRepository;
    private final ArtesanoRepository artesanoRepository;
    private final SanitizerService sanitizer;
    private final NotificacionService notificacionService;

    /*
     * Lista las conversaciones del usuario logueado para el panel de chat.
     * Excluye las que el usuario tiene "ocultas" (soft-delete por usuario).
     */
    @Transactional
    public List<ChatDTO.ConversacionItemDTO> listarMias(Long userId) {
        List<Conversacion> convos = conversacionRepository.findMias(userId);
        return convos.stream()
            .filter(c -> !c.isOcultaPara(userId))
            .map(c -> {
                Long otroId = c.getOtroParticipante(userId);
                Artesano otro = artesanoRepository.findById(otroId).orElse(null);
                int noLeidos = c.getParticipanteAId().equals(userId) ? c.getNoLeidosA() : c.getNoLeidosB();
                boolean otroEsAdmin = otro != null && otro.getRol() == RolUsuario.ADMIN;
                return new ChatDTO.ConversacionItemDTO(
                    c.getId(),
                    otroId,
                    otro != null ? otro.getNombre() : "Cuenta eliminada",
                    otro != null ? otro.getSlug() : null,
                    otro != null ? otro.getAvatarUrl() : null,
                    c.getUltimoMensaje(),
                    c.getUltimoMensajeAutorId() != null && c.getUltimoMensajeAutorId().equals(userId),
                    c.getUltimaActividad(),
                    noLeidos,
                    otroEsAdmin,
                    Boolean.TRUE.equals(c.getRespuestaHabilitada())
                );
            }).toList();
    }

    /*
     * Abre o crea una conversación con otro usuario y devuelve los mensajes.
     *
     * Reglas:
     *  - No se permite chatear con uno mismo.
     *  - Un usuario regular NO puede INICIAR conversación con admin, pero SÍ
     *    puede abrir una ya existente (que el admin haya iniciado) en modo lectura.
     *  - El admin puede iniciar conversación con cualquier usuario (usa este mismo
     *    método o el endpoint específico de admin).
     */
    @Transactional
    public ChatDTO.DetalleDTO abrirConversacion(Long userId, Long otroId) {
        if (userId.equals(otroId)) {
            throw new RuntimeException("No podés chatear con vos mismo");
        }
        Artesano yo = artesanoRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Artesano otro = artesanoRepository.findById(otroId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Long a = Math.min(userId, otroId);
        Long b = Math.max(userId, otroId);

        boolean yoSoyAdmin = yo.getRol() == RolUsuario.ADMIN;
        boolean otroEsAdmin = otro.getRol() == RolUsuario.ADMIN;

        Optional<Conversacion> existente = conversacionRepository.buscarEntre(a, b);

        Conversacion convo;
        if (existente.isPresent()) {
            convo = existente.get();
        } else {
            // Si el otro es admin y yo no, no puedo iniciar
            if (otroEsAdmin && !yoSoyAdmin) {
                throw new RuntimeException("No podés iniciar una conversación con la cuenta admin");
            }
            Conversacion nueva = new Conversacion();
            nueva.setParticipanteAId(a);
            nueva.setParticipanteBId(b);
            // Si el admin inicia, la respuesta del usuario queda deshabilitada por default
            if (yoSoyAdmin) {
                nueva.setRespuestaHabilitada(false);
            }
            convo = conversacionRepository.save(nueva);
        }

        // Al abrir, des-ocultar si estaba oculta para este usuario
        if (convo.isOcultaPara(userId)) {
            convo.setOcultaPara(userId, false);
            conversacionRepository.save(convo);
        }

        // Resetear no-leídos del usuario actual y marcar mensajes como leídos
        marcarLeidos(convo, userId);

        List<MensajeChat> mensajes = mensajeChatRepository.findByConversacionIdOrderByFechaAsc(convo.getId());
        List<ChatDTO.MensajeDTO> mensajesDTO = mensajes.stream()
            .map(m -> new ChatDTO.MensajeDTO(
                m.getId(), m.getAutorId(), m.getTexto(), m.getFecha(),
                m.getLeido(), m.getAutorId().equals(userId)
            ))
            .toList();

        return new ChatDTO.DetalleDTO(
            convo.getId(),
            otroId,
            otro.getNombre(),
            otro.getSlug(),
            otro.getAvatarUrl(),
            mensajesDTO,
            otroEsAdmin,
            Boolean.TRUE.equals(convo.getRespuestaHabilitada())
        );
    }

    /*
     * Solo trae mensajes posteriores a un id determinado (para polling incremental).
     * El frontend tracking del último id visto y pide solo los nuevos.
     */
    @Transactional
    public Map<String, Object> nuevosMensajes(Long userId, Long convoId, Long desdeId) {
        Conversacion convo = conversacionRepository.findById(convoId)
            .orElseThrow(() -> new RuntimeException("Conversación no encontrada"));
        if (!convo.esParticipante(userId)) throw new RuntimeException("Sin permiso");

        List<MensajeChat> todos = mensajeChatRepository.findByConversacionIdOrderByFechaAsc(convoId);
        long since = desdeId == null ? -1 : desdeId;
        List<ChatDTO.MensajeDTO> nuevos = todos.stream()
            .filter(m -> m.getId() > since)
            .map(m -> new ChatDTO.MensajeDTO(
                m.getId(), m.getAutorId(), m.getTexto(), m.getFecha(),
                m.getLeido(), m.getAutorId().equals(userId)
            ))
            .toList();

        // Si hay mensajes nuevos del otro, marcamos leídos
        if (!nuevos.isEmpty()) marcarLeidos(convo, userId);

        return Map.of("mensajes", nuevos);
    }

    /*
     * Envía un mensaje. Sanitiza el texto, actualiza la actividad y los contadores.
     * Crea notificación para el destinatario.
     *
     * Si el otro es admin y respuestaHabilitada=false y yo NO soy admin, se rechaza.
     */
    @Transactional
    public ChatDTO.MensajeDTO enviarMensaje(Long userId, Long convoId, String texto) {
        Conversacion convo = conversacionRepository.findById(convoId)
            .orElseThrow(() -> new RuntimeException("Conversación no encontrada"));
        if (!convo.esParticipante(userId)) throw new RuntimeException("Sin permiso");

        Artesano yo = artesanoRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        boolean yoSoyAdmin = yo.getRol() == RolUsuario.ADMIN;

        Long destinatarioId = convo.getOtroParticipante(userId);
        Artesano otro = artesanoRepository.findById(destinatarioId).orElse(null);
        boolean otroEsAdmin = otro != null && otro.getRol() == RolUsuario.ADMIN;

        // Solo el admin puede enviar libremente. Un usuario regular hablando con admin
        // requiere que la respuesta esté habilitada.
        if (otroEsAdmin && !yoSoyAdmin && !Boolean.TRUE.equals(convo.getRespuestaHabilitada())) {
            throw new RuntimeException("El admin no habilitó las respuestas en esta conversación");
        }

        String limpio = sanitizer.limpiar(texto, 2000);
        if (limpio == null || limpio.isBlank()) {
            throw new RuntimeException("El mensaje no puede estar vacío");
        }

        MensajeChat msg = new MensajeChat();
        msg.setConversacionId(convoId);
        msg.setAutorId(userId);
        msg.setTexto(limpio);
        msg = mensajeChatRepository.save(msg);

        // Actualizar conversación: último mensaje, actividad, contadores
        convo.setUltimoMensaje(limpio.length() > 200 ? limpio.substring(0, 200) : limpio);
        convo.setUltimoMensajeAutorId(userId);
        convo.setUltimaActividad(LocalDateTime.now());

        // Si el destinatario tenía la conversación oculta, se des-oculta automáticamente
        // — un mensaje nuevo siempre vuelve a sacarla a la luz.
        convo.setOcultaPara(destinatarioId, false);

        if (convo.getParticipanteAId().equals(userId)) {
            convo.setNoLeidosB(convo.getNoLeidosB() + 1);
        } else {
            convo.setNoLeidosA(convo.getNoLeidosA() + 1);
        }
        conversacionRepository.save(convo);

        // Notificación al destinatario
        if (yo != null) {
            notificacionService.notificar(
                destinatarioId, TipoNotificacion.MENSAJE_CONTACTO,
                "💬 Nuevo mensaje de " + yo.getNombre(),
                "/chat?con=" + userId
            );
        }

        return new ChatDTO.MensajeDTO(
            msg.getId(), msg.getAutorId(), msg.getTexto(), msg.getFecha(),
            msg.getLeido(), true
        );
    }

    /*
     * Cuenta total de mensajes no leídos del usuario en todas sus conversaciones,
     * excluyendo las ocultas.
     */
    @Transactional
    public long countNoLeidos(Long userId) {
        return conversacionRepository.findMias(userId).stream()
            .filter(c -> !c.isOcultaPara(userId))
            .mapToLong(c -> c.getParticipanteAId().equals(userId) ? c.getNoLeidosA() : c.getNoLeidosB())
            .sum();
    }

    private void marcarLeidos(Conversacion convo, Long userId) {
        if (convo.getParticipanteAId().equals(userId) && convo.getNoLeidosA() > 0) {
            convo.setNoLeidosA(0);
            conversacionRepository.save(convo);
        } else if (convo.getParticipanteBId().equals(userId) && convo.getNoLeidosB() > 0) {
            convo.setNoLeidosB(0);
            conversacionRepository.save(convo);
        }
    }

    /*
     * Vaciar el chat: borra todos los mensajes pero mantiene la conversación.
     * Afecta a AMBOS participantes — el frontend muestra advertencia clara antes.
     *
     * EXCEPCIÓN: si el OTRO es admin y yo no soy admin, no permitimos vaciar
     * bilateralmente (sería raro que un usuario borre el chat del admin).
     * El usuario regular en ese caso usa "eliminar para mí".
     */
    @Transactional
    public void vaciarChat(Long userId, Long convoId) {
        Conversacion convo = conversacionRepository.findById(convoId)
            .orElseThrow(() -> new RuntimeException("Conversación no encontrada"));
        if (!convo.esParticipante(userId)) throw new RuntimeException("Sin permiso");

        Artesano yo = artesanoRepository.findById(userId).orElse(null);
        Long otroId = convo.getOtroParticipante(userId);
        Artesano otro = artesanoRepository.findById(otroId).orElse(null);
        boolean yoSoyAdmin = yo != null && yo.getRol() == RolUsuario.ADMIN;
        boolean otroEsAdmin = otro != null && otro.getRol() == RolUsuario.ADMIN;

        if (otroEsAdmin && !yoSoyAdmin) {
            throw new RuntimeException("No podés vaciar una conversación del admin. Usá 'Eliminar para mí'.");
        }

        mensajeChatRepository.deleteByConversacionId(convoId);

        convo.setUltimoMensaje(null);
        convo.setUltimoMensajeAutorId(null);
        convo.setNoLeidosA(0);
        convo.setNoLeidosB(0);
        convo.setUltimaActividad(LocalDateTime.now());
        conversacionRepository.save(convo);
    }

    /*
     * Eliminar conversación: distinto comportamiento según los participantes.
     *
     *  - Si ambos son usuarios regulares: borrado bilateral (queda como estaba).
     *  - Si uno de los dos es admin: borrado SOLO del lado del que pide.
     *    El admin sigue viendo la conversación y los mensajes.
     *    Si llega un mensaje nuevo, se des-oculta automáticamente.
     */
    @Transactional
    public void eliminarConversacion(Long userId, Long convoId) {
        Conversacion convo = conversacionRepository.findById(convoId)
            .orElseThrow(() -> new RuntimeException("Conversación no encontrada"));
        if (!convo.esParticipante(userId)) throw new RuntimeException("Sin permiso");

        Long otroId = convo.getOtroParticipante(userId);
        Artesano yo = artesanoRepository.findById(userId).orElse(null);
        Artesano otro = artesanoRepository.findById(otroId).orElse(null);
        boolean yoSoyAdmin = yo != null && yo.getRol() == RolUsuario.ADMIN;
        boolean otroEsAdmin = otro != null && otro.getRol() == RolUsuario.ADMIN;

        if (yoSoyAdmin || otroEsAdmin) {
            // Soft-delete: solo se oculta para quien lo pide
            convo.setOcultaPara(userId, true);
            // Reset también el contador de no-leídos para que no quede sumando al badge
            if (convo.getParticipanteAId().equals(userId)) convo.setNoLeidosA(0);
            else convo.setNoLeidosB(0);
            conversacionRepository.save(convo);
        } else {
            // Borrado bilateral entre usuarios regulares (comportamiento histórico)
            mensajeChatRepository.deleteByConversacionId(convoId);
            conversacionRepository.delete(convo);
        }
    }

    /*
     * Admin habilita/deshabilita las respuestas del usuario en una conversación.
     * Solo el admin puede invocar esto.
     */
    @Transactional
    public boolean toggleRespuestaHabilitada(Long adminId, Long convoId) {
        Artesano admin = artesanoRepository.findById(adminId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        if (admin.getRol() != RolUsuario.ADMIN) {
            throw new RuntimeException("Solo admin puede modificar este estado");
        }
        Conversacion convo = conversacionRepository.findById(convoId)
            .orElseThrow(() -> new RuntimeException("Conversación no encontrada"));
        if (!convo.esParticipante(adminId)) throw new RuntimeException("Sin permiso");

        boolean nuevo = !Boolean.TRUE.equals(convo.getRespuestaHabilitada());
        convo.setRespuestaHabilitada(nuevo);
        conversacionRepository.save(convo);

        // Notificación al usuario para que sepa que ya puede responder
        if (nuevo) {
            Long otroId = convo.getOtroParticipante(adminId);
            notificacionService.notificar(
                otroId, TipoNotificacion.MENSAJE_CONTACTO,
                "El admin habilitó las respuestas en la conversación",
                "/chat?con=" + adminId
            );
        }
        return nuevo;
    }
}
