package com.nsobrero.blogArtesanos.repository;

import com.nsobrero.blogArtesanos.entity.Resena;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ResenaRepository extends JpaRepository<Resena, Long> {

    List<Resena> findByArtesanoIdOrderByFechaDesc(Long artesanoId);

    long countByArtesanoId(Long artesanoId);

    Optional<Resena> findByArtesanoIdAndAutorId(Long artesanoId, Long autorId);

    boolean existsByArtesanoIdAndAutorId(Long artesanoId, Long autorId);
}
