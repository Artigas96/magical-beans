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
});
