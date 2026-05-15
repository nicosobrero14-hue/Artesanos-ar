package com.nsobrero.blogArtesanos.repository;

import com.nsobrero.blogArtesanos.entity.LogAuditoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LogAuditoriaRepository extends JpaRepository<LogAuditoria, Long> {
    List<LogAuditoria> findTop100ByOrderByFechaDesc();
}
