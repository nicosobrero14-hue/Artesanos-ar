package com.nsobrero.blogArtesanos.service;

import com.nsobrero.blogArtesanos.entity.Artesano;
import com.nsobrero.blogArtesanos.enums.PlanArtesano;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

/*
 * Servicio central que define los límites de cada plan
 * y centraliza la lógica de "este artesano puede hacer X".
 *
 * Si en el futuro agregamos planes nuevos (ENTERPRISE, etc),
 * o cambiamos los números, todo se modifica acá en un solo lugar.
 */
@Service
public class PlanService {

    // Límites del plan GRATIS
    public static final int GRATIS_MAX_PIEZAS = 3;
    public static final int GRATIS_MAX_FOTOS_POR_PIEZA = 3;
    public static final boolean GRATIS_PUEDE_DESTACAR = false;

    // Límites del plan PREMIUM
    public static final int PREMIUM_MAX_PIEZAS = Integer.MAX_VALUE;
    public static final int PREMIUM_MAX_FOTOS_POR_PIEZA = 15;
    public static final boolean PREMIUM_PUEDE_DESTACAR = true;

    /*
     * Es premium si plan == PREMIUM y la fecha de expiración no venció.
     * Si fechaExpiracionPlan es null y plan == PREMIUM, lo tratamos como
     * vitalicio (caso útil para cuentas de prueba o admin).
     */
    public boolean isPremium(Artesano artesano) {
        if (artesano.getPlan() != PlanArtesano.PREMIUM) return false;
        LocalDate expira = artesano.getFechaExpiracionPlan();
        return expira == null || !expira.isBefore(LocalDate.now());
    }

    public int maxPiezas(Artesano artesano) {
        return isPremium(artesano) ? PREMIUM_MAX_PIEZAS : GRATIS_MAX_PIEZAS;
    }

    public int maxFotosPorPieza(Artesano artesano) {
        return isPremium(artesano) ? PREMIUM_MAX_FOTOS_POR_PIEZA : GRATIS_MAX_FOTOS_POR_PIEZA;
    }

    public boolean puedeDestacar(Artesano artesano) {
        return isPremium(artesano) ? PREMIUM_PUEDE_DESTACAR : GRATIS_PUEDE_DESTACAR;
    }
}
