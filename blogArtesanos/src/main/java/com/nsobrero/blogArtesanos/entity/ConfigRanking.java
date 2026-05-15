package com.nsobrero.blogArtesanos.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/*
 * Configuración del ranking. Es un SINGLETON: solo hay una fila en la tabla
 * (la creamos al startup con un bootstrap si no existe). Se identifica con
 * id fijo = 1.
 *
 * El admin edita esto desde /admin/ranking:
 *  - periodicidad: cada cuánto se otorga el premio ("Semanal", "Quincenal", "Mensual")
 *  - descripcionPremio: qué gana el #1 (texto libre, ej. "1 mes Premium gratis")
 *  - fechaProximoOtorgamiento: cuándo es el próximo corte
 *  - reglasExtras: cualquier texto adicional que el admin quiera mostrar
 *
 * El otorgamiento es manual (el admin upgradea al ganador a Premium 1 mes via
 * el panel admin de artesanos). No automatizamos eso por ahora.
 */
@Entity
@Table(name = "config_ranking")
@Getter @Setter @NoArgsConstructor
public class ConfigRanking {

    @Id
    private Long id = 1L;

    @Column(length = 30)
    private String periodicidad = "Mensual";

    @Column(length = 500)
    private String descripcionPremio = "1 mes de Premium gratis para el artesano del puesto #1";

    private LocalDate fechaProximoOtorgamiento;

    @Column(columnDefinition = "TEXT")
    private String reglasExtras;

    @Column(nullable = false)
    private Boolean activo = true;

    private LocalDateTime ultimaModificacion;
}
