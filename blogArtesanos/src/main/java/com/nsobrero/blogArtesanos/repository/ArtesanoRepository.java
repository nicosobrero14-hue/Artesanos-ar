package com.nsobrero.blogArtesanos.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.nsobrero.blogArtesanos.entity.Artesano;

import java.util.Optional;

/*
 * JpaRepository<Artesano, Long> recibe dos parámetros:
 * - Artesano: la entidad que maneja
 * - Long: el tipo del ID de esa entidad
 *
 * Spring genera automáticamente la implementación de esta interfaz.
 * No necesitás escribir SQL para las operaciones básicas.
 *
 * Los métodos que agregás vos se generan por el nombre:
 * findByEmail → SELECT * FROM artesanos WHERE email = ?
 * findBySlug  → SELECT * FROM artesanos WHERE slug = ?
 */
public interface ArtesanoRepository extends JpaRepository<Artesano, Long> {

    Optional<Artesano> findByEmail(String email);

    Optional<Artesano> findBySlug(String slug);

    boolean existsByEmail(String email);

    boolean existsBySlug(String slug);
    
    Optional<Artesano> findByTokenVerificacion(String token);

    Optional<Artesano> findByTokenResetPassword(String token);

    // Para el banner de stats del home
    @Query("SELECT COUNT(a) FROM Artesano a " +
           "WHERE a.activo = true " +
           "AND a.rol <> com.nsobrero.blogArtesanos.enums.RolUsuario.ADMIN")
    long countActivosNoAdmin();
}