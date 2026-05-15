package com.nsobrero.blogArtesanos.repository;

import com.nsobrero.blogArtesanos.entity.Evento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface EventoRepository extends JpaRepository<Evento, Long> {

    /*
     * Eventos públicos (aprobados) que todavía no terminaron, ordenados por fecha de inicio ascendente.
     * El JOIN FETCH al autor evita N+1 cuando el frontend pide la lista.
     */
    @Query("SELECT DISTINCT e FROM Evento e " +
           "LEFT JOIN FETCH e.autor " +
           "WHERE e.aprobado = true AND e.fechaFin >= :hoy " +
           "ORDER BY e.fechaInicio ASC")
    List<Evento> findProximosAprobados(@Param("hoy") LocalDate hoy);

    /*
     * Eventos pendientes de aprobación (lo que ve el admin).
     */
    @Query("SELECT DISTINCT e FROM Evento e " +
           "LEFT JOIN FETCH e.autor " +
           "WHERE e.aprobado = false " +
           "ORDER BY e.fechaCreacion DESC")
    List<Evento> findPendientes();

    /*
     * Todos los eventos (admin) — aprobados + pendientes.
     */
    @Query("SELECT DISTINCT e FROM Evento e " +
           "LEFT JOIN FETCH e.autor " +
           "ORDER BY e.fechaCreacion DESC")
    List<Evento> findAllConAutor();

    /*
     * Eventos creados por un artesano específico.
     */
    @Query("SELECT DISTINCT e FROM Evento e " +
           "LEFT JOIN FETCH e.autor " +
           "WHERE e.autor.id = :autorId " +
           "ORDER BY e.fechaCreacion DESC")
    List<Evento> findByAutorId(@Param("autorId") Long autorId);
}
