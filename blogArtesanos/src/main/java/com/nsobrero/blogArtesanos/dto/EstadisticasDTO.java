package com.nsobrero.blogArtesanos.dto;

import java.math.BigDecimal;

//Resumen del panel del artesano
public record EstadisticasDTO(
     long totalPiezas,
     long piezasDisponibles,
     long piezasVendidas,
     long pedidosAbiertos,
     long pedidosListos,
     int totalHorasTrabajadas,
     BigDecimal totalFacturado,
     BigDecimal valorHoraPromedio,
     long mensajesNoLeidos,
     long visitasPerfil
) {}
