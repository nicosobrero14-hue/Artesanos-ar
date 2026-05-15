package com.nsobrero.blogArtesanos.repository;

import com.nsobrero.blogArtesanos.entity.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

    List<Notificacion> findTop20ByDestinatarioIdOrderByFechaDesc(Long destinatarioId);

    long countByDestinatarioIdAndLeidaFalse(Long destinatarioId);

    @Modifying
    @Query("UPDATE Notificacion n SET n.leida = true WHERE n.destinatarioId = :destinatarioId AND n.leida = false")
    int marcarTodasLeidas(@Param("destinatarioId") Long destinatarioId);
}
