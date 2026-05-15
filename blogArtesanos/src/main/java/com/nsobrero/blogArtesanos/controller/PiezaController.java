package com.nsobrero.blogArtesanos.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.nsobrero.blogArtesanos.auth.PiezaRequest;
import com.nsobrero.blogArtesanos.dto.PiezaDTO;
import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.service.PiezaService;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PiezaController {

    private final PiezaService piezaService;

    // GET /api/artesanos/{slug}/piezas — catálogo público (sin JWT)
    @GetMapping("/artesanos/{slug}/piezas")
    public ResponseEntity<List<PiezaDTO>> listarPublicas(@PathVariable String slug) {
        return ResponseEntity.ok(piezaService.listarPublicas(slug));
    }

    // GET /api/piezas/destacadas?oficio=X — filtro opcional por oficio
    @GetMapping("/piezas/destacadas")
    public ResponseEntity<List<PiezaDTO>> listarDestacadas(
            @RequestParam(required = false) com.nsobrero.blogArtesanos.enums.Oficio oficio) {
        return ResponseEntity.ok(piezaService.listarDestacadasPublicas(oficio));
    }

    // GET /api/piezas/recientes?oficio=X — filtro opcional por oficio
    @GetMapping("/piezas/recientes")
    public ResponseEntity<List<PiezaDTO>> listarRecientes(
            @RequestParam(required = false) com.nsobrero.blogArtesanos.enums.Oficio oficio) {
        return ResponseEntity.ok(piezaService.listarRecientesPublicas(oficio));
    }

    // GET /api/piezas/buscar?q=xxx — búsqueda global pública
    @GetMapping("/piezas/buscar")
    public ResponseEntity<List<PiezaDTO>> buscar(@RequestParam(name = "q", required = false) String q) {
        return ResponseEntity.ok(piezaService.buscar(q));
    }

    // GET /api/piezas/{id}/relacionadas — para "Más piezas como esta" en el detalle
    @GetMapping("/piezas/{id}/relacionadas")
    public ResponseEntity<List<PiezaDTO>> relacionadas(@PathVariable Long id) {
        return ResponseEntity.ok(piezaService.relacionadas(id));
    }

    // GET /api/piezas/{id} — detalle de una pieza (sin JWT obligatorio,
    // pero si el usuario está logueado le pasamos el principal para chequear
    // si puede ver piezas ocultas (admin o dueño).
    @GetMapping("/piezas/{id}")
    public ResponseEntity<PiezaDTO> obtener(
            @PathVariable Long id,
            @AuthenticationPrincipal Artesano usuario) {
        return ResponseEntity.ok(piezaService.obtenerPorId(id, usuario));
    }

    // GET /api/mis-piezas — panel privado (requiere JWT)
    @GetMapping("/mis-piezas")
    public ResponseEntity<List<PiezaDTO>> listarMias(@AuthenticationPrincipal Artesano artesano) {
        return ResponseEntity.ok(piezaService.listarMias(artesano.getId()));
    }

    // POST /api/mis-piezas — crear pieza (requiere JWT)
    @PostMapping("/mis-piezas")
    public ResponseEntity<PiezaDTO> crear(@Valid @RequestBody PiezaRequest request,
                                           @AuthenticationPrincipal Artesano artesano) {
        return ResponseEntity.ok(piezaService.crear(request, artesano.getId()));
    }

    // PUT /api/mis-piezas/{id} — editar pieza (requiere JWT)
    @PutMapping("/mis-piezas/{id}")
    public ResponseEntity<PiezaDTO> actualizar(@PathVariable Long id,
                                                @Valid @RequestBody PiezaRequest request,
                                                @AuthenticationPrincipal Artesano artesano) {
        return ResponseEntity.ok(piezaService.actualizar(id, request, artesano.getId()));
    }

    // DELETE /api/mis-piezas/{id} — eliminar pieza (requiere JWT)
    @DeleteMapping("/mis-piezas/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id,
                                          @AuthenticationPrincipal Artesano artesano) {
        piezaService.eliminar(id, artesano.getId());
        return ResponseEntity.noContent().build();
    }
}