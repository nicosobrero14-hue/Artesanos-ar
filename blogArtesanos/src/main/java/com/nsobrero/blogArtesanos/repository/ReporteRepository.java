package com.nsobrero.blogArtesanos.repository;

import com.nsobrero.blogArtesanos.entity.Reporte;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReporteRepository extends JpaRepository<Reporte, Long> {
    List<Reporte> findAllByOrderByFechaDesc();
    List<Reporte> findByResueltoFalseOrderByFechaDesc();
    long countByResueltoFalse();
}
