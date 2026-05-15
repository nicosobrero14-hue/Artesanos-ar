package com.nsobrero.blogArtesanos.controller;

import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.entity.Notificacion;
import com.nsobrero.blogArtesanos.repository.NotificacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {

    private final NotificacionRepository notificacionRepository;

    /*
     * Lista las últimas 20 notificaciones del usuario.
     * El frontend consulta esto al desplegar la campanita.
     */
    @GetMapping
    public ResponseEntity<List<Notificacion>> mias(@AuthenticationPrincipal Artesano artesano) {
        return ResponseEntity.ok(
            notificacionRepository.findTop20ByDestinatarioIdOrderByFechaDesc(artesano.getId())
        );
    }

    /*
     * Solo el contador de no leídas — endpoint liviano para polling cada N segundos.
     */
    @GetMapping("/no-leidas")
    public ResponseEntity<Map<String, Long>> noLeidas(@AuthenticationPrincipal Artesano artesano) {
        long count = notificacionRepository.countByDestinatarioIdAndLeidaFalse(artesano.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    /*
     * Marca TODAS las notificaciones como leídas.
     * Se llama cuando el usuario abre el dropdown de la campanita.
     */
    @PostMapping("/marcar-leidas")
    @Transactional
    public ResponseEntity<Map<String, Integer>> marcarLeidas(@AuthenticationPrincipal Artesano artesano) {
        int actualizadas = notificacionRepository.marcarTodasLeidas(artesano.getId());
        return ResponseEntity.ok(Map.of("actualizadas", actualizadas));
    }
}
