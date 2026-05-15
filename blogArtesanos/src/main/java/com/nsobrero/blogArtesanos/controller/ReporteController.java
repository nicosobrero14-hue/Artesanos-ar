package com.nsobrero.blogArtesanos.controller;

import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.entity.Reporte;
import com.nsobrero.blogArtesanos.enums.RolUsuario;
import com.nsobrero.blogArtesanos.enums.TipoReporte;
import com.nsobrero.blogArtesanos.repository.ReporteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/*
 * Reportes de contenido inapropiado.
 *
 *  - POST /api/reportes: cualquier usuario logueado puede crear
 *  - GET /api/admin/reportes: admin lista pendientes
 *  - POST /api/admin/reportes/{id}/resolver: admin marca como resuelto
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReporteController {

    private final ReporteRepository reporteRepository;

    @PostMapping("/reportes")
    @Transactional
    public ResponseEntity<?> crear(@RequestBody Map<String, String> body,
                                   @AuthenticationPrincipal Artesano usuario) {
        String tipoStr = body.get("tipo");
        String objetoIdStr = body.get("objetoId");
        String motivo = body.get("motivo");
        String detalle = body.get("detalle");
        String url = body.get("url");

        if (tipoStr == null || objetoIdStr == null || motivo == null || motivo.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Faltan datos obligatorios"));
        }

        TipoReporte tipo;
        try {
            tipo = TipoReporte.valueOf(tipoStr);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tipo inválido"));
        }

        Reporte r = new Reporte();
        r.setTipo(tipo);
        r.setObjetoId(Long.parseLong(objetoIdStr));
        r.setMotivo(motivo.length() > 500 ? motivo.substring(0, 500) : motivo);
        r.setDetalle(detalle);
        r.setReporteUrl(url);
        r.setAutorId(usuario.getId());
        r.setAutorNombre(usuario.getNombre());
        reporteRepository.save(r);

        return ResponseEntity.ok(Map.of("message", "Reporte enviado. Lo vamos a revisar."));
    }

    @GetMapping("/admin/reportes")
    public ResponseEntity<?> listarAdmin(@RequestParam(defaultValue = "pendientes") String filtro,
                                         @AuthenticationPrincipal Artesano admin) {
        if (admin.getRol() != RolUsuario.ADMIN) return ResponseEntity.status(403).build();
        List<Reporte> lista = "todos".equals(filtro)
                ? reporteRepository.findAllByOrderByFechaDesc()
                : reporteRepository.findByResueltoFalseOrderByFechaDesc();
        return ResponseEntity.ok(lista);
    }

    @PostMapping("/admin/reportes/{id}/resolver")
    @Transactional
    public ResponseEntity<?> resolver(@PathVariable Long id,
                                      @RequestBody(required = false) Map<String, String> body,
                                      @AuthenticationPrincipal Artesano admin) {
        if (admin.getRol() != RolUsuario.ADMIN) return ResponseEntity.status(403).build();
        Reporte r = reporteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reporte no encontrado"));
        r.setResuelto(true);
        r.setResueltoEl(LocalDateTime.now());
        if (body != null && body.containsKey("nota")) r.setNotaAdmin(body.get("nota"));
        reporteRepository.save(r);
        return ResponseEntity.ok(r);
    }
}
