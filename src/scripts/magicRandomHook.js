Hooks.once("ready", () => {
    console.log("Magical Beans | Registrando hook de Midi-QOL...");

    // ========== SIN MIDI-QOL (Consumo manual estándar) ==========
    Hooks.on("dnd5e.postUseActivity", async (activity, config, options) => {
        const item = activity.item;
        const macroName = item.getFlag("magic-random-items", "macro");
        if (!macroName) return;

        const actor = item.actor;

        const macro = game.macros.getName(macroName);
        if (!macro) {
            ui.notifications.error(`No se encontró la macro: ${macroName}`);
            return;
        }

        console.log(`Usando consumible mágico sin MidiQOL: ${item.name}`);
        await macro.execute(actor);
    });


    // ========== CON MIDI-QOL (Impactos, flechas, bombas, etc.) ==========
    Hooks.on("midi-qol.RollComplete", async (workflow) => {
        if (!workflow.item) return;

        const item = workflow.item;
        const macroName = item.getFlag("magic-random-items", "macro");
        if (!macroName) return;

        // Solo disparar si realmente impactó o se consumió
        if (!workflow.hitTargets?.size && item.system.consumableType !== "bomb") return;

        const actor = workflow.actor;

        const macro = game.macros.getName(macroName);
        if (!macro) {
            ui.notifications.error(`No se encontró la macro: ${macroName}`);
            return;
        }

        console.log(`Ejecutando efecto mágico con MidiQOL para: ${item.name}`);

        // Si hay objetivos, se los pasamos
        let targetActor = null;
        if (workflow.hitTargets?.size) {
            targetActor = [...workflow.hitTargets][0].actor;
        }

        await macro.execute(actor, targetActor);
    });
});