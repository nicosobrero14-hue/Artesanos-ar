package com.nsobrero.blogArtesanos.controller;

import com.nsobrero.blogArtesanos.enums.Oficio;
import com.nsobrero.blogArtesanos.repository.ArtesanoRepository;
import com.nsobrero.blogArtesanos.repository.PiezaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/*
 * Datos agregados para la página de inicio (sin auth).
 * Solo cuenta entidades, no expone info sensible.
 */
@RestController
@RequestMapping("/api/home")
@RequiredArgsConstructor
public class HomeController {

    private final ArtesanoRepository artesanoRepository;
    private final PiezaRepository piezaRepository;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> stats() {
        return ResponseEntity.ok(Map.of(
            "artesanos", artesanoRepository.countActivosNoAdmin(),
            "piezas", piezaRepository.countPublicasDisponibles(),
            "destacadas", piezaRepository.countDestacadasPublicas()
        ));
    }

    /*
     * Lista de oficios disponibles para usar en filtros y selectores.
     * Devuelve {value: "CUCHILLERIA", label: "Cuchillería"} para cada uno.
     */
    @GetMapping("/oficios")
    public ResponseEntity<List<Map<String, String>>> oficios() {
        List<Map<String, String>> lista = Arrays.stream(Oficio.values())
            .map(o -> Map.of("value", o.name(), "label", o.getLabel()))
            .toList();
        return ResponseEntity.ok(lista);
    }
}
