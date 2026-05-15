package com.nsobrero.blogArtesanos.repository;

import com.nsobrero.blogArtesanos.entity.Pieza;
import com.nsobrero.blogArtesanos.enums.EstadoPieza;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PiezaRepository extends JpaRepository<Pieza, Long> {

    /*
     * Solo hacemos JOIN FETCH de materiales (una colección a la vez).
     * Las fotos se cargan dentro de la transacción @Transactional del service.
     * Hibernate no permite JOIN FETCH de dos List simultáneamente.
     */
    @Query("SELECT DISTINCT p FROM Pieza p " +
           "LEFT JOIN FETCH p.materiales " +
           "WHERE p.artesano.id = :artesanoId")
    List<Pieza> findByArtesanoIdWithMateriales(@Param("artesanoId") Long artesanoId);

    @Query("SELECT DISTINCT p FROM Pieza p " +
           "LEFT JOIN FETCH p.materiales " +
           "WHERE p.artesano.id = :artesanoId AND p.estado = :estado " +
           "AND (p.oculta = false OR p.oculta IS NULL)")
    List<Pieza> findByArtesanoIdAndEstadoWithMateriales(
            @Param("artesanoId") Long artesanoId,
            @Param("estado") EstadoPieza estado);

    List<Pieza> findByArtesanoId(Long artesanoId);
    List<Pieza> findByArtesanoIdAndEstado(Long artesanoId, EstadoPieza estado);
    List<Pieza> findByArtesanoIdAndDestacadaTrue(Long artesanoId);
    long countByArtesanoId(Long artesanoId);

    /*
     * Todas las piezas destacadas DISPONIBLES de cuentas activas, con materiales.
     * El filtro de rol != ADMIN se hace en el service por simplicidad.
     * Ordenadas por fecha descendente — las más nuevas primero.
     */
    @Query("SELECT DISTINCT p FROM Pieza p " +
           "LEFT JOIN FETCH p.materiales " +
           "WHERE p.destacada = true " +
           "AND p.estado = :estado " +
           "AND p.artesano.activo = true " +
           "AND (p.oculta = false OR p.oculta IS NULL) " +
           "ORDER BY p.fechaCreacion DESC")
    List<Pieza> findDestacadasPublicas(@Param("estado") EstadoPieza estado);

    /*
     * Piezas NO destacadas DISPONIBLES — para la sección "Piezas recientes" del home.
     * Le da visibilidad a las cuentas gratis (que no pueden destacar) y también a las
     * piezas premium que no quedaron en el spotlight.
     * Premium mantiene la ventaja porque destacar = aparecer arriba en el spotlight dorado.
     */
    @Query("SELECT DISTINCT p FROM Pieza p " +
           "LEFT JOIN FETCH p.materiales " +
           "WHERE (p.destacada = false OR p.destacada IS NULL) " +
           "AND p.estado = :estado " +
           "AND p.artesano.activo = true " +
           "AND (p.oculta = false OR p.oculta IS NULL) " +
           "ORDER BY p.fechaCreacion DESC")
    List<Pieza> findNoDestacadasPublicas(@Param("estado") EstadoPieza estado);

    /*
     * Todas las piezas públicas con materiales para el ranking.
     * El score (likes + comentarios * 2) se calcula en Java porque MySQL no
     * tiene una forma simple de ordenar por subqueries de COUNT en JPA.
     */
    @Query("SELECT DISTINCT p FROM Pieza p " +
           "LEFT JOIN FETCH p.materiales " +
           "WHERE p.artesano.activo = true " +
           "AND p.artesano.rol <> com.nsobrero.blogArtesanos.enums.RolUsuario.ADMIN " +
           "AND (p.oculta = false OR p.oculta IS NULL)")
    List<Pieza> findTodasPublicas();

    // Counts para el banner del home
    @Query("SELECT COUNT(p) FROM Pieza p " +
           "WHERE p.estado = 'DISPONIBLE' " +
           "AND p.artesano.activo = true " +
           "AND p.artesano.rol <> com.nsobrero.blogArtesanos.enums.RolUsuario.ADMIN " +
           "AND (p.oculta = false OR p.oculta IS NULL)")
    long countPublicasDisponibles();

    @Query("SELECT COUNT(p) FROM Pieza p " +
           "WHERE p.destacada = true AND p.estado = 'DISPONIBLE' " +
           "AND p.artesano.activo = true " +
           "AND p.artesano.rol <> com.nsobrero.blogArtesanos.enums.RolUsuario.ADMIN " +
           "AND (p.oculta = false OR p.oculta IS NULL)")
    long countDestacadasPublicas();

    /*
     * Búsqueda full-text en piezas: busca en título, descripción y categoría.
     * Solo piezas DISPONIBLE de cuentas no-admin activas.
     * El parámetro :q debe venir ya con % al principio y al final.
     */
    @Query("SELECT DISTINCT p FROM Pieza p " +
           "LEFT JOIN FETCH p.materiales " +
           "WHERE p.estado = 'DISPONIBLE' " +
           "AND p.artesano.activo = true " +
           "AND p.artesano.rol <> com.nsobrero.blogArtesanos.enums.RolUsuario.ADMIN " +
           "AND (p.oculta = false OR p.oculta IS NULL) " +
           "AND (LOWER(p.titulo) LIKE :q OR LOWER(p.descripcion) LIKE :q OR LOWER(p.categoria) LIKE :q) " +
           "ORDER BY p.destacada DESC, p.fechaCreacion DESC")
    List<Pieza> buscarPublicas(@Param("q") String q);

    /*
     * Piezas relacionadas: misma categoría que :categoria, excluyendo la pieza actual,
     * de cuentas activas no-admin, ordenadas por destacada y fecha. Limita a 4.
     */
    @Query("SELECT DISTINCT p FROM Pieza p " +
           "LEFT JOIN FETCH p.materiales " +
           "WHERE p.id <> :excluirId " +
           "AND p.estado = 'DISPONIBLE' " +
           "AND p.artesano.activo = true " +
           "AND p.artesano.rol <> com.nsobrero.blogArtesanos.enums.RolUsuario.ADMIN " +
           "AND (p.oculta = false OR p.oculta IS NULL) " +
           "AND (LOWER(p.categoria) = LOWER(:categoria) OR p.artesano.id = :artesanoId) " +
           "ORDER BY p.destacada DESC, p.fechaCreacion DESC")
    List<Pieza> findRelacionadas(
            @Param("excluirId") Long excluirId,
            @Param("categoria") String categoria,
            @Param("artesanoId") Long artesanoId);
}