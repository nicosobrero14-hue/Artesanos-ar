package com.nsobrero.blogArtesanos.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nsobrero.blogArtesanos.auth.ContactoRequest;
import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.entity.Contacto;
import com.nsobrero.blogArtesanos.enums.TipoNotificacion;
import com.nsobrero.blogArtesanos.repository.ArtesanoRepository;
import com.nsobrero.blogArtesanos.repository.ContactoRepository;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContactoService {

    private final ContactoRepository contactoRepository;
    private final ArtesanoRepository artesanoRepository;
    private final EmailService emailService;
    private final NotificacionService notificacionService;
    private final SanitizerService sanitizer;

    public Contacto enviar(String slug, ContactoRequest request) {
        var artesano = artesanoRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Artesano no encontrado"));

        Contacto contacto = new Contacto();
        contacto.setNombre(sanitizer.limpiar(request.nombre(), 120));
        contacto.setEmail(sanitizer.limpiar(request.email(), 120));
        contacto.setMensaje(sanitizer.limpiar(request.mensaje(), 2000));
        contacto.setPiezaId(request.piezaId());
        contacto.setArtesano(artesano);

        Contacto guardado = contactoRepository.save(contacto);

        try {
            emailService.enviarNotificacionContacto(
                artesano.getEmail(), artesano.getNombre(),
                request.nombre(), request.mensaje(), request.email()
            );
        } catch (Exception e) {
            log.warn("Error al notificar al artesano por email", e);
        }

        // Notificación in-app además del email
        notificacionService.notificar(
            artesano.getId(), TipoNotificacion.MENSAJE_CONTACTO,
            "Nuevo mensaje de " + request.nombre(),
            "/panel/mensajes"
        );

        return guardado;
    }

    public List<Contacto> listar(Long artesanoId) {
        return contactoRepository.findByArtesanoId(artesanoId);
    }

    @Transactional
    public void responder(Long contactoId, Long artesanoId, String mensajeRespuesta) {
        Contacto contacto = contactoRepository.findById(contactoId)
                .orElseThrow(() -> new RuntimeException("Mensaje no encontrado"));

        // Cargamos el artesano por separado en vez de lazy-loadear desde el contacto.
        // Así evitamos cualquier problema de proxy fuera de sesión.
        Artesano artesano = artesanoRepository.findById(artesanoId)
                .orElseThrow(() -> new RuntimeException("Artesano no encontrado"));

        if (!contacto.getArtesano().getId().equals(artesanoId)) {
            throw new RuntimeException("Sin permiso");
        }
        if (contacto.getEmail() == null || contacto.getEmail().isBlank()) {
            throw new RuntimeException("El contacto no proporcionó email para responder");
        }

        // Capturamos los datos en variables locales antes de mandar el email
        // para que los snapshots no dependan del proxy
        String emailDestino = contacto.getEmail();
        String nombreDestino = contacto.getNombre();
        String mensajeOriginal = contacto.getMensaje();
        String nombreArtesano = artesano.getNombre();

        emailService.enviarRespuesta(
            emailDestino, nombreDestino, mensajeOriginal,
            mensajeRespuesta, nombreArtesano
        );

        // Marcamos como leído al responder
        contacto.setLeido(true);
        contactoRepository.save(contacto);
    }

    @Transactional
    public Contacto marcarLeido(Long id, Long artesanoId) {
        Contacto contacto = contactoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mensaje no encontrado"));
        if (!contacto.getArtesano().getId().equals(artesanoId)) {
            throw new RuntimeException("Sin permiso");
        }
        contacto.setLeido(true);
        return contactoRepository.save(contacto);
    }
}