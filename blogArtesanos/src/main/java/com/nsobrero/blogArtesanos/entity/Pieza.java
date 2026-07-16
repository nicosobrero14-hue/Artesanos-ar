package com.nsobrero.blogArtesanos.entity;
 
import com.nsobrero.blogArtesanos.enums.EstadoPieza;
import com.nsobrero.blogArtesanos.enums.Oficio;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
 
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
 
@Entity
@Table(name = "piezas")
@Getter
@Setter
@NoArgsConstructor
public class Pieza {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    @NotBlank
    @Column(nullable = false)
    private String titulo;
 
    @Column(columnDefinition = "TEXT")
    private String descripcion;
 
    /*
     * BigDecimal para precios: nunca uses double para dinero.
     * Double tiene problemas de precisión (0.1 + 0.2 no es exactamente 0.3).
     * BigDecimal es exacto, que es lo que necesitás para manejar plata.
     */
    @NotNull
    @Positive
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precio;
 
    /*
     * @Enumerated(STRING) le dice a JPA que guarde el nombre del enum
     * como texto en la BD ("DISPONIBLE", "VENDIDA", etc.).
     * Si usás EnumType.ORDINAL guarda el número (0, 1, 2...) lo cual
     * es malo porque si cambias el orden del enum todo se rompe.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoPieza estado = EstadoPieza.DISPONIBLE;
 
    private Integer horasTrabajo;
    private String categoria;

    /*
     * Oficio / disciplina artesanal — obligatorio.
     * Permite filtrar el catálogo público por tipo de trabajo.
     * Nullable a nivel de schema (para no romper inserts pre-existentes en dev)
     * pero el service rechaza si viene null al crear.
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private Oficio oficio;

    private Boolean destacada = false;
 
    /*
     * Lista de URLs de fotos. @ElementCollection crea una tabla separada
     * "pieza_fotos" con las URLs. Así podés tener múltiples fotos por pieza.
     * IMPORTANTE: List<String> con el tipo genérico explícito.
     *
     * @Fetch(SUBSELECT): cuando se carga una lista de piezas, Hibernate trae
     * las fotos de TODAS en una sola query (subselect) en vez de una query por
     * pieza. Con 40 piezas en el home eso son 39 queries menos por request.
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @org.hibernate.annotations.Fetch(org.hibernate.annotations.FetchMode.SUBSELECT)
    @CollectionTable(name = "pieza_fotos", joinColumns = @JoinColumn(name = "pieza_id"))
    @Column(name = "foto_url")
    private List<String> fotos = new ArrayList<>();

    /*
     * URL del video subido a Cloudinary. Solo cuentas premium pueden subir.
     * Máximo 30 segundos. Null si no hay video.
     */
    @Column(name = "video_url")
    private String videoUrl;

    /*
     * Moderación admin. Si oculta=true, la pieza:
     *  - NO aparece en catálogo público ni en home / ranking / búsqueda
     *  - SÍ aparece en el panel del artesano (puede ver el motivo)
     *  - SÍ se puede ver con el link directo si lo tenés (para que el admin pueda
     *    seguir investigando reportes y el artesano vea lo moderado)
     *
     * motivoOculta guarda la razón (visible para el dueño de la pieza).
     */
    @Column(nullable = false)
    private Boolean oculta = false;

    @Column(name = "motivo_oculta", length = 500)
    private String motivoOculta;

    @Column(nullable = false)
    private LocalDate fechaCreacion = LocalDate.now();
 
    /*
     * @ManyToOne: muchas piezas pertenecen a un artesano.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "artesano_id", nullable = false)
    private Artesano artesano;
 
    /*
     * @ManyToMany: una pieza puede tener varios materiales,
     * y un material puede usarse en varias piezas.
     * IMPORTANTE: List<Material> con el tipo genérico explícito.
     */
    @ManyToMany
    @JoinTable(
        name = "pieza_materiales",
        joinColumns = @JoinColumn(name = "pieza_id"),
        inverseJoinColumns = @JoinColumn(name = "material_id")
    )
    private List<Material> materiales = new ArrayList<>();
}