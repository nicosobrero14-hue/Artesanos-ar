package com.nsobrero.blogArtesanos.controller;

import com.nsobrero.blogArtesanos.dto.CuponDTO;
import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.entity.Cupon;
import com.nsobrero.blogArtesanos.entity.Pieza;
import com.nsobrero.blogArtesanos.repository.ArtesanoRepository;
import com.nsobrero.blogArtesanos.repository.CuponRepository;
import com.nsobrero.blogArtesanos.repository.PiezaRepository;
import com.nsobrero.blogArtesanos.service.PlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CuponController {

    private final CuponRepository cuponRepository;
    private final ArtesanoRepository artesanoRepository;
    private final PiezaRepository piezaRepository;
    private final PlanService planService;

    /*
     * Cupones globales vigentes del artesano (los que aplican a TODAS sus piezas).
     * Se muestran en una sección general del catálogo público.
     */
    @GetMapping("/artesanos/{slug}/cupones")
    public ResponseEntity<List<CuponPublicoDTO>> publicosGlobales(@PathVariable String slug) {
        List<CuponPublicoDTO> dtos = cuponRepository.findGlobalesVigentesPorSlug(slug, LocalDate.now()).stream()
                .map(c -> new CuponPublicoDTO(
                    c.getCodigo(), c.getPorcentaje(),
                    c.getDescripcion(), c.getFechaVencimiento()
                ))
                .toList();
        return ResponseEntity.ok(dtos);
    }

    /*
     * Cupones vigentes que aplican a una pieza específica.
     * Incluye los globales del artesano + los asociados directamente a esta pieza.
     * El frontend usa esto para mostrar el precio descontado en la card de la pieza.
     */
    @GetMapping("/piezas/{piezaId}/cupones")
    @Transactional
    public ResponseEntity<List<CuponPublicoDTO>> cuponesParaPieza(@PathVariable Long piezaId) {
        Pieza p = piezaRepository.findById(piezaId).orElse(null);
        if (p == null) return ResponseEntity.ok(List.of());

        LocalDate hoy = LocalDate.now();
        Long artesanoId = p.getArtesano().getId();

        // Combinamos cupones globales del artesano + los asociados a esta pieza
        var globales = cuponRepository.findGlobalesArtesano(artesanoId, hoy);
        var asociados = cuponRepository.findAsociadosAPieza(piezaId, hoy);

        // Deduplicar por id por si un mismo cupón apareciera en ambas listas
        var idsVistos = new java.util.HashSet<Long>();
        List<CuponPublicoDTO> dtos = java.util.stream.Stream.concat(globales.stream(), asociados.stream())
            .filter(c -> idsVistos.add(c.getId()))
            .sorted((a, b) -> Integer.compare(b.getPorcentaje(), a.getPorcentaje()))
            .map(c -> new CuponPublicoDTO(
                c.getCodigo(), c.getPorcentaje(),
                c.getDescripcion(), c.getFechaVencimiento()
            ))
            .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/mis-cupones")
    @Transactional
    public ResponseEntity<List<CuponDTO>> misCupones(@AuthenticationPrincipal Artesano artesano) {
        return ResponseEntity.ok(
            cuponRepository.findByArtesanoIdConPiezas(artesano.getId())
                .stream().map(this::toDTO).toList()
        );
    }

    @PostMapping("/mis-cupones")
    @Transactional
    public ResponseEntity<?> crear(@RequestBody CuponRequest req,
                                   @AuthenticationPrincipal Artesano artesano) {
        if (!planService.isPremium(artesano)) {
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Crear cupones es una feature Premium. Pasate a Premium para empezar."
            ));
        }

        if (req.codigo == null || req.codigo.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El código es obligatorio"));
        }
        if (req.porcentaje == null || req.porcentaje < 1 || req.porcentaje > 100) {
            return ResponseEntity.badRequest().body(Map.of("message", "Porcentaje entre 1 y 100"));
        }
        if (req.fechaVencimiento == null || req.fechaVencimiento.isBefore(LocalDate.now())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Fecha de vencimiento inválida"));
        }

        String codigoNorm = req.codigo.trim().toUpperCase();
        if (cuponRepository.existsByArtesanoIdAndCodigoIgnoreCase(artesano.getId(), codigoNorm)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Ya tenés un cupón con ese código"));
        }

        Cupon c = new Cupon();
        c.setCodigo(codigoNorm);
        c.setPorcentaje(req.porcentaje);
        c.setDescripcion(req.descripcion);
        c.setFechaVencimiento(req.fechaVencimiento);
        c.setUsosMax(req.usosMax);
        c.setActivo(true);
        c.setArtesano(artesano);

        // Asociar piezas. Validamos que sean del propio artesano para no contaminar
        // cupones de unos con piezas de otros.
        if (req.piezasIds != null && !req.piezasIds.isEmpty()) {
            List<Pieza> piezas = piezaRepository.findAllById(req.piezasIds).stream()
                    .filter(p -> p.getArtesano().getId().equals(artesano.getId()))
                    .toList();
            c.setPiezas(new java.util.ArrayList<>(piezas));
        }

        return ResponseEntity.ok(toDTO(cuponRepository.save(c)));
    }

    @PutMapping("/mis-cupones/{id}")
    @Transactional
    public ResponseEntity<?> editar(@PathVariable Long id,
                                    @RequestBody CuponRequest req,
                                    @AuthenticationPrincipal Artesano artesano) {
        Cupon c = cuponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cupón no encontrado"));
        if (!c.getArtesano().getId().equals(artesano.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Sin permiso"));
        }

        if (req.descripcion != null) c.setDescripcion(req.descripcion);
        if (req.fechaVencimiento != null) c.setFechaVencimiento(req.fechaVencimiento);
        if (req.usosMax != null) c.setUsosMax(req.usosMax);
        if (req.activo != null) c.setActivo(req.activo);

        // Actualizar piezas asociadas si vinieron en el request
        if (req.piezasIds != null) {
            List<Pieza> piezas = piezaRepository.findAllById(req.piezasIds).stream()
                    .filter(p -> p.getArtesano().getId().equals(artesano.getId()))
                    .toList();
            c.getPiezas().clear();
            c.getPiezas().addAll(piezas);
        }

        return ResponseEntity.ok(toDTO(cuponRepository.save(c)));
    }

    @DeleteMapping("/mis-cupones/{id}")
    @Transactional
    public ResponseEntity<Void> eliminar(@PathVariable Long id,
                                         @AuthenticationPrincipal Artesano artesano) {
        Cupon c = cuponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cupón no encontrado"));
        if (!c.getArtesano().getId().equals(artesano.getId())) {
            return ResponseEntity.status(403).build();
        }
        cuponRepository.delete(c);
        return ResponseEntity.noContent().build();
    }

    private CuponDTO toDTO(Cupon c) {
        List<Long> piezasIds = c.getPiezas().stream().map(Pieza::getId).toList();
        return new CuponDTO(
            c.getId(), c.getCodigo(), c.getPorcentaje(),
            c.getDescripcion(), c.getFechaVencimiento(),
            c.getActivo(), c.getUsosMax(), c.getUsosCantidad(),
            c.getFechaCreacion(), piezasIds
        );
    }

    public record CuponRequest(
        String codigo,
        Integer porcentaje,
        String descripcion,
        LocalDate fechaVencimiento,
        Integer usosMax,
        Boolean activo,
        List<Long> piezasIds   // vacío o null = cupón global
    ) {}

    public record CuponPublicoDTO(
        String codigo,
        Integer porcentaje,
        String descripcion,
        LocalDate fechaVencimiento
    ) {}
}
