package com.nsobrero.blogArtesanos.repository;

import com.nsobrero.blogArtesanos.entity.Favorito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FavoritoRepository extends JpaRepository<Favorito, Long> {

    boolean existsByPiezaIdAndAutorId(Long piezaId, Long autorId);

    Optional<Favorito> findByPiezaIdAndAutorId(Long piezaId, Long autorId);

    /*
     * Favoritos del usuario con la pieza ya cargada (JOIN FETCH) y materiales,
     * para que el frontend pueda renderizar las cards directo.
     */
    @Query("SELECT DISTINCT f FROM Favorito f " +
           "LEFT JOIN FETCH f.pieza p " +
           "LEFT JOIN FETCH p.materiales " +
           "WHERE f.autorId = :autorId " +
           "ORDER BY f.fecha DESC")
    List<Favorito> findByAutorIdConPieza(@Param("autorId") Long autorId);

    /* Para borrado en cascada al eliminar una pieza */
    void deleteByPiezaId(Long piezaId);
}
