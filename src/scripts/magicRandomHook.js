//scripts/magicRandomHook.js
Hooks.once("ready", () => {
  console.log("Magical Beans | Registrando hook de Midi-QOL...");

  Hooks.on("midi-qol.RollComplete", async (workflow) => {
    const item = workflow.item;
    if (!item) return;

    // Lee el macro desde los flags
    const macro = item.getFlag("magical-beans", "macro");
    if (!macro) return;

    console.log("Magical Beans | Item detectado:", item.name);
    console.log("Magical Beans | Ejecutando macro:", macro);

    // Variables necesarias para el contexto
    const actor = workflow.actor;
    const target = workflow.targets?.first() ?? null;

    try {
      // Crear una función asíncrona con el contexto correcto
      const macroFunction = new Function(
        "actor",
        "item",
        "workflow",
        "target",
        `return (async () => { ${macro} })()`
      );

      await macroFunction(actor, item, workflow, target);

      console.log("Magical Beans | Macro ejecutado exitosamente");
    } catch (err) {
      console.error("Magical Beans | Error ejecutando macro:", err);
      ui.notifications.error(`Error en Magical Beans: ${err.message}`);
    }
  });

  console.log("Magical Beans | Hook registrado correctamente");

  // Hook para detectar cuando se elimina manualmente un Active Effect
  Hooks.on("deleteActiveEffect", async (effect, options, userId) => {
    // Verificar si es un efecto temporal de magical-beans
    const isTemporaryEffect = effect.getFlag(
      "magical-beans",
      "temporaryEffect"
    );
    if (!isTemporaryEffect) return;

    const effectKey = effect.getFlag("magical-beans", "effectKey");
    if (!effectKey) return;

    const actor = effect.parent;
    if (!actor) return;

    console.log(
      `Magical Beans | Efecto "${effectKey}" eliminado manualmente, limpiando...`
    );

    // Limpiar el flag del actor
    await actor.unsetFlag("magical-beans", effectKey);

    // Cancelar el timeout si existe
    if (globalThis.activeEffectTimeouts) {
      const actorTimeouts = globalThis.activeEffectTimeouts.get(actor.id);
      if (actorTimeouts) {
        const timeoutId = actorTimeouts.get(effectKey);
        if (timeoutId) {
          clearTimeout(timeoutId);
          actorTimeouts.delete(effectKey);
          console.log(
            `Magical Beans | Timeout cancelado para "${effectKey}"`
          );

          // Limpiar el Map del actor si está vacío
          if (actorTimeouts.size === 0) {
            globalThis.activeEffectTimeouts.delete(actor.id);
          }
        }
      }
    }
  });
});
