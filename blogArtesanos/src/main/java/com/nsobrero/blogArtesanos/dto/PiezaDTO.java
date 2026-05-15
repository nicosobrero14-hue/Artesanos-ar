package com.nsobrero.blogArtesanos.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.nsobrero.blogArtesanos.enums.EstadoPieza;
import com.nsobrero.blogArtesanos.enums.Oficio;

// Lo que devuelve la API al mostrar una pieza
public record PiezaDTO(
        Long id,
        String titulo,
        String descripcion,
        BigDecimal precio,
        EstadoPieza estado,
        Oficio oficio,             // disciplina artesanal (cuchillería, joyería, etc.)
        Integer horasTrabajo,
        String categoria,
        Boolean destacada,
        List<String> fotos,
        String videoUrl,
        List<String> materiales,
        LocalDate fechaCreacion,
        String artesanoNombre,
        String artesanoSlug,
        Long artesanoId,           // necesario para abrir chat directo (/chat?con=ID)
        Long meGustaCount,
        Long comentariosCount
) {}
