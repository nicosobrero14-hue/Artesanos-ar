package com.nsobrero.blogArtesanos.controller;

import com.nsobrero.blogArtesanos.dto.PiezaDTO;
import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.entity.Favorito;
import com.nsobrero.blogArtesanos.entity.Pieza;
import com.nsobrero.blogArtesanos.repository.ComentarioRepository;
import com.nsobrero.blogArtesanos.repository.FavoritoRepository;
import com.nsobrero.blogArtesanos.repository.MeGustaRepository;
import com.nsobrero.blogArtesanos.repository.PiezaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/*
 * Controller de favoritos del usuario.
 *
 * Endpoints:
 *  - POST /api/piezas/{id}/favorito → toggle (agregar / sacar)
 *  - GET /api/piezas/{id}/favorito → estado actual (boolean)
 *  - GET /api/mis-favoritos → listado del usuario logueado
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FavoritoController {

    private final FavoritoRepository favoritoRepository;
    private final PiezaRepository piezaRepository;
    private final MeGustaRepository meGustaRepository;
    private final ComentarioRepository comentarioRepository;

    @GetMapping("/piezas/{piezaId}/favorito")
    public ResponseEntity<Map<String, Boolean>> estado(
            @PathVariable Long piezaId,
            @AuthenticationPrincipal Artesano artesano) {
        boolean esFav = artesano != null
                && favoritoRepository.existsByPiezaIdAndAutorId(piezaId, artesano.getId());
        return ResponseEntity.ok(Map.of("esFavorito", esFav));
    }

    @PostMapping("/piezas/{piezaId}/favorito")
    @Transactional
    public ResponseEntity<Map<String, Boolean>> toggle(
            @PathVariable Long piezaId,
            @AuthenticationPrincipal Artesano artesano) {

        var existente = favoritoRepository.findByPiezaIdAndAutorId(piezaId, artesano.getId());
        if (existente.isPresent()) {
            favoritoRepository.delete(existente.get());
            return ResponseEntity.ok(Map.of("esFavorito", false));
        }

        Pieza pieza = piezaRepository.findById(piezaId)
                .orElseThrow(() -> new RuntimeException("Pieza no encontrada"));
        Favorito f = new Favorito();
        f.setPieza(pieza);
        f.setAutorId(artesano.getId());
        favoritoRepository.save(f);
        return ResponseEntity.ok(Map.of("esFavorito", true));
    }

    @GetMapping("/mis-favoritos")
    @Transactional
    public ResponseEntity<List<PiezaDTO>> misFavoritos(@AuthenticationPrincipal Artesano artesano) {
        List<PiezaDTO> dtos = favoritoRepository.findByAutorIdConPieza(artesano.getId()).stream()
                .map(f -> {
                    Pieza p = f.getPieza();
                    long likes = meGustaRepository.countByPiezaId(p.getId());
                    long comentarios = comentarioRepository.countByPiezaId(p.getId());
                    return new PiezaDTO(
                            p.getId(), p.getTitulo(), p.getDescripcion(),
                            p.getPrecio(), p.getEstado(), p.getOficio(),
                            p.getHorasTrabajo(), p.getCategoria(), p.getDestacada(), p.getFotos(),
                            p.getVideoUrl(),
                            p.getMateriales().stream().map(m -> m.getNombre()).toList(),
                            p.getFechaCreacion(),
                            p.getArtesano().getNombre(), p.getArtesano().getSlug(),
                            p.getArtesano().getId(),
                            p.getArtesano().getWhatsapp(),
                            likes, comentarios
                    );
                })
                .toList();
        return ResponseEntity.ok(dtos);
    }
}
