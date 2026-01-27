# Plan de Implementación: Mejoras de UI Mobile

**Estado**: Planificado

## ✅ Checklist de Tareas

### Infraestructura / Configuración

- [x] Instalar `framer-motion` para animaciones premium del menú.

### Código / Desarrollo

- [x] **Navbar**: Implementar el estado del menú y el componente de overlay móvil.
- [x] **Hero**: Refactorizar tamaños de fuente responsive (`text-4xl` base para móviles).
- [x] **Components**: Ajustar paddings y redondear bordes sutilmente en vistas verticales.
- [x] **Navegación**: Asegurar que los links del menú cierren el Drawer tras hacer clic.

### Validación (QA)

- [ ] Verificar build con `npm run build`.
- [ ] Realizar "Smoke Test" en dispositivos de diferentes anchos (320px, 375px, 414px).

## 🏁 Definition of Done (DoD)

1. Menú móvil 100% funcional con animación suave.
2. Hero legible y estético en pantallas de <=375px.
3. El build pasa sin errores de compilación.
