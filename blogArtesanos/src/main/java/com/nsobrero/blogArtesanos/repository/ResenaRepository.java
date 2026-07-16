package com.nsobrero.blogArtesanos.repository;

import com.nsobrero.blogArtesanos.entity.Resena;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ResenaRepository extends JpaRepository<Resena, Long> {

    List<Resena> findByArtesanoIdOrderByFechaDesc(Long artesanoId);

    long countByArtesanoId(Long artesanoId);

    /* Reseñas totales por artesano en 1 query — para el score de destacados */
    @Query("SELECT r.artesano.id, COUNT(r) FROM Resena r GROUP BY r.artesano.id")
    List<Object[]> countAgrupadoPorArtesano();

    Optional<Resena> findByArtesanoIdAndAutorId(Long artesanoId, Long autorId);

    boolean existsByArtesanoIdAndAutorId(Long artesanoId, Long autorId);
}
