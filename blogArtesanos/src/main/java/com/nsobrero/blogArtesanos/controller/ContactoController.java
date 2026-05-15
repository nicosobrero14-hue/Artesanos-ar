package com.nsobrero.blogArtesanos.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import com.nsobrero.blogArtesanos.dto.ContactoDTO;
import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.entity.Contacto;
import com.nsobrero.blogArtesanos.service.ContactoService;

import java.util.List;

@RestController
@RequestMapping("/api/mis-contactos")
@RequiredArgsConstructor
public class ContactoController {

    private final ContactoService contactoService;

    @GetMapping
    public ResponseEntity<List<ContactoDTO>> listar(@AuthenticationPrincipal Artesano artesano) {
        return ResponseEntity.ok(
            contactoService.listar(artesano.getId())
                .stream().map(this::toDTO).toList()
        );
    }

    @PutMapping("/{id}/leer")
    public ResponseEntity<ContactoDTO> marcarLeido(@PathVariable Long id,
                                                    @AuthenticationPrincipal Artesano artesano) {
        return ResponseEntity.ok(toDTO(contactoService.marcarLeido(id, artesano.getId())));
    }

    /*
     * El artesano responde directamente desde el panel.
     * El backend envía un email al contacto con la respuesta y marca el mensaje como leído.
     */
    @PostMapping("/{id}/responder")
    public ResponseEntity<Void> responder(@PathVariable Long id,
                                          @RequestBody Map<String, String> body,
                                          @AuthenticationPrincipal Artesano artesano) {
        contactoService.responder(id, artesano.getId(), body.get("mensaje"));
        return ResponseEntity.noContent().build();
    }

    private ContactoDTO toDTO(Contacto c) {
        return new ContactoDTO(
            c.getId(), c.getNombre(), c.getEmail(),
            c.getMensaje(), c.getPiezaId(), c.getLeido(), c.getFecha()
        );
    }
    
    
}