package com.nsobrero.blogArtesanos.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.nsobrero.blogArtesanos.auth.PedidoRequest;
import com.nsobrero.blogArtesanos.dto.PedidoDTO;
import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.enums.EstadoPedido;
import com.nsobrero.blogArtesanos.service.PedidoService;

import java.util.List;

@RestController
@RequestMapping("/api/mis-pedidos")
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoService pedidoService;

    @GetMapping
    public ResponseEntity<List<PedidoDTO>> listar(
            @RequestParam(required = false) EstadoPedido estado,
            @AuthenticationPrincipal Artesano artesano) {
        if (estado != null) {
            return ResponseEntity.ok(pedidoService.listarPorEstado(artesano.getId(), estado));
        }
        return ResponseEntity.ok(pedidoService.listar(artesano.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PedidoDTO> obtener(@PathVariable Long id,
                                              @AuthenticationPrincipal Artesano artesano) {
        return ResponseEntity.ok(pedidoService.obtener(id, artesano.getId()));
    }

    @PostMapping
    public ResponseEntity<PedidoDTO> crear(@Valid @RequestBody PedidoRequest request,
                                            @AuthenticationPrincipal Artesano artesano) {
        return ResponseEntity.ok(pedidoService.crear(request, artesano.getId()));
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<PedidoDTO> cambiarEstado(@PathVariable Long id,
                                                    @RequestParam EstadoPedido nuevoEstado,
                                                    @AuthenticationPrincipal Artesano artesano) {
        return ResponseEntity.ok(pedidoService.cambiarEstado(id, nuevoEstado, artesano.getId()));
    }
}
