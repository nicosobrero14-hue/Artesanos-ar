package com.nsobrero.blogArtesanos.controller;

import com.nsobrero.blogArtesanos.dto.PiezaRankingDTO;
import com.nsobrero.blogArtesanos.entity.Pieza;
import com.nsobrero.blogArtesanos.repository.ComentarioRepository;
import com.nsobrero.blogArtesanos.repository.MeGustaRepository;
import com.nsobrero.blogArtesanos.repository.PiezaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/*
 * Ranking público de piezas por engagement.
 * Score = likes * 1 + comentarios * 2 (los comentarios cuestan más, valen más).
 *
 * Por ahora calculamos en Java sobre todas las piezas públicas. Con volumen alto
 * habría que precomputar el score en una columna y actualizar via trigger/scheduled.
 */
@RestController
@RequestMapping("/api/ranking")
@RequiredArgsConstructor
public class RankingController {

    private final PiezaRepository piezaRepository;
    private final MeGustaRepository meGustaRepository;
    private final ComentarioRepository comentarioRepository;

    private static final int LIMITE = 30;

    @GetMapping("/piezas")
    @Transactional
    public ResponseEntity<List<PiezaRankingDTO>> top() {
        List<Pieza> todas = piezaRepository.findTodasPublicas();

        // Calculamos score por pieza
        List<PiezaRankingDTO> conScore = todas.stream()
                .map(p -> {
                    long likes = meGustaRepository.countByPiezaId(p.getId());
                    long comentarios = comentarioRepository.countByPiezaId(p.getId());
                    long score = likes + comentarios * 2;
                    return new ScoreEntry(p, likes, comentarios, score);
                })
                .filter(e -> e.score > 0) // descartamos los que no tienen ningún engagement
                .sorted(Comparator.<ScoreEntry>comparingLong(e -> e.score).reversed())
                .limit(LIMITE)
                .map(this::toDTO)
                .toList();

        // Asignamos posición 1, 2, 3...
        AtomicInteger pos = new AtomicInteger(1);
        List<PiezaRankingDTO> conPosicion = conScore.stream()
                .map(d -> new PiezaRankingDTO(
                        pos.getAndIncrement(),
                        d.id(), d.titulo(), d.precio(), d.fotos(),
                        d.artesanoNombre(), d.artesanoSlug(), d.destacada(),
                        d.likes(), d.comentarios(), d.score()
                ))
                .toList();

        return ResponseEntity.ok(conPosicion);
    }

    private record ScoreEntry(Pieza pieza, long likes, long comentarios, long score) {}

    private PiezaRankingDTO toDTO(ScoreEntry e) {
        Pieza p = e.pieza;
        return new PiezaRankingDTO(
                0, // posición se asigna después
                p.getId(), p.getTitulo(), p.getPrecio(), p.getFotos(),
                p.getArtesano().getNombre(), p.getArtesano().getSlug(),
                p.getDestacada(), e.likes, e.comentarios, e.score
        );
    }
}
