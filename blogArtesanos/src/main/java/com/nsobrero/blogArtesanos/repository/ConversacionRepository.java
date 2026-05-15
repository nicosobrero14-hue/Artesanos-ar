package com.nsobrero.blogArtesanos.repository;

import com.nsobrero.blogArtesanos.entity.Conversacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversacionRepository extends JpaRepository<Conversacion, Long> {

    /*
     * Busca conversación existente entre dos usuarios (en cualquier orden).
     * Si no existe, el service la crea.
     */
    @Query("SELECT c FROM Conversacion c " +
           "WHERE (c.participanteAId = :uno AND c.participanteBId = :otro) " +
           "   OR (c.participanteAId = :otro AND c.participanteBId = :uno)")
    Optional<Conversacion> buscarEntre(@Param("uno") Long uno, @Param("otro") Long otro);

    /*
     * Lista todas las conversaciones donde el usuario participa,
     * ordenadas por última actividad descendente.
     */
    @Query("SELECT c FROM Conversacion c " +
           "WHERE c.participanteAId = :userId OR c.participanteBId = :userId " +
           "ORDER BY c.ultimaActividad DESC")
    List<Conversacion> findMias(@Param("userId") Long userId);
}
