package com.nsobrero.blogArtesanos.controller;

import com.nsobrero.blogArtesanos.auth.ComentarioRequest;
import com.nsobrero.blogArtesanos.dto.ComentarioDTO;
import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.entity.Comentario;
import com.nsobrero.blogArtesanos.entity.Pieza;
import com.nsobrero.blogArtesanos.enums.TipoNotificacion;
import com.nsobrero.blogArtesanos.repository.ComentarioRepository;
import com.nsobrero.blogArtesanos.repository.PiezaRepository;
import com.nsobrero.blogArtesanos.service.NotificacionService;
import com.nsobrero.blogArtesanos.service.SanitizerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/piezas")
@RequiredArgsConstructor
public class ComentarioController {

    private final ComentarioRepository comentarioRepository;
    private final PiezaRepository piezaRepository;
    private final NotificacionService notificacionService;
    private final SanitizerService sanitizer;

    // GET público — cualquiera puede ver los comentarios
    @GetMapping("/{piezaId}/comentarios")
    public ResponseEntity<List<ComentarioDTO>> listar(@PathVariable Long piezaId) {
        return ResponseEntity.ok(
            comentarioRepository.findByPiezaIdOrderByFechaDesc(piezaId)
                .stream().map(this::toDTO).toList()
        );
    }

    /*
     * POST — para comentar hay que estar logueado.
     * Si el artesano está autenticado (@AuthenticationPrincipal no es null),
     * guardamos su nombre y marcamos esAnonimo = false.
     * Si no hay sesión, Spring Security bloquea con 401 antes de llegar acá
     * gracias a la configuración en SecurityConfig.
     */
    /*
     * @Transactional necesario porque al final accedemos pieza.getArtesano().getSlug()
     * para armar la URL de la notificación. Pieza.artesano es lazy y sin transacción
     * tira LazyInitializationException ("no session").
     */
    @Transactional
    @PostMapping("/{piezaId}/comentarios")
    public ResponseEntity<ComentarioDTO> comentar(
            @PathVariable Long piezaId,
            @Valid @RequestBody ComentarioRequest request,
            @AuthenticationPrincipal Artesano artesano) {

        // Límite: 1 comentario por usuario por pieza (como pidió el modelo)
        // Si ya comentó, devolvemos 400 con un mensaje claro.
        if (comentarioRepository.existsByPiezaIdAndAutorId(piezaId, artesano.getId())) {
            throw new RuntimeException("Ya dejaste un comentario en esta pieza");
        }

        Pieza pieza = piezaRepository.findById(piezaId)
                .orElseThrow(() -> new RuntimeException("Pieza no encontrada"));

        Comentario comentario = new Comentario();
        comentario.setTexto(sanitizer.limpiar(request.texto(), 500));
        comentario.setPieza(pieza);
        comentario.setAutorId(artesano.getId());
        comentario.setAutorNombre(artesano.getNombre());
        comentario.setEsAnonimo(false);

        Comentario guardado = comentarioRepository.save(comentario);

        // Notificación al dueño de la pieza (excepto si comenta su propia pieza)
        Long dueñoId = pieza.getArtesano().getId();
        if (!dueñoId.equals(artesano.getId())) {
            notificacionService.notificar(
                dueñoId, TipoNotificacion.COMENTARIO_NUEVO,
                artesano.getNombre() + " comentó tu pieza '" + pieza.getTitulo() + "'",
                "/artesano/" + pieza.getArtesano().getSlug() + "/pieza/" + pieza.getId()
            );
        }

        return ResponseEntity.ok(toDTO(guardado));
    }

    /*
     * @Transactional es necesario porque Comentario.pieza tiene FetchType.LAZY.
     * Sin esta anotación, acceder a comentario.getPieza().getArtesano() fuera de
     * una sesión JPA activa lanza LazyInitializationException.
     */
    @Transactional
    @DeleteMapping("/{piezaId}/comentarios/{comentarioId}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long piezaId,
            @PathVariable Long comentarioId,
            @AuthenticationPrincipal Artesano artesano) {

        Comentario comentario = comentarioRepository.findById(comentarioId)
                .orElseThrow(() -> new RuntimeException("Comentario no encontrado"));

        boolean esDuenioDePieza = comentario.getPieza().getArtesano().getId().equals(artesano.getId());
        boolean esElAutor = artesano.getId().equals(comentario.getAutorId());

        if (!esDuenioDePieza && !esElAutor) {
            return ResponseEntity.status(403).build();
        }

        comentarioRepository.delete(comentario);
        return ResponseEntity.noContent().build();
    }

    private ComentarioDTO toDTO(Comentario c) {
        return new ComentarioDTO(c.getId(), c.getTexto(), c.getAutorNombre(), c.getEsAnonimo(), c.getFecha());
    }
}