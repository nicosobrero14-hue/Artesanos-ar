package com.nsobrero.blogArtesanos.repository;

import com.nsobrero.blogArtesanos.entity.Cupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface CuponRepository extends JpaRepository<Cupon, Long> {

    /*
     * Cupones del artesano (todos, incluso vencidos/inactivos) — para su panel.
     * JOIN FETCH a piezas para que el frontend reciba los IDs sin lazy issue.
     */
    @Query("SELECT DISTINCT c FROM Cupon c " +
           "LEFT JOIN FETCH c.piezas " +
           "WHERE c.artesano.id = :artesanoId " +
           "ORDER BY c.fechaCreacion DESC")
    List<Cupon> findByArtesanoIdConPiezas(@Param("artesanoId") Long artesanoId);

    /*
     * Cupones vigentes (no vencidos, activos) de un artesano que aplican a TODAS sus
     * piezas (sin piezas asociadas). Se muestran en el catálogo público como "globales".
     */
    @Query("SELECT c FROM Cupon c " +
           "WHERE c.artesano.slug = :slug " +
           "AND c.activo = true " +
           "AND c.fechaVencimiento >= :hoy " +
           "AND (c.usosMax IS NULL OR c.usosCantidad < c.usosMax) " +
           "AND SIZE(c.piezas) = 0 " +
           "ORDER BY c.fechaVencimiento ASC")
    List<Cupon> findGlobalesVigentesPorSlug(@Param("slug") String slug, @Param("hoy") LocalDate hoy);

    /*
     * Cupones vigentes que aplican a una pieza específica.
     * Devuelve dos grupos unidos:
     *  1. Cupones del artesano que están "globales" (sin piezas asociadas)
     *  2. Cupones asociados explícitamente a esta pieza
     *
     * Hacemos dos queries simples en lugar de una con LEFT JOIN + SIZE() que
     * en MySQL/Hibernate causaba problemas con cupones globales.
     */
    @Query("SELECT c FROM Cupon c " +
           "WHERE c.artesano.id = :artesanoId " +
           "AND c.activo = true " +
           "AND c.fechaVencimiento >= :hoy " +
           "AND (c.usosMax IS NULL OR c.usosCantidad < c.usosMax) " +
           "AND SIZE(c.piezas) = 0")
    List<Cupon> findGlobalesArtesano(@Param("artesanoId") Long artesanoId,
                                      @Param("hoy") LocalDate hoy);

    @Query("SELECT DISTINCT c FROM Cupon c " +
           "JOIN c.piezas p " +
           "WHERE p.id = :piezaId " +
           "AND c.activo = true " +
           "AND c.fechaVencimiento >= :hoy " +
           "AND (c.usosMax IS NULL OR c.usosCantidad < c.usosMax)")
    List<Cupon> findAsociadosAPieza(@Param("piezaId") Long piezaId,
                                     @Param("hoy") LocalDate hoy);

    boolean existsByArtesanoIdAndCodigoIgnoreCase(Long artesanoId, String codigo);
}
