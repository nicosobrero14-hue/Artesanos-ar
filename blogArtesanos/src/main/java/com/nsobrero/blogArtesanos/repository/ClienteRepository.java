package com.nsobrero.blogArtesanos.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.nsobrero.blogArtesanos.entity.Cliente;

import java.util.List;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    List<Cliente> findByArtesanoId(Long artesanoId);
}
