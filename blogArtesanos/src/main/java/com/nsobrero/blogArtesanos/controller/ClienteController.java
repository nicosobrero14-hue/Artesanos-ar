package com.nsobrero.blogArtesanos.controller;

import com.nsobrero.blogArtesanos.auth.ClienteRequest;
import com.nsobrero.blogArtesanos.dto.ClienteDTO;
import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.entity.Cliente;
import com.nsobrero.blogArtesanos.repository.ClienteRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mis-clientes")
@RequiredArgsConstructor
public class ClienteController {

    private final ClienteRepository clienteRepository;

    @GetMapping
    public ResponseEntity<List<ClienteDTO>> listar(@AuthenticationPrincipal Artesano artesano) {
        return ResponseEntity.ok(
            clienteRepository.findByArtesanoId(artesano.getId())
                .stream().map(this::toDTO).toList()
        );
    }

    @PostMapping
    public ResponseEntity<ClienteDTO> crear(@Valid @RequestBody ClienteRequest request,
                                             @AuthenticationPrincipal Artesano artesano) {
        Cliente cliente = new Cliente();
        cliente.setNombre(request.nombre());
        cliente.setEmail(request.email());
        cliente.setTelefono(request.telefono());
        cliente.setNotas(request.notas());
        cliente.setArtesano(artesano);
        return ResponseEntity.ok(toDTO(clienteRepository.save(cliente)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClienteDTO> actualizar(@PathVariable Long id,
                                                  @RequestBody ClienteRequest request,
                                                  @AuthenticationPrincipal Artesano artesano) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        if (!cliente.getArtesano().getId().equals(artesano.getId())) {
            return ResponseEntity.status(403).build();
        }
        cliente.setNombre(request.nombre());
        cliente.setEmail(request.email());
        cliente.setTelefono(request.telefono());
        cliente.setNotas(request.notas());
        return ResponseEntity.ok(toDTO(clienteRepository.save(cliente)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id,
                                          @AuthenticationPrincipal Artesano artesano) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        if (!cliente.getArtesano().getId().equals(artesano.getId())) {
            return ResponseEntity.status(403).build();
        }
        clienteRepository.delete(cliente);
        return ResponseEntity.noContent().build();
    }

    /*
     * Convertimos la entidad a DTO para no exponer el Artesano completo
     * en la respuesta JSON — evita el LazyInitializationException y además
     * es la práctica correcta: nunca devolver entidades JPA directamente.
     */
    private ClienteDTO toDTO(Cliente c) {
        return new ClienteDTO(c.getId(), c.getNombre(), c.getEmail(), c.getTelefono(), c.getNotas());
    }
}