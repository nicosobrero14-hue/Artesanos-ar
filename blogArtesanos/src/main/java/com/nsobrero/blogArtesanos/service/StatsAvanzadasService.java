package com.nsobrero.blogArtesanos.service;

import com.nsobrero.blogArtesanos.dto.StatsAvanzadasDTO;
import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.entity.Pieza;
import com.nsobrero.blogArtesanos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StatsAvanzadasService {

    private final PiezaRepository piezaRepository;
    private final MeGustaRepository meGustaRepository;
    private final ComentarioRepository comentarioRepository;
    private final ResenaRepository resenaRepository;
    private final ContactoRepository contactoRepository;
    private final EventoRepository eventoRepository;
    private final PlanService planService;
    private final ArtesanoRepository artesanoRepository;

    @Transactional
    public StatsAvanzadasDTO obtener(Long artesanoId) {
        Artesano a = artesanoRepository.findById(artesanoId)
                .orElseThrow(() -> new RuntimeException("Artesano no encontrado"));
        if (!planService.isPremium(a)) {
            throw new RuntimeException("Estadísticas avanzadas son una feature Premium");
        }

        List<Pieza> piezas = piezaRepository.findByArtesanoId(artesanoId);

        // Score por pieza (likes + comentarios * 2)
        List<StatsAvanzadasDTO.PiezaTopDTO> conScore = piezas.stream()
                .map(p -> {
                    long likes = meGustaRepository.countByPiezaId(p.getId());
                    long comentarios = comentarioRepository.countByPiezaId(p.getId());
                    long score = likes + comentarios * 2;
                    return new StatsAvanzadasDTO.PiezaTopDTO(
                        p.getId(), p.getTitulo(), likes, comentarios, score
                    );
                })
                .sorted(Comparator.<StatsAvanzadasDTO.PiezaTopDTO>comparingLong(p -> p.score()).reversed())
                .toList();

        long totalLikes = conScore.stream().mapToLong(p -> p.likes()).sum();
        long totalComentarios = conScore.stream().mapToLong(p -> p.comentarios()).sum();

        var resenas = resenaRepository.findByArtesanoIdOrderByFechaDesc(artesanoId);
        Double promedio = resenas.isEmpty() ? null
                : Math.round(resenas.stream().mapToInt(r -> r.getCalificacion()).average().orElse(0) * 10.0) / 10.0;

        var eventosMios = eventoRepository.findByAutorId(artesanoId);
        long totalParticipantes = eventosMios.stream()
                .mapToLong(e -> e.getParticipantes().size())
                .sum();

        StatsAvanzadasDTO.PiezaTopDTO top = conScore.isEmpty() ? null : conScore.get(0);
        List<StatsAvanzadasDTO.PiezaTopDTO> top5 = conScore.stream()
                .filter(p -> p.score() > 0)
                .limit(5).toList();

        return new StatsAvanzadasDTO(
            totalLikes,
            totalComentarios,
            resenas.size(),
            promedio,
            contactoRepository.findByArtesanoId(artesanoId).size(),
            eventosMios.size(),
            totalParticipantes,
            top,
            top5
        );
    }
}
