package com.nsobrero.blogArtesanos.repository;

import com.nsobrero.blogArtesanos.entity.MeGusta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MeGustaRepository extends JpaRepository<MeGusta, Long> {

    long countByPiezaId(Long piezaId);

    Optional<MeGusta> findByPiezaIdAndAutorId(Long piezaId, Long autorId);

    boolean existsByPiezaIdAndAutorId(Long piezaId, Long autorId);

    void deleteByPiezaIdAndAutorId(Long piezaId, Long autorId);

    /* Para borrado en cascada al eliminar una pieza */
    void deleteByPiezaId(Long piezaId);
}
