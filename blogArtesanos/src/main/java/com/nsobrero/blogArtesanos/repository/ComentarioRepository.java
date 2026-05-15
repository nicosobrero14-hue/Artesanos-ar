package com.nsobrero.blogArtesanos.repository;

import com.nsobrero.blogArtesanos.entity.Comentario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComentarioRepository extends JpaRepository<Comentario, Long> {
    List<Comentario> findByPiezaIdOrderByFechaDesc(Long piezaId);

    long countByPiezaId(Long piezaId);

    // Para enforce 1 comentario por usuario por pieza
    boolean existsByPiezaIdAndAutorId(Long piezaId, Long autorId);

    /* Para borrado en cascada al eliminar una pieza */
    void deleteByPiezaId(Long piezaId);
}
