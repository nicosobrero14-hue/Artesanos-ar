package com.nsobrero.blogArtesanos.service;

import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.enums.PlanArtesano;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

/*
 * Tests del PlanService — la lógica central de freemium/premium.
 * No requieren Spring context, son unitarios puros.
 */
class PlanServiceTest {

    private final PlanService service = new PlanService();

    @Test
    void planNullSeTrataComoGratis() {
        Artesano a = new Artesano();
        a.setPlan(null);
        assertFalse(service.isPremium(a));
        assertEquals(PlanService.GRATIS_MAX_PIEZAS, service.maxPiezas(a));
        assertFalse(service.puedeDestacar(a));
    }

    @Test
    void gratisTieneLimitesCorrectos() {
        Artesano a = new Artesano();
        a.setPlan(PlanArtesano.GRATIS);
        assertFalse(service.isPremium(a));
        assertEquals(PlanService.GRATIS_MAX_PIEZAS, service.maxPiezas(a));
        assertEquals(PlanService.GRATIS_MAX_FOTOS_POR_PIEZA, service.maxFotosPorPieza(a));
        assertFalse(service.puedeDestacar(a));
    }

    @Test
    void premiumVitalicioEsPremiumActivo() {
        Artesano a = new Artesano();
        a.setPlan(PlanArtesano.PREMIUM);
        a.setFechaExpiracionPlan(null); // null = vitalicio
        assertTrue(service.isPremium(a));
        assertTrue(service.puedeDestacar(a));
    }

    @Test
    void premiumConFechaFuturaEsActivo() {
        Artesano a = new Artesano();
        a.setPlan(PlanArtesano.PREMIUM);
        a.setFechaExpiracionPlan(LocalDate.now().plusDays(30));
        assertTrue(service.isPremium(a));
    }

    @Test
    void premiumExpiradoNoEsPremium() {
        Artesano a = new Artesano();
        a.setPlan(PlanArtesano.PREMIUM);
        a.setFechaExpiracionPlan(LocalDate.now().minusDays(1));
        assertFalse(service.isPremium(a));
        // Aunque tenga plan=PREMIUM, los límites son los de GRATIS
        assertEquals(PlanService.GRATIS_MAX_PIEZAS, service.maxPiezas(a));
        assertFalse(service.puedeDestacar(a));
    }

    @Test
    void premiumExpiraHoyEsTodaviaPremium() {
        // La fecha de hoy es válida — vence "después de hoy"
        Artesano a = new Artesano();
        a.setPlan(PlanArtesano.PREMIUM);
        a.setFechaExpiracionPlan(LocalDate.now());
        assertTrue(service.isPremium(a));
    }
}
