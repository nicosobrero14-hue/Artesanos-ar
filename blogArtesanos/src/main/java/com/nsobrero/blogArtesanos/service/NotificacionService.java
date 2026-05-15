package com.nsobrero.blogArtesanos.service;

import com.nsobrero.blogArtesanos.entity.Notificacion;
import com.nsobrero.blogArtesanos.enums.TipoNotificacion;
import com.nsobrero.blogArtesanos.repository.NotificacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/*
 * Helper para crear notificaciones desde otros services.
 *
 * Uso:
 *   notificacionService.notificar(
 *       destinatarioId,
 *       TipoNotificacion.LIKE_NUEVO,
 *       "A Juan le gustó tu pieza 'Cuchillo gaucho'",
 *       "/artesano/yo/pieza/123"
 *   );
 *
 * Si por alguna razón falla guardar la notificación, NO rompemos la operación
 * principal — solo loggeamos. Una notificación faltante no es razón para que
 * el like/comentario/etc. también falle.
 */
@Service
@RequiredArgsConstructor
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;

    public void notificar(Long destinatarioId, TipoNotificacion tipo, String mensaje, String url) {
        try {
            Notificacion n = new Notificacion();
            n.setDestinatarioId(destinatarioId);
            n.setTipo(tipo);
            n.setMensaje(mensaje);
            n.setUrl(url);
            notificacionRepository.save(n);
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(NotificacionService.class)
                .warn("Error al crear notificación", e);
        }
    }
}
