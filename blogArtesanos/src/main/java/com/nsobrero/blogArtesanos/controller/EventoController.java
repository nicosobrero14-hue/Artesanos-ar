package com.nsobrero.blogArtesanos.controller;

import com.nsobrero.blogArtesanos.auth.EventoRequest;
import com.nsobrero.blogArtesanos.dto.EventoDTO;
import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.service.EventoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/eventos")
@RequiredArgsConstructor
public class EventoController {

    private final EventoService eventoService;

    /*
     * GET público — eventos aprobados que todavía no terminaron.
     * Si el visitante está logueado se incluyen los flags soyAutor/soyParticipante.
     */
    @GetMapping("/proximos")
    public ResponseEntity<List<EventoDTO>> proximos(@AuthenticationPrincipal Artesano usuario) {
        Long uid = usuario != null ? usuario.getId() : null;
        return ResponseEntity.ok(eventoService.listarProximosAprobados(uid));
    }

    /*
     * GET — eventos creados por el usuario logueado (incluye pendientes).
     */
    @GetMapping("/mis-eventos")
    public ResponseEntity<List<EventoDTO>> misEventos(@AuthenticationPrincipal Artesano usuario) {
        return ResponseEntity.ok(eventoService.misEventos(usuario.getId()));
    }

    /*
     * POST — crear nuevo evento. Premium-only (validado en el service).
     */
    @PostMapping
    public ResponseEntity<EventoDTO> crear(@Valid @RequestBody EventoRequest req,
                                            @AuthenticationPrincipal Artesano usuario) {
        return ResponseEntity.ok(eventoService.crear(req, usuario.getId()));
    }

    /*
     * PUT — editar evento (autor only). Vuelve a estado pendiente.
     */
    @PutMapping("/{id}")
    public ResponseEntity<EventoDTO> editar(@PathVariable Long id,
                                             @Valid @RequestBody EventoRequest req,
                                             @AuthenticationPrincipal Artesano usuario) {
        return ResponseEntity.ok(eventoService.editar(id, req, usuario.getId()));
    }

    /*
     * DELETE — eliminar evento (autor o admin).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id,
                                          @AuthenticationPrincipal Artesano usuario) {
        eventoService.eliminar(id, usuario);
        return ResponseEntity.noContent().build();
    }

    /*
     * POST — toggle "voy a estar".
     */
    @PostMapping("/{id}/sumarme")
    public ResponseEntity<EventoDTO> sumarme(@PathVariable Long id,
                                              @AuthenticationPrincipal Artesano usuario) {
        return ResponseEntity.ok(eventoService.toggleParticipacion(id, usuario.getId()));
    }
}
