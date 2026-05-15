package com.nsobrero.blogArtesanos.controller;

import com.nsobrero.blogArtesanos.dto.ArtesanoAdminDTO;
import com.nsobrero.blogArtesanos.dto.EventoDTO;
import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.enums.PlanArtesano;
import com.nsobrero.blogArtesanos.enums.RolUsuario;
import com.nsobrero.blogArtesanos.enums.TipoNotificacion;
import com.nsobrero.blogArtesanos.entity.Comentario;
import com.nsobrero.blogArtesanos.entity.Pieza;
import com.nsobrero.blogArtesanos.entity.Resena;
import com.nsobrero.blogArtesanos.repository.ArtesanoRepository;
import com.nsobrero.blogArtesanos.repository.ComentarioRepository;
import com.nsobrero.blogArtesanos.repository.FavoritoRepository;
import com.nsobrero.blogArtesanos.repository.LogAuditoriaRepository;
import com.nsobrero.blogArtesanos.repository.MeGustaRepository;
import com.nsobrero.blogArtesanos.repository.PiezaRepository;
import com.nsobrero.blogArtesanos.repository.ReporteRepository;
import com.nsobrero.blogArtesanos.repository.ResenaRepository;
import com.nsobrero.blogArtesanos.service.AuditoriaService;
import com.nsobrero.blogArtesanos.service.EventoService;
import com.nsobrero.blogArtesanos.service.NotificacionService;
import com.nsobrero.blogArtesanos.service.PlanService;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/*
 * Endpoints administrativos. Todos chequean rol == ADMIN.
 * No usamos email-check porque:
 *  - Se puede tener varios admins en el futuro
 *  - El rol vive en la base, es la fuente de verdad
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ArtesanoRepository artesanoRepository;
    private final PiezaRepository piezaRepository;
    private final ComentarioRepository comentarioRepository;
    private final ResenaRepository resenaRepository;
    private final MeGustaRepository meGustaRepository;
    private final FavoritoRepository favoritoRepository;
    private final ReporteRepository reporteRepository;
    private final LogAuditoriaRepository logAuditoriaRepository;
    private final PlanService planService;
    private final EventoService eventoService;
    private final NotificacionService notificacionService;
    private final AuditoriaService auditoriaService;

    private boolean noEsAdmin(Artesano user) {
        return user == null || user.getRol() != RolUsuario.ADMIN;
    }

    /*
     * Lista todos los artesanos del sistema con info admin.
     * Por defecto excluye al propio admin para que la tabla no se llene de uno mismo.
     */
    @GetMapping("/artesanos")
    public ResponseEntity<?> listar(@AuthenticationPrincipal Artesano admin) {
        if (noEsAdmin(admin)) return ResponseEntity.status(403).body(Map.of("message", "Solo admins"));

        List<ArtesanoAdminDTO> lista = artesanoRepository.findAll().stream()
                .map(a -> new ArtesanoAdminDTO(
                        a.getId(), a.getNombre(), a.getEmail(), a.getSlug(),
                        a.getPlan() != null ? a.getPlan().name() : "GRATIS",
                        planService.isPremium(a),
                        a.getFechaExpiracionPlan(),
                        a.getRol() != null ? a.getRol().name() : "USER",
                        a.getVerificado(), a.getActivo(),
                        a.getFechaRegistro(),
                        piezaRepository.countByArtesanoId(a.getId())
                ))
                .toList();

        return ResponseEntity.ok(lista);
    }

    /*
     * Activar Premium a un artesano por X meses.
     * Si ya es premium y todavía no expiró, suma meses (no resetea desde hoy).
     */
    @PostMapping("/artesanos/{id}/upgrade")
    public ResponseEntity<?> upgrade(@PathVariable Long id,
                                     @RequestBody Map<String, Object> body,
                                     @AuthenticationPrincipal Artesano admin) {
        if (noEsAdmin(admin)) return ResponseEntity.status(403).body(Map.of("message", "Solo admins"));

        Number mesesNum = (Number) body.getOrDefault("meses", 1);
        int meses = mesesNum.intValue();
        if (meses < 1 || meses > 60) {
            return ResponseEntity.badRequest().body(Map.of("message", "Meses entre 1 y 60"));
        }

        Artesano a = artesanoRepository.findById(id)
                .orElse(null);
        if (a == null) return ResponseEntity.status(404).body(Map.of("message", "Artesano no encontrado"));

        LocalDate base = (a.getFechaExpiracionPlan() != null
                && a.getFechaExpiracionPlan().isAfter(LocalDate.now()))
                ? a.getFechaExpiracionPlan()
                : LocalDate.now();

        a.setPlan(PlanArtesano.PREMIUM);
        a.setFechaExpiracionPlan(base.plusMonths(meses));
        artesanoRepository.save(a);

        notificacionService.notificar(
            a.getId(), TipoNotificacion.PLAN_UPGRADE,
            "🎉 ¡Bienvenido a Premium! Tu plan está activo hasta el "
                + a.getFechaExpiracionPlan() + ".",
            "/panel"
        );

        return ResponseEntity.ok(Map.of(
            "id", a.getId(),
            "email", a.getEmail(),
            "plan", a.getPlan().name(),
            "expiraEl", a.getFechaExpiracionPlan().toString()
        ));
    }

    /*
     * Bajar a GRATIS. No borra nada — solo cambia el plan y limpia la fecha.
     */
    @PostMapping("/artesanos/{id}/downgrade")
    public ResponseEntity<?> downgrade(@PathVariable Long id,
                                       @AuthenticationPrincipal Artesano admin) {
        if (noEsAdmin(admin)) return ResponseEntity.status(403).body(Map.of("message", "Solo admins"));

        Artesano a = artesanoRepository.findById(id)
                .orElse(null);
        if (a == null) return ResponseEntity.status(404).body(Map.of("message", "Artesano no encontrado"));

        // No nos dejamos a nosotros mismos sin premium
        if (a.getRol() == RolUsuario.ADMIN) {
            return ResponseEntity.badRequest().body(Map.of("message", "No se puede dar de baja a un admin"));
        }

        a.setPlan(PlanArtesano.GRATIS);
        a.setFechaExpiracionPlan(null);
        artesanoRepository.save(a);

        return ResponseEntity.ok(Map.of("id", a.getId(), "plan", "GRATIS"));
    }

    /*
     * Activar/desactivar cuenta. Útil si alguien hace abuso o spam.
     * Las cuentas con activo=false no pueden loguear (UserDetails.isEnabled).
     */
    @PostMapping("/artesanos/{id}/toggle-activo")
    public ResponseEntity<?> toggleActivo(@PathVariable Long id,
                                          @RequestBody(required = false) Map<String, String> body,
                                          @AuthenticationPrincipal Artesano admin) {
        if (noEsAdmin(admin)) return ResponseEntity.status(403).body(Map.of("message", "Solo admins"));

        Artesano a = artesanoRepository.findById(id)
                .orElse(null);
        if (a == null) return ResponseEntity.status(404).body(Map.of("message", "Artesano no encontrado"));

        if (a.getRol() == RolUsuario.ADMIN) {
            return ResponseEntity.badRequest().body(Map.of("message", "No se puede deshabilitar a un admin"));
        }

        boolean nuevoEstado = !a.getActivo();
        a.setActivo(nuevoEstado);
        // Si lo suspendemos, guardamos el motivo. Si lo reactivamos, lo limpiamos.
        if (!nuevoEstado) {
            String motivo = body != null ? body.get("motivo") : null;
            a.setMotivoSuspension(motivo != null && !motivo.isBlank() ? motivo : "Violación de los términos");
        } else {
            a.setMotivoSuspension(null);
        }
        artesanoRepository.save(a);

        return ResponseEntity.ok(Map.of(
            "id", a.getId(),
            "activo", a.getActivo(),
            "motivoSuspension", a.getMotivoSuspension() == null ? "" : a.getMotivoSuspension()
        ));
    }

    /*
     * Toggle "ocultar" pieza: la oculta del público sin borrarla. Notifica al dueño.
     * Útil para piezas inapropiadas que conviene preservar para investigación.
     *
     * Body: { "motivo": "razón visible para el artesano" }
     */
    @PostMapping("/piezas/{id}/toggle-oculta")
    @Transactional
    public ResponseEntity<?> toggleOcultaPieza(@PathVariable Long id,
                                               @RequestBody(required = false) Map<String, String> body,
                                               @AuthenticationPrincipal Artesano admin) {
        if (noEsAdmin(admin)) return ResponseEntity.status(403).body(Map.of("message", "Solo admins"));

        com.nsobrero.blogArtesanos.entity.Pieza p = piezaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pieza no encontrada"));
        boolean nuevoEstado = !Boolean.TRUE.equals(p.getOculta());
        String motivo = body != null ? body.getOrDefault("motivo", "") : "";
        p.setOculta(nuevoEstado);
        p.setMotivoOculta(nuevoEstado ? motivo : null);
        piezaRepository.save(p);

        // Notificar al dueño
        notificacionService.notificar(
            p.getArtesano().getId(),
            com.nsobrero.blogArtesanos.enums.TipoNotificacion.GENERICO,
            nuevoEstado
                ? "Tu pieza '" + p.getTitulo() + "' fue ocultada por moderación. Motivo: " + motivo
                : "Tu pieza '" + p.getTitulo() + "' volvió a ser visible.",
            "/panel/piezas"
        );

        auditoriaService.log(admin,
            nuevoEstado ? "OCULTAR_PIEZA" : "MOSTRAR_PIEZA",
            "PIEZA", id,
            "titulo=" + p.getTitulo() + (motivo.isEmpty() ? "" : " · motivo=" + motivo));

        return ResponseEntity.ok(Map.of(
            "id", p.getId(), "oculta", p.getOculta(),
            "motivo", p.getMotivoOculta() == null ? "" : p.getMotivoOculta()
        ));
    }

    /*
     * Lista todas las piezas para el panel admin (incluso ocultas).
     * Útil para tener una vista global de moderación.
     */
    @GetMapping("/piezas")
    @Transactional
    public ResponseEntity<?> listarTodasPiezas(@AuthenticationPrincipal Artesano admin) {
        if (noEsAdmin(admin)) return ResponseEntity.status(403).body(Map.of("message", "Solo admins"));
        var lista = piezaRepository.findAll().stream()
                .filter(p -> p.getArtesano().getRol() != com.nsobrero.blogArtesanos.enums.RolUsuario.ADMIN)
                .map(p -> Map.of(
                    "id", p.getId(),
                    "titulo", p.getTitulo(),
                    "estado", p.getEstado().name(),
                    "oculta", Boolean.TRUE.equals(p.getOculta()),
                    "motivoOculta", p.getMotivoOculta() == null ? "" : p.getMotivoOculta(),
                    "destacada", Boolean.TRUE.equals(p.getDestacada()),
                    "precio", p.getPrecio(),
                    "fotoPrincipal", p.getFotos().isEmpty() ? "" : p.getFotos().get(0),
                    "artesanoNombre", p.getArtesano().getNombre(),
                    "artesanoSlug", p.getArtesano().getSlug()
                ))
                .toList();
        return ResponseEntity.ok(lista);
    }

    /*
     * Resumen de pendientes para el dashboard admin.
     * Permite mostrar badges rojos sobre las pestañas con números.
     */
    @GetMapping("/resumen-pendientes")
    public ResponseEntity<?> resumenPendientes(@AuthenticationPrincipal Artesano admin) {
        if (noEsAdmin(admin)) return ResponseEntity.status(403).body(Map.of("message", "Solo admins"));
        long eventosP = eventoService.listarPendientes(admin.getId()).size();
        long reportesP = reporteRepository.countByResueltoFalse();
        return ResponseEntity.ok(Map.of(
            "eventos", eventosP,
            "reportes", reportesP,
            "total", eventosP + reportesP
        ));
    }

    // ── Moderación de eventos ──────────────────────────────────────────────

    @GetMapping("/eventos")
    public ResponseEntity<?> listarEventos(@AuthenticationPrincipal Artesano admin) {
        if (noEsAdmin(admin)) return ResponseEntity.status(403).body(Map.of("message", "Solo admins"));
        return ResponseEntity.ok(eventoService.listarTodos(admin.getId()));
    }

    @GetMapping("/eventos/pendientes")
    public ResponseEntity<?> pendientes(@AuthenticationPrincipal Artesano admin) {
        if (noEsAdmin(admin)) return ResponseEntity.status(403).body(Map.of("message", "Solo admins"));
        return ResponseEntity.ok(eventoService.listarPendientes(admin.getId()));
    }

    @PostMapping("/eventos/{id}/aprobar")
    public ResponseEntity<?> aprobarEvento(@PathVariable Long id,
                                           @AuthenticationPrincipal Artesano admin) {
        if (noEsAdmin(admin)) return ResponseEntity.status(403).body(Map.of("message", "Solo admins"));
        EventoDTO dto = eventoService.aprobar(id, admin.getId());

        // Notificar al autor del evento
        notificacionService.notificar(
            dto.autorId(), TipoNotificacion.EVENTO_APROBADO,
            "Tu evento '" + dto.nombre() + "' fue aprobado y ya es público",
            "/eventos"
        );

        return ResponseEntity.ok(dto);
    }

    /*
     * Rechazar = eliminar. Si en el futuro queremos guardar histórico,
     * agregamos un campo "rechazado" en lugar de borrar.
     */
    @DeleteMapping("/eventos/{id}")
    public ResponseEntity<?> eliminarEvento(@PathVariable Long id,
                                            @AuthenticationPrincipal Artesano admin) {
        if (noEsAdmin(admin)) return ResponseEntity.status(403).body(Map.of("message", "Solo admins"));
        eventoService.eliminar(id, admin);
        auditoriaService.log(admin, "ELIMINAR_EVENTO", "EVENTO", id, null);
        return ResponseEntity.noContent().build();
    }

    // ── Moderación de contenido ────────────────────────────────────────────

    @DeleteMapping("/comentarios/{id}")
    @Transactional
    public ResponseEntity<?> eliminarComentario(@PathVariable Long id,
                                                @RequestParam(required = false) String motivo,
                                                @AuthenticationPrincipal Artesano admin) {
        if (noEsAdmin(admin)) return ResponseEntity.status(403).body(Map.of("message", "Solo admins"));
        Comentario c = comentarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comentario no encontrado"));
        String autor = c.getAutorNombre();
        comentarioRepository.delete(c);
        auditoriaService.log(admin, "ELIMINAR_COMENTARIO", "COMENTARIO", id,
            "autor=" + autor + (motivo != null ? " · motivo=" + motivo : ""));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/resenas/{id}")
    @Transactional
    public ResponseEntity<?> eliminarResena(@PathVariable Long id,
                                            @RequestParam(required = false) String motivo,
                                            @AuthenticationPrincipal Artesano admin) {
        if (noEsAdmin(admin)) return ResponseEntity.status(403).body(Map.of("message", "Solo admins"));
        Resena r = resenaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reseña no encontrada"));
        String autor = r.getAutorNombre();
        resenaRepository.delete(r);
        auditoriaService.log(admin, "ELIMINAR_RESENA", "RESENA", id,
            "autor=" + autor + (motivo != null ? " · motivo=" + motivo : ""));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/piezas/{id}/fotos/{indice}")
    @Transactional
    public ResponseEntity<?> eliminarFotoPieza(@PathVariable Long id,
                                               @PathVariable int indice,
                                               @AuthenticationPrincipal Artesano admin) {
        if (noEsAdmin(admin)) return ResponseEntity.status(403).body(Map.of("message", "Solo admins"));
        Pieza p = piezaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pieza no encontrada"));
        if (indice < 0 || indice >= p.getFotos().size()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Índice inválido"));
        }
        p.getFotos().remove(indice);
        piezaRepository.save(p);
        auditoriaService.log(admin, "ELIMINAR_FOTO", "PIEZA", id, "indice=" + indice);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/piezas/{id}")
    @Transactional
    public ResponseEntity<?> eliminarPieza(@PathVariable Long id,
                                           @RequestParam(required = false) String motivo,
                                           @AuthenticationPrincipal Artesano admin) {
        if (noEsAdmin(admin)) return ResponseEntity.status(403).body(Map.of("message", "Solo admins"));
        Pieza p = piezaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pieza no encontrada"));
        String titulo = p.getTitulo();
        Long artesanoId = p.getArtesano().getId();

        // Borrar todas las dependencias antes para evitar FK constraint violation
        meGustaRepository.deleteByPiezaId(id);
        favoritoRepository.deleteByPiezaId(id);
        comentarioRepository.deleteByPiezaId(id);

        piezaRepository.delete(p);
        auditoriaService.log(admin, "ELIMINAR_PIEZA", "PIEZA", id,
            "titulo=" + titulo + (motivo != null ? " · motivo=" + motivo : ""));

        // Avisar al autor de la pieza
        notificacionService.notificar(
            artesanoId, TipoNotificacion.GENERICO,
            "Tu pieza '" + titulo + "' fue eliminada por la moderación" +
                (motivo != null ? " (motivo: " + motivo + ")" : ""),
            "/panel/piezas"
        );
        return ResponseEntity.noContent().build();
    }

    /*
     * Ver últimos 100 registros del log de auditoría.
     */
    @GetMapping("/auditoria")
    public ResponseEntity<?> auditoria(@AuthenticationPrincipal Artesano admin) {
        if (noEsAdmin(admin)) return ResponseEntity.status(403).body(Map.of("message", "Solo admins"));
        return ResponseEntity.ok(logAuditoriaRepository.findTop100ByOrderByFechaDesc());
    }
}
