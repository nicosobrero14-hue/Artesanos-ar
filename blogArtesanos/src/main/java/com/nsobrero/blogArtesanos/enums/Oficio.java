package com.nsobrero.blogArtesanos.enums;

/*
 * Oficios / disciplinas artesanales. Es un enum cerrado para garantizar
 * consistencia en filtros y catálogo.
 *
 * Si en el futuro necesitamos más, los agregamos acá y queda automáticamente
 * disponible en frontend (el endpoint /api/oficios devuelve esta lista).
 *
 * NOMBRE_TECNICO("Nombre amigable") — el nombre técnico es lo que se guarda
 * en DB, el label es lo que ve el usuario.
 */
public enum Oficio {
    CUCHILLERIA("Cuchillería"),
    JOYERIA("Joyería"),
    MARROQUINERIA("Marroquinería"),
    TALABARTERIA("Talabartería"),
    CERAMICA("Cerámica"),
    TEXTIL("Textil"),
    TEJIDO("Tejido y crochet"),
    MADERA("Trabajo en madera"),
    METAL("Trabajo en metal"),
    ORFEBRERIA("Orfebrería"),
    MATE("Mates y bombillas"),
    VIDRIO("Vidrio"),
    PIEDRA("Piedra y mineral"),
    CUERO("Cuero"),
    PINTURA("Pintura y arte"),
    INSTRUMENTOS("Instrumentos musicales"),
    JUGUETES("Juguetes artesanales"),
    DECORACION("Decoración"),
    OTROS("Otros");

    private final String label;

    Oficio(String label) { this.label = label; }

    public String getLabel() { return label; }
}
