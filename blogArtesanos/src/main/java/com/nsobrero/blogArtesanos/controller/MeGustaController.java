package com.nsobrero.blogArtesanos.controller;

import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.entity.MeGusta;
import com.nsobrero.blogArtesanos.entity.Pieza;
import com.nsobrero.blogArtesanos.enums.TipoNotificacion;
import com.nsobrero.blogArtesanos.repository.MeGustaRepository;
import com.nsobrero.blogArtesanos.repository.PiezaRepository;
import com.nsobrero.blogArtesanos.service.NotificacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/piezas")
@RequiredArgsConstructor
public class MeGustaController {

    private final MeGustaRepository meGustaRepository;
    private final PiezaRepository piezaRepository;
    private final NotificacionService notificacionService;

    /*
     * GET público: cualquiera puede ver cuántos likes tiene una pieza.
     * Si está logueado y ya dio like, le incluímos meGusta=true para que
     * el frontend pinte el corazón.
     */
    @GetMapping("/{piezaId}/me-gusta")
    public ResponseEntity<Map<String, Object>> obtenerInfo(
            @PathVariable Long piezaId,
            @AuthenticationPrincipal Artesano artesano) {

        long count = meGustaRepository.countByPiezaId(piezaId);
        boolean meGusta = artesano != null
                && meGustaRepository.existsByPiezaIdAndAutorId(piezaId, artesano.getId());

        return ResponseEntity.ok(Map.of("count", count, "meGusta", meGusta));
    }

    /*
     * POST: toggle. Si ya dio like, lo saca; si no, lo agrega.
     * Devuelve el nuevo state.
     */
    @PostMapping("/{piezaId}/me-gusta")
    @Transactional
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable Long piezaId,
            @AuthenticationPrincipal Artesano artesano) {

        var existente = meGustaRepository.findByPiezaIdAndAutorId(piezaId, artesano.getId());

        if (existente.isPresent()) {
            // Ya tiene like → lo sacamos
            meGustaRepository.delete(existente.get());
            long count = meGustaRepository.countByPiezaId(piezaId);
            return ResponseEntity.ok(Map.of("count", count, "meGusta", false));
        } else {
            // No tiene → lo creamos
            Pieza pieza = piezaRepository.findById(piezaId)
                    .orElseThrow(() -> new RuntimeException("Pieza no encontrada"));

            MeGusta mg = new MeGusta();
            mg.setPieza(pieza);
            mg.setAutorId(artesano.getId());
            meGustaRepository.save(mg);

            // Notificación al dueño de la pieza (excepto si se da like a sí mismo)
            Long dueñoId = pieza.getArtesano().getId();
            if (!dueñoId.equals(artesano.getId())) {
                notificacionService.notificar(
                    dueñoId, TipoNotificacion.LIKE_NUEVO,
                    "A " + artesano.getNombre() + " le gustó tu pieza '" + pieza.getTitulo() + "'",
                    "/artesano/" + pieza.getArtesano().getSlug() + "/pieza/" + pieza.getId()
                );
            }

            long count = meGustaRepository.countByPiezaId(piezaId);
            return ResponseEntity.ok(Map.of("count", count, "meGusta", true));
        }
    }
}
