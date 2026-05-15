package com.nsobrero.blogArtesanos.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.nsobrero.blogArtesanos.entity.Contacto;

import java.util.List;

public interface ContactoRepository extends JpaRepository<Contacto, Long> {

    List<Contacto> findByArtesanoId(Long artesanoId);

    // Solo los mensajes no leídos
    List<Contacto> findByArtesanoIdAndLeidoFalse(Long artesanoId);
}
