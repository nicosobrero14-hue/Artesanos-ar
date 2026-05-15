package com.nsobrero.blogArtesanos.controller;

import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.entity.ConfigRanking;
import com.nsobrero.blogArtesanos.enums.RolUsuario;
import com.nsobrero.blogArtesanos.repository.ConfigRankingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

/*
 * Config singleton del ranking. GET es público (cualquiera ve qué premio hay).
 * PUT es solo admin.
 */
@RestController
@RequestMapping("/api/ranking/config")
@RequiredArgsConstructor
public class ConfigRankingController {

    private final ConfigRankingRepository repo;

    @GetMapping
    public ResponseEntity<ConfigRanking> obtener() {
        ConfigRanking config = repo.findById(1L).orElseGet(() -> {
            ConfigRanking nuevo = new ConfigRanking();
            return repo.save(nuevo);
        });
        return ResponseEntity.ok(config);
    }

    @PutMapping
    @Transactional
    public ResponseEntity<?> editar(@RequestBody Map<String, Object> body,
                                    @AuthenticationPrincipal Artesano admin) {
        if (admin == null || admin.getRol() != RolUsuario.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("message", "Solo admins"));
        }
        ConfigRanking c = repo.findById(1L).orElseGet(ConfigRanking::new);
        c.setId(1L);
        if (body.containsKey("periodicidad")) c.setPeriodicidad((String) body.get("periodicidad"));
        if (body.containsKey("descripcionPremio")) c.setDescripcionPremio((String) body.get("descripcionPremio"));
        if (body.containsKey("reglasExtras")) c.setReglasExtras((String) body.get("reglasExtras"));
        if (body.containsKey("activo")) c.setActivo((Boolean) body.get("activo"));
        if (body.containsKey("fechaProximoOtorgamiento")) {
            String f = (String) body.get("fechaProximoOtorgamiento");
            c.setFechaProximoOtorgamiento(f != null && !f.isEmpty() ? LocalDate.parse(f) : null);
        }
        c.setUltimaModificacion(LocalDateTime.now());
        return ResponseEntity.ok(repo.save(c));
    }
}
