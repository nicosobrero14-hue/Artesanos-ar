package com.nsobrero.blogArtesanos.entity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "materiales")
@Getter @Setter @NoArgsConstructor
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, unique = true)
    private String nombre; // Ej: "Acero 1095", "Quebracho colorado", "Cuero vacuno"

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    private String tipo; // Ej: "Acero", "Madera", "Cuero", "Hueso"
}