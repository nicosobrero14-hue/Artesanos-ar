package com.nsobrero.blogArtesanos.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nsobrero.blogArtesanos.auth.PedidoRequest;
import com.nsobrero.blogArtesanos.dto.PedidoDTO;
import com.nsobrero.blogArtesanos.entity.Pedido;
import com.nsobrero.blogArtesanos.enums.EstadoPedido;
import com.nsobrero.blogArtesanos.repository.ArtesanoRepository;
import com.nsobrero.blogArtesanos.repository.ClienteRepository;
import com.nsobrero.blogArtesanos.repository.PedidoRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ArtesanoRepository artesanoRepository;
    private final ClienteRepository clienteRepository;

    @Transactional
    public List<PedidoDTO> listar(Long artesanoId) {
        return pedidoRepository.findByArtesanoId(artesanoId).stream()
                .map(this::toDTO).toList();
    }

    @Transactional
    public List<PedidoDTO> listarPorEstado(Long artesanoId, EstadoPedido estado) {
        return pedidoRepository.findByArtesanoIdAndEstado(artesanoId, estado).stream()
                .map(this::toDTO).toList();
    }

    @Transactional
    public PedidoDTO obtener(Long id, Long artesanoId) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));
        if (!pedido.getArtesano().getId().equals(artesanoId)) {
            throw new RuntimeException("No tenés permiso para ver este pedido");
        }
        return toDTO(pedido);
    }

    @Transactional
    public PedidoDTO crear(PedidoRequest request, Long artesanoId) {
        var artesano = artesanoRepository.findById(artesanoId)
                .orElseThrow(() -> new RuntimeException("Artesano no encontrado"));

        Pedido pedido = new Pedido();
        pedido.setDescripcion(request.descripcion());
        pedido.setPrecioAcordado(request.precioAcordado());
        pedido.setSenia(request.senia() != null ? request.senia() : java.math.BigDecimal.ZERO);
        pedido.setFechaEntregaEstimada(request.fechaEntregaEstimada());
        pedido.setNotas(request.notas());
        pedido.setArtesano(artesano);

        if (request.clienteId() != null) {
            var cliente = clienteRepository.findById(request.clienteId()).orElse(null);
            pedido.setCliente(cliente);
        }

        return toDTO(pedidoRepository.save(pedido));
    }

    @Transactional
    public PedidoDTO cambiarEstado(Long id, EstadoPedido nuevoEstado, Long artesanoId) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));
        if (!pedido.getArtesano().getId().equals(artesanoId)) {
            throw new RuntimeException("No tenés permiso");
        }
        pedido.setEstado(nuevoEstado);
        return toDTO(pedidoRepository.save(pedido));
    }

    /*
     * Aplana el pedido a DTO. Tomamos solo los datos del cliente que el frontend
     * realmente muestra (id y nombre), evitando entrar a la relación lazy completa.
     */
    private PedidoDTO toDTO(Pedido p) {
        Long clienteId = p.getCliente() != null ? p.getCliente().getId() : null;
        String clienteNombre = p.getCliente() != null ? p.getCliente().getNombre() : null;
        return new PedidoDTO(
            p.getId(), p.getDescripcion(),
            p.getPrecioAcordado(), p.getSenia(), p.getEstado(),
            p.getFechaEncargo(), p.getFechaEntregaEstimada(),
            p.getNotas(), clienteId, clienteNombre
        );
    }
}
