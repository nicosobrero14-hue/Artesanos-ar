package com.nsobrero.blogArtesanos.service;

import com.nsobrero.blogArtesanos.auth.EventoRequest;
import com.nsobrero.blogArtesanos.dto.EventoDTO;
import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.entity.Evento;
import com.nsobrero.blogArtesanos.enums.RolUsuario;
import com.nsobrero.blogArtesanos.repository.ArtesanoRepository;
import com.nsobrero.blogArtesanos.repository.EventoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventoService {

    private final EventoRepository eventoRepository;
    private final ArtesanoRepository artesanoRepository;
    private final PlanService planService;

    /*
     * Lista pública: solo aprobados que todavía no terminaron.
     * `usuarioId` puede ser null (visitante anónimo) — afecta solo a los flags soyAutor/soyParticipante.
     */
    @Transactional
    public List<EventoDTO> listarProximosAprobados(Long usuarioId) {
        return eventoRepository.findProximosAprobados(LocalDate.now()).stream()
                .map(e -> toDTO(e, usuarioId))
                .toList();
    }

    /*
     * Crear evento. Solo premium puede crear (lo decidimos como ventaja del plan).
     * Queda aprobado=false esperando moderación del admin.
     * Auto-sumamos al autor como participante.
     */
    @Transactional
    public EventoDTO crear(EventoRequest req, Long autorId) {
        Artesano autor = artesanoRepository.findById(autorId)
                .orElseThrow(() -> new RuntimeException("Artesano no encontrado"));

        if (!planService.isPremium(autor)) {
            throw new RuntimeException(
                "Crear eventos es una feature Premium. Pasate a Premium para publicar tu primera feria."
            );
        }

        if (req.fechaFin().isBefore(req.fechaInicio())) {
            throw new RuntimeException("La fecha de fin no puede ser anterior a la de inicio");
        }
        if (req.fechaInicio().isBefore(LocalDate.now().minusDays(1))) {
            throw new RuntimeException("La fecha de inicio no puede ser en el pasado");
        }

        Evento e = new Evento();
        e.setNombre(req.nombre());
        e.setDescripcion(req.descripcion());
        e.setFechaInicio(req.fechaInicio());
        e.setFechaFin(req.fechaFin());
        e.setUbicacion(req.ubicacion());
        e.setUrlMaps(req.urlMaps());
        e.setAutor(autor);
        e.getParticipantes().add(autor);

        return toDTO(eventoRepository.save(e), autorId);
    }

    /*
     * Editar. Solo el autor puede.
     * Si edita campos clave (fechas, ubicación), volvemos a aprobado=false para
     * que el admin lo revise de nuevo. Si solo cambió descripción, mantenemos.
     * Por simplicidad: cualquier edit lo manda a re-aprobación.
     */
    @Transactional
    public EventoDTO editar(Long id, EventoRequest req, Long autorId) {
        Evento e = eventoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evento no encontrado"));

        if (!e.getAutor().getId().equals(autorId)) {
            throw new RuntimeException("Solo el autor puede editar este evento");
        }

        e.setNombre(req.nombre());
        e.setDescripcion(req.descripcion());
        e.setFechaInicio(req.fechaInicio());
        e.setFechaFin(req.fechaFin());
        e.setUbicacion(req.ubicacion());
        e.setUrlMaps(req.urlMaps());
        // Vuelve a moderación
        e.setAprobado(false);
        e.setAprobadoEl(null);

        return toDTO(eventoRepository.save(e), autorId);
    }

    /*
     * Eliminar. El autor o el admin pueden borrar.
     */
    @Transactional
    public void eliminar(Long id, Artesano usuario) {
        Evento e = eventoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evento no encontrado"));

        boolean esAutor = e.getAutor().getId().equals(usuario.getId());
        boolean esAdmin = usuario.getRol() == RolUsuario.ADMIN;

        if (!esAutor && !esAdmin) {
            throw new RuntimeException("Sin permiso para eliminar este evento");
        }

        eventoRepository.delete(e);
    }

    /*
     * Sumarme al evento (toggle): si ya estoy, me saco; si no, me agrego.
     * Solo se permite si el evento está aprobado.
     */
    @Transactional
    public EventoDTO toggleParticipacion(Long eventoId, Long artesanoId) {
        Evento e = eventoRepository.findById(eventoId)
                .orElseThrow(() -> new RuntimeException("Evento no encontrado"));

        if (!Boolean.TRUE.equals(e.getAprobado())) {
            throw new RuntimeException("Este evento todavía no fue aprobado");
        }

        Artesano art = artesanoRepository.findById(artesanoId)
                .orElseThrow(() -> new RuntimeException("Artesano no encontrado"));

        boolean yaParticipa = e.getParticipantes().stream()
                .anyMatch(a -> a.getId().equals(artesanoId));

        if (yaParticipa) {
            e.getParticipantes().removeIf(a -> a.getId().equals(artesanoId));
        } else {
            e.getParticipantes().add(art);
        }

        return toDTO(eventoRepository.save(e), artesanoId);
    }

    /*
     * Mis eventos creados (incluyendo pendientes y rechazados).
     */
    @Transactional
    public List<EventoDTO> misEventos(Long autorId) {
        return eventoRepository.findByAutorId(autorId).stream()
                .map(e -> toDTO(e, autorId))
                .toList();
    }

    // ── Admin ──────────────────────────────────────────────────────────────

    @Transactional
    public List<EventoDTO> listarTodos(Long usuarioId) {
        return eventoRepository.findAllConAutor().stream()
                .map(e -> toDTO(e, usuarioId))
                .toList();
    }

    @Transactional
    public List<EventoDTO> listarPendientes(Long usuarioId) {
        return eventoRepository.findPendientes().stream()
                .map(e -> toDTO(e, usuarioId))
                .toList();
    }

    @Transactional
    public EventoDTO aprobar(Long id, Long adminId) {
        Evento e = eventoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evento no encontrado"));
        e.setAprobado(true);
        e.setAprobadoEl(LocalDateTime.now());
        return toDTO(eventoRepository.save(e), adminId);
    }

    // ── Mapper ─────────────────────────────────────────────────────────────

    private EventoDTO toDTO(Evento e, Long usuarioId) {
        var participantes = e.getParticipantes().stream()
                .map(a -> new EventoDTO.ParticipanteDTO(
                    a.getId(), a.getNombre(), a.getSlug(), a.getAvatarUrl()
                ))
                .toList();

        boolean soyAutor = usuarioId != null && e.getAutor().getId().equals(usuarioId);
        boolean soyParticipante = usuarioId != null
                && e.getParticipantes().stream().anyMatch(a -> a.getId().equals(usuarioId));

        return new EventoDTO(
            e.getId(), e.getNombre(), e.getDescripcion(),
            e.getFechaInicio(), e.getFechaFin(),
            e.getUbicacion(), e.getUrlMaps(),
            e.getFechaCreacion(), e.getAprobado(),
            e.getAutor().getNombre(), e.getAutor().getSlug(), e.getAutor().getId(),
            participantes.size(), participantes,
            soyAutor, soyParticipante
        );
    }
}
