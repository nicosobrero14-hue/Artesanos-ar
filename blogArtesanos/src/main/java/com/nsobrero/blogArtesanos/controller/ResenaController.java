package com.nsobrero.blogArtesanos.controller;

import com.nsobrero.blogArtesanos.auth.ResenaRequest;
import com.nsobrero.blogArtesanos.dto.ResenaDTO;
import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.entity.Resena;
import com.nsobrero.blogArtesanos.enums.RolUsuario;
import com.nsobrero.blogArtesanos.enums.TipoNotificacion;
import com.nsobrero.blogArtesanos.repository.ArtesanoRepository;
import com.nsobrero.blogArtesanos.repository.ResenaRepository;
import com.nsobrero.blogArtesanos.service.NotificacionService;
import com.nsobrero.blogArtesanos.service.SanitizerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/artesanos/{slug}/resenas")
@RequiredArgsConstructor
public class ResenaController {

    private final ResenaRepository resenaRepository;
    private final ArtesanoRepository artesanoRepository;
    private final NotificacionService notificacionService;
    private final SanitizerService sanitizer;

    /*
     * GET público: ver todas las reseñas + promedio.
     * Devuelve { resenas: [...], promedio: 4.3, total: 12 }
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> listar(@PathVariable String slug) {
        Artesano artesano = artesanoRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Artesano no encontrado"));

        List<Resena> lista = resenaRepository.findByArtesanoIdOrderByFechaDesc(artesano.getId());

        double promedio = lista.isEmpty() ? 0
                : lista.stream().mapToInt(Resena::getCalificacion).average().orElse(0);

        return ResponseEntity.ok(Map.of(
            "resenas", lista.stream().map(this::toDTO).toList(),
            "promedio", Math.round(promedio * 10.0) / 10.0,
            "total", lista.size()
        ));
    }

    /*
     * POST: dejar reseña. Requiere auth. 1 reseña por usuario por artesano.
     * No te podés autoreseñar.
     */
    @PostMapping
    @Transactional
    public ResponseEntity<ResenaDTO> crear(
            @PathVariable String slug,
            @Valid @RequestBody ResenaRequest request,
            @AuthenticationPrincipal Artesano autor) {

        Artesano artesano = artesanoRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Artesano no encontrado"));

        if (artesano.getId().equals(autor.getId())) {
            throw new RuntimeException("No podés dejarte una reseña a vos mismo");
        }

        if (resenaRepository.existsByArtesanoIdAndAutorId(artesano.getId(), autor.getId())) {
            throw new RuntimeException("Ya dejaste una reseña a este artesano");
        }

        Resena resena = new Resena();
        resena.setCalificacion(request.calificacion());
        resena.setTexto(sanitizer.limpiar(request.texto(), 1000));
        resena.setArtesano(artesano);
        resena.setAutorId(autor.getId());
        resena.setAutorNombre(autor.getNombre());

        Resena guardada = resenaRepository.save(resena);

        notificacionService.notificar(
            artesano.getId(), TipoNotificacion.RESENA_NUEVA,
            autor.getNombre() + " te dejó una reseña de " + request.calificacion() + " ★",
            "/artesano/" + artesano.getSlug()
        );

        return ResponseEntity.ok(toDTO(guardada));
    }

    /*
     * DELETE: borrar reseña.
     * Permitido si: sos el autor, sos el artesano reseñado, o sos ADMIN.
     * (El artesano reseñado puede borrar reseñas mentirosas/spam.)
     */
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> eliminar(
            @PathVariable String slug,
            @PathVariable Long id,
            @AuthenticationPrincipal Artesano usuario) {

        Resena resena = resenaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reseña no encontrada"));

        boolean esElAutor = resena.getAutorId().equals(usuario.getId());
        boolean esElArtesanoResenado = resena.getArtesano().getId().equals(usuario.getId());
        boolean esAdmin = usuario.getRol() == RolUsuario.ADMIN;

        if (!esElAutor && !esElArtesanoResenado && !esAdmin) {
            return ResponseEntity.status(403).build();
        }

        resenaRepository.delete(resena);
        return ResponseEntity.noContent().build();
    }

    private ResenaDTO toDTO(Resena r) {
        return new ResenaDTO(
            r.getId(), r.getCalificacion(), r.getTexto(),
            r.getAutorNombre(), r.getAutorId(), r.getFecha()
        );
    }
}
