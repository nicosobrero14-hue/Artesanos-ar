package com.nsobrero.blogArtesanos.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.nsobrero.blogArtesanos.entity.Material;

import java.util.Optional;

public interface MaterialRepository extends JpaRepository<Material, Long> {

    Optional<Material> findByNombreIgnoreCase(String nombre);
}
