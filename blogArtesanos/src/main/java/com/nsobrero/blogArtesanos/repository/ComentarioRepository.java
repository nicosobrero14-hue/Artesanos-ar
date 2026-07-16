package com.nsobrero.blogArtesanos.repository;

import com.nsobrero.blogArtesanos.entity.Comentario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ComentarioRepository extends JpaRepository<Comentario, Long> {
    List<Comentario> findByPiezaIdOrderByFechaDesc(Long piezaId);

    long countByPiezaId(Long piezaId);

    /* Counts agrupados — 1 query para N piezas (evita N+1 en listados) */
    @Query("SELECT c.pieza.id, COUNT(c) FROM Comentario c WHERE c.pieza.id IN :piezaIds GROUP BY c.pieza.id")
    List<Object[]> countAgrupadoPorPieza(@Param("piezaIds") List<Long> piezaIds);

    /* Comentarios totales por artesano — para el score de destacados */
    @Query("SELECT c.pieza.artesano.id, COUNT(c) FROM Comentario c GROUP BY c.pieza.artesano.id")
    List<Object[]> countAgrupadoPorArtesano();

    // Para enforce 1 comentario por usuario por pieza
    boolean existsByPiezaIdAndAutorId(Long piezaId, Long autorId);

    /* Para borrado en cascada al eliminar una pieza */
    void deleteByPiezaId(Long piezaId);
}
