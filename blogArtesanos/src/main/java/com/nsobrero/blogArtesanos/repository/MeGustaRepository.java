package com.nsobrero.blogArtesanos.repository;

import com.nsobrero.blogArtesanos.entity.MeGusta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MeGustaRepository extends JpaRepository<MeGusta, Long> {

    long countByPiezaId(Long piezaId);

    /*
     * Counts agrupados — 1 sola query para N piezas, en vez de N queries.
     * Crítico para performance: el mapeo a DTO de listas de piezas usaba
     * countByPiezaId por pieza y generaba N+1 (el home hacía cientos de queries).
     */
    @Query("SELECT m.pieza.id, COUNT(m) FROM MeGusta m WHERE m.pieza.id IN :piezaIds GROUP BY m.pieza.id")
    List<Object[]> countAgrupadoPorPieza(@Param("piezaIds") List<Long> piezaIds);

    /* Likes totales por artesano (sobre todas sus piezas) — para el score de destacados */
    @Query("SELECT m.pieza.artesano.id, COUNT(m) FROM MeGusta m GROUP BY m.pieza.artesano.id")
    List<Object[]> countAgrupadoPorArtesano();

    Optional<MeGusta> findByPiezaIdAndAutorId(Long piezaId, Long autorId);

    boolean existsByPiezaIdAndAutorId(Long piezaId, Long autorId);

    void deleteByPiezaIdAndAutorId(Long piezaId, Long autorId);

    /* Para borrado en cascada al eliminar una pieza */
    void deleteByPiezaId(Long piezaId);
}
