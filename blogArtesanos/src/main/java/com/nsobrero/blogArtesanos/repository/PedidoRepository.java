package com.nsobrero.blogArtesanos.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.nsobrero.blogArtesanos.entity.Pedido;
import com.nsobrero.blogArtesanos.enums.EstadoPedido;

import java.util.List;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    List<Pedido> findByArtesanoId(Long artesanoId);

    // Pedidos filtrados por estado (PENDIENTE, EN_PROCESO, etc.)
    List<Pedido> findByArtesanoIdAndEstado(Long artesanoId, EstadoPedido estado);
}