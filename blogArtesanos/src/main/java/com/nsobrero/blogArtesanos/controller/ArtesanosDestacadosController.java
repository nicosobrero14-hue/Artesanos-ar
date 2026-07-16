package com.nsobrero.blogArtesanos.controller;

import com.nsobrero.blogArtesanos.dto.ArtesanoPublicoDTO;
import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.enums.RolUsuario;
import com.nsobrero.blogArtesanos.repository.ArtesanoRepository;
import com.nsobrero.blogArtesanos.repository.ComentarioRepository;
import com.nsobrero.blogArtesanos.repository.MeGustaRepository;
import com.nsobrero.blogArtesanos.repository.PiezaRepository;
import com.nsobrero.blogArtesanos.repository.ResenaRepository;
import com.nsobrero.blogArtesanos.service.PlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

/*
 * "Artesanos destacados del mes" — calculado en base a engagement total.
 *
 * Score por artesano:
 *  - +3 por cada like en sus piezas
 *  - +5 por cada comentario en sus piezas
 *  - +10 por cada reseña recibida
 *  - +bonus si es premium activo (rank ligeramente arriba para diferenciar plan)
 *
 * Sortea por score, toma top N (default 6), después aleatoriza ligeramente
 * dentro del grupo top para que rote entre quienes empatan en engagement.
 *
 * Si hay menos de N artesanos con score>0, completa con artesanos sin engagement
 * (los más nuevos primero) para que la sección no quede semi-vacía.
 */
@RestController
@RequestMapping("/api/home")
@RequiredArgsConstructor
public class ArtesanosDestacadosController {

    private final ArtesanoRepository artesanoRepository;
    private final PiezaRepository piezaRepository;
    private final MeGustaRepository meGustaRepository;
    private final ComentarioRepository comentarioRepository;
    private final ResenaRepository resenaRepository;
    private final PlanService planService;

    private static final int CANTIDAD = 6;
    private static final int BONUS_PREMIUM = 5;

    @GetMapping("/artesanos-destacados")
    @Transactional
    public ResponseEntity<List<ArtesanoPublicoDTO>> destacados() {
        List<Artesano> elegibles = artesanoRepository.findAll().stream()
                .filter(Artesano::getActivo)
                .filter(a -> a.getRol() != RolUsuario.ADMIN)
                .toList();

        /*
         * Score por artesano con 3 queries agrupadas (likes, comentarios y reseñas
         * por artesano). Antes se iteraba artesano por artesano y pieza por pieza
         * con counts individuales — cientos de queries por request, que era la
         * causa principal de la lentitud del home.
         */
        Map<Long, Long> likesPorArtesano = aMapa(meGustaRepository.countAgrupadoPorArtesano());
        Map<Long, Long> comentariosPorArtesano = aMapa(comentarioRepository.countAgrupadoPorArtesano());
        Map<Long, Long> resenasPorArtesano = aMapa(resenaRepository.countAgrupadoPorArtesano());

        Map<Long, Long> scorePorArtesano = new HashMap<>();
        for (Artesano a : elegibles) {
            long score = likesPorArtesano.getOrDefault(a.getId(), 0L) * 3
                    + comentariosPorArtesano.getOrDefault(a.getId(), 0L) * 5
                    + resenasPorArtesano.getOrDefault(a.getId(), 0L) * 10;
            if (planService.isPremium(a)) score += BONUS_PREMIUM;
            scorePorArtesano.put(a.getId(), score);
        }

        // Separamos en dos grupos: los que tienen engagement, y los que no
        List<Artesano> conEngagement = elegibles.stream()
                .filter(a -> scorePorArtesano.get(a.getId()) > 0)
                .sorted(Comparator.<Artesano>comparingLong(a -> scorePorArtesano.get(a.getId())).reversed())
                .collect(Collectors.toList());

        // Aleatoriza ligeramente dentro de los primeros 12 (más-o-menos empatados)
        // para que la lista rote pero los top sigan siendo top
        if (conEngagement.size() > 3) {
            int chunkSize = Math.min(12, conEngagement.size());
            List<Artesano> chunk = new ArrayList<>(conEngagement.subList(0, chunkSize));
            Collections.shuffle(chunk);
            // Reemplazamos el inicio con la versión shuffleada
            for (int i = 0; i < chunkSize; i++) conEngagement.set(i, chunk.get(i));
        }

        List<Artesano> resultado = new ArrayList<>(conEngagement);

        // Si no llegamos a CANTIDAD, completamos con los más nuevos sin engagement
        if (resultado.size() < CANTIDAD) {
            List<Artesano> sinEngagement = elegibles.stream()
                    .filter(a -> scorePorArtesano.get(a.getId()) == 0)
                    .sorted(Comparator.comparing(Artesano::getFechaRegistro,
                            Comparator.nullsLast(Comparator.reverseOrder())))
                    .limit(CANTIDAD - resultado.size())
                    .toList();
            resultado.addAll(sinEngagement);
        }

        List<ArtesanoPublicoDTO> dtos = resultado.stream()
                .limit(CANTIDAD)
                .map(this::toPublicoDTO)
                .toList();

        return ResponseEntity.ok(dtos);
    }

    /*
     * Artesano destacado de la semana.
     *
     * Rota automáticamente cada semana SIN necesidad de un cron: el índice se
     * calcula con (año ISO * 53 + semana ISO) % cantidadDeArtesanos. Es
     * determinístico — todo el mundo ve el mismo artesano durante la semana,
     * y cambia solo al pasar a la semana siguiente.
     *
     * Ordenamos por id para que la selección sea estable.
     */
    @GetMapping("/artesano-semana")
    @Transactional
    public ResponseEntity<ArtesanoPublicoDTO> artesanoSemana() {
        // 1 query con los ids de artesanos que tienen piezas (antes: 1 count por artesano)
        var idsConPiezas = new java.util.HashSet<>(piezaRepository.findArtesanoIdsConPiezas());

        List<Artesano> elegibles = artesanoRepository.findAll().stream()
                .filter(Artesano::getActivo)
                .filter(a -> a.getRol() != RolUsuario.ADMIN)
                // Solo artesanos con al menos 1 pieza — no destacamos catálogos vacíos
                .filter(a -> idsConPiezas.contains(a.getId()))
                .sorted(Comparator.comparing(Artesano::getId))
                .toList();

        if (elegibles.isEmpty()) return ResponseEntity.noContent().build();

        LocalDate hoy = LocalDate.now();
        int semana = hoy.get(WeekFields.ISO.weekOfWeekBasedYear());
        int anio = hoy.get(WeekFields.ISO.weekBasedYear());
        int idx = Math.floorMod(anio * 53 + semana, elegibles.size());

        return ResponseEntity.ok(toPublicoDTO(elegibles.get(idx)));
    }

    /* Convierte el resultado de una query agrupada [id, count] en un mapa id → count */
    private static Map<Long, Long> aMapa(List<Object[]> filas) {
        Map<Long, Long> mapa = new HashMap<>();
        for (Object[] fila : filas) {
            mapa.put((Long) fila[0], (Long) fila[1]);
        }
        return mapa;
    }

    private ArtesanoPublicoDTO toPublicoDTO(Artesano a) {
        return new ArtesanoPublicoDTO(
                a.getId(), a.getNombre(), a.getSlug(),
                a.getBio(), a.getAvatarUrl(), a.getUbicacion(),
                a.getRubros(), a.getInstagram(), a.getWhatsapp(),
                planService.isPremium(a)
        );
    }
}
