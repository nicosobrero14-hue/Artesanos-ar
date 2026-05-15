package com.nsobrero.blogArtesanos.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/*
 * Registro de acciones administrativas para auditoría.
 *
 * Sirve para:
 *  - Rastrear quién hizo qué cuando (compliance, debugging)
 *  - Detectar abuso de privilegios
 *  - Justificar decisiones de moderación si hay un reclamo
 *
 * Las acciones se loggean automáticamente desde AdminAuditService.
 */
@Entity
@Table(name = "log_auditoria",
       indexes = @Index(name = "idx_log_fecha", columnList = "fecha DESC"))
@Getter @Setter @NoArgsConstructor
public class LogAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "admin_id", nullable = false)
    private Long adminId;

    @Column(nullable = false)
    private String adminNombre;

    @Column(nullable = false, length = 60)
    private String accion;

    /* Tipo + id del objeto afectado, ej. "PIEZA" y 123 */
    private String objetoTipo;
    private Long objetoId;

    @Column(columnDefinition = "TEXT")
    private String detalle;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();
}
