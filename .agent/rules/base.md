---
trigger: always_on
---

# Magical Beans - Módulo para FoundryVTT

## Descripción del Proyecto
Este es un módulo para **FoundryVTT v12** diseñado para el sistema **D&D 5e v4.4.3**. El módulo añade objetos mágicos con efectos especiales al compendio del juego, integrándose con **MidiQOL** para automatización de mecánicas y **fxmaster** para efectos visuales.

## Contexto Técnico

### Plataforma y Versiones
- **FoundryVTT**: Versión 12
- **Sistema de Juego**: D&D 5e (dnd5e) versión 4.4.3
- **Dependencias Principales**:
  - **MidiQOL**: Para automatización de tiradas, efectos y mecánicas de combate
  - **fxmaster**: Para efectos visuales y animaciones

### Estructura del Módulo
El módulo debe seguir la estructura estándar de FoundryVTT:
- `module.json`: Manifiesto del módulo con metadata, dependencias y configuración
- `scripts/`: Código JavaScript del módulo
- `styles/`: Hojas de estilo CSS
- `packs/`: Compendios con los objetos mágicos
- `lang/`: Archivos de localización/traducción

## Guías de Desarrollo

### Integración con MidiQOL
- Utilizar los hooks de MidiQOL para ejecutar efectos automáticos
- Configurar los items con las flags apropiadas de MidiQOL
- Implementar macros de item para efectos complejos
- Usar Active Effects para modificadores persistentes

### Integración con fxmaster
- Configurar efectos visuales mediante las APIs de fxmaster
- Sincronizar efectos visuales con las mecánicas de MidiQOL
- Considerar el rendimiento al usar múltiples efectos simultáneos

### Mejores Prácticas
- **Compatibilidad**: Asegurar compatibilidad con las versiones especificadas
- **Namespace**: Usar un namespace único para evitar conflictos (ej: `magicalBeans`)
- **Hooks**: Registrar hooks apropiadamente y limpiar listeners cuando sea necesario
- **Compendios**: Organizar items en compendios lógicos y bien estructurados
- **Localización**: Proporcionar strings localizables para soporte multiidioma
- **Documentación**: Documentar efectos especiales y configuraciones en los items

### APIs Relevantes de FoundryVTT v12
- `Hooks.on()` / `Hooks.once()`: Para eventos del sistema
- `game.settings.register()`: Para configuraciones del módulo
- `CONFIG.DND5E`: Configuración específica del sistema D&D 5e
- Active Effects API: Para efectos persistentes en actores/items

## Objetivos del Módulo
1. Crear una colección de objetos mágicos únicos con efectos automatizados
2. Integrar efectos visuales atractivos mediante fxmaster
3. Automatizar mecánicas de juego mediante MidiQOL
4. Proporcionar una experiencia de juego mejorada y fluida para D&D 5e