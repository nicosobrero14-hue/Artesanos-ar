package com.nsobrero.blogArtesanos.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
 * Cupón de descuento que un artesano premium genera.
 * El cliente lo menciona al consultar (es honor system, no validamos uso).
 *
 * Diseño:
 *  - codigo: string único (ej. "VERANO20"). El artesano lo elige.
 *  - porcentaje: 1-100, descuento que aplica
 *  - fechaVencimiento: el cupón vence
 *  - activo: por si el artesano lo quiere desactivar antes del vencimiento
 *  - usosMax + usosCantidad: límite de usos (opcional, null = ilimitado)
 *
 * Nota: el "uso" hoy es solo informativo — el artesano debe trackearlo manualmente
 * cuando le mencionan el cupón. En una v2 podríamos hacer que el cliente lo "aplique"
 * vía endpoint para que se incremente automáticamente.
 */
@Entity
@Table(name = "cupones",
       uniqueConstraints = @UniqueConstraint(columnNames = {"artesano_id", "codigo"}))
@Getter @Setter @NoArgsConstructor
public class Cupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, length = 30)
    private String codigo;

    @NotNull
    @Min(1) @Max(100)
    @Column(nullable = false)
    private Integer porcentaje;

    @Column(length = 200)
    private String descripcion;

    @NotNull
    @Column(nullable = false)
    private LocalDate fechaVencimiento;

    @Column(nullable = false)
    private Boolean activo = true;

    /* Null = ilimitado */
    private Integer usosMax;

    @Column(nullable = false)
    private Integer usosCantidad = 0;

    @Column(nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "artesano_id", nullable = false)
    private Artesano artesano;

    /*
     * Piezas a las que aplica este cupón.
     *  - Si la lista está VACÍA → aplica a TODAS las piezas del artesano (cupón global)
     *  - Si tiene piezas → aplica solo a esas
     *
     * Ejemplo: el artesano tiene 10 piezas, crea un cupón asociado a 3 específicas.
     * Esas 3 piezas muestran el precio descontado, el resto no.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "cupon_piezas",
        joinColumns = @JoinColumn(name = "cupon_id"),
        inverseJoinColumns = @JoinColumn(name = "pieza_id")
    )
    private List<Pieza> piezas = new ArrayList<>();
}
