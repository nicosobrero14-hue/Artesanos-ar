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
     * Hace una sola query del listado + una query por conversación para resolver el "otro".
     * Como vamos a tener pocas conversaciones por usuario, está OK.
     */
    @Transactional
    public List<ChatDTO.ConversacionItemDTO> listarMias(Long userId) {
        List<Conversacion> convos = conversacionRepository.findMias(userId);
        return convos.stream().map(c -> {
            Long otroId = c.getOtroParticipante(userId);
            Artesano otro = artesanoRepository.findById(otroId).orElse(null);
            int noLeidos = c.getParticipanteAId().equals(userId) ? c.getNoLeidosA() : c.getNoLeidosB();
            return new ChatDTO.ConversacionItemDTO(
                c.getId(),
                otroId,
                otro != null ? otro.getNombre() : "Cuenta eliminada",
                otro != null ? otro.getSlug() : null,
                otro != null ? otro.getAvatarUrl() : null,
                c.getUltimoMensaje(),
                c.getUltimoMensajeAutorId() != null && c.getUltimoMensajeAutorId().equals(userId),
                c.getUltimaActividad(),
                noLeidos
            );
        }).toList();
    }

    /*
     * Abre o crea una conversación con otro usuario y devuelve los mensajes.
     * Si ya existe, marca como leídos los mensajes que el otro mandó al usuario actual.
     *
     * No permitimos chat con admins (cuentas operativas) ni autoconversación.
     */
    @Transactional
    public ChatDTO.DetalleDTO abrirConversacion(Long userId, Long otroId) {
        if (userId.equals(otroId)) {
            throw new RuntimeException("No podés chatear con vos mismo");
        }
        Artesano otro = artesanoRepository.findById(otroId)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        if (otro.getRol() == RolUsuario.ADMIN) {
            throw new RuntimeException("No podés chatear con la cuenta admin");
        }

        // a < b ordenado para garantizar uniqueness
        Long a = Math.min(userId, otroId);
        Long b = Math.max(userId, otroId);

        Conversacion convo = conversacionRepository.buscarEntre(a, b)
            .orElseGet(() -> {
                Conversacion nueva = new Conversacion();
                nueva.setParticipanteAId(a);
                nueva.setParticipanteBId(b);
                return conversacionRepository.save(nueva);
            });

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
            mensajesDTO
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
     */
    @Transactional
    public ChatDTO.MensajeDTO enviarMensaje(Long userId, Long convoId, String texto) {
        Conversacion convo = conversacionRepository.findById(convoId)
            .orElseThrow(() -> new RuntimeException("Conversación no encontrada"));
        if (!convo.esParticipante(userId)) throw new RuntimeException("Sin permiso");

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

        Long destinatarioId;
        if (convo.getParticipanteAId().equals(userId)) {
            convo.setNoLeidosB(convo.getNoLeidosB() + 1);
            destinatarioId = convo.getParticipanteBId();
        } else {
            convo.setNoLeidosA(convo.getNoLeidosA() + 1);
            destinatarioId = convo.getParticipanteAId();
        }
        conversacionRepository.save(convo);

        // Notificación al destinatario
        Artesano autor = artesanoRepository.findById(userId).orElse(null);
        if (autor != null) {
            notificacionService.notificar(
                destinatarioId, TipoNotificacion.MENSAJE_CONTACTO,
                "💬 Nuevo mensaje de " + autor.getNombre(),
                "/chat?con=" + userId
            );
        }

        return new ChatDTO.MensajeDTO(
            msg.getId(), msg.getAutorId(), msg.getTexto(), msg.getFecha(),
            msg.getLeido(), true
        );
    }

    /*
     * Cuenta total de mensajes no leídos del usuario en todas sus conversaciones.
     * Para el badge global del chat.
     */
    @Transactional
    public long countNoLeidos(Long userId) {
        return conversacionRepository.findMias(userId).stream()
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
     * Afecta a AMBOS participantes (no es soft-delete por usuario para no
     * complicar el modelo). El frontend muestra advertencia clara antes.
     */
    @Transactional
    public void vaciarChat(Long userId, Long convoId) {
        Conversacion convo = conversacionRepository.findById(convoId)
            .orElseThrow(() -> new RuntimeException("Conversación no encontrada"));
        if (!convo.esParticipante(userId)) throw new RuntimeException("Sin permiso");

        mensajeChatRepository.deleteByConversacionId(convoId);

        convo.setUltimoMensaje(null);
        convo.setUltimoMensajeAutorId(null);
        convo.setNoLeidosA(0);
        convo.setNoLeidosB(0);
        convo.setUltimaActividad(LocalDateTime.now());
        conversacionRepository.save(convo);
    }

    /*
     * Eliminar conversación completa: borra mensajes + la conversación entera.
     * Si vuelven a chatear se crea una nueva conversación desde cero.
     */
    @Transactional
    public void eliminarConversacion(Long userId, Long convoId) {
        Conversacion convo = conversacionRepository.findById(convoId)
            .orElseThrow(() -> new RuntimeException("Conversación no encontrada"));
        if (!convo.esParticipante(userId)) throw new RuntimeException("Sin permiso");

        mensajeChatRepository.deleteByConversacionId(convoId);
        conversacionRepository.delete(convo);
    }
}
