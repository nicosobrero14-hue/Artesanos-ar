package com.nsobrero.blogArtesanos.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/*
 * Evento / feria donde van a estar artesanos.
 *
 * Flujo:
 *  1. Artesano premium lo crea → aprobado=false
 *  2. Admin lo aprueba en /admin/eventos → aprobado=true, queda público
 *  3. Otros artesanos pueden "sumarse" (ManyToMany) a confirmar que estarán
 *  4. Si el evento ya pasó (fechaFin < hoy), no se muestra más en /eventos
 *
 * No tenemos urgencia/notificaciones por ahora. Eso lo agregamos cuando haya volumen.
 */
@Entity
@Table(name = "eventos")
@Getter @Setter @NoArgsConstructor
public class Evento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @NotNull
    @Column(nullable = false)
    private LocalDate fechaInicio;

    @NotNull
    @Column(nullable = false)
    private LocalDate fechaFin;

    @NotBlank
    @Column(nullable = false)
    private String ubicacion;

    /*
     * URL de Google Maps (opcional). Si la pegan, en el frontend va a aparecer
     * un link "Ver en mapa". No validamos formato — el artesano sabe lo que pega.
     */
    private String urlMaps;

    @Column(nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    /*
     * Estado de moderación:
     *  - aprobado=false: pendiente, NO se muestra en público
     *  - aprobado=true: aprobado por admin, visible en /eventos y banner del home
     */
    @Column(nullable = false)
    private Boolean aprobado = false;

    private LocalDateTime aprobadoEl;

    /*
     * Quien creó el evento. Lo mantenemos para auditoría y para que pueda
     * editarlo / borrarlo. Si el artesano se da de baja, decide qué hacer
     * (por ahora cascade no, lo dejamos huérfano y solo el admin puede borrar).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "autor_id", nullable = false)
    private Artesano autor;

    /*
     * Artesanos que confirmaron que van a estar en el evento.
     * @ManyToMany para que un artesano pueda estar en varios eventos
     * y un evento tenga varios artesanos.
     *
     * El creador NO se agrega automáticamente acá — si va, debe sumarse explícito.
     * (Esto lo hacemos en el service por simplicidad: lo agregamos al crear).
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "evento_participantes",
        joinColumns = @JoinColumn(name = "evento_id"),
        inverseJoinColumns = @JoinColumn(name = "artesano_id")
    )
    private List<Artesano> participantes = new ArrayList<>();
}
