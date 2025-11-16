//scripts/magicRandomHook.js
Hooks.once("ready", () => {
    console.log("Magical Beans | Registrando hook de Midi-QOL...");

    // ========== SIN MIDI-QOL (Consumo manual estándar) ==========
    // Hooks.on("midi-qol.RollComplete", async (workflow) => {
    //     const item = workflow.item;

    //     // Evita errores si no hay item o no es consumible
    //     if (!item) return;
    //     if (item.type !== "consumable") return;

    //     // Lee el macro desde los flags
    //     const macro = item.getFlag("magical-beans", "macro");
    //     if (!macro) return;

    //     console.log("Magical Beans | Ejecutando macro:", macro);

    //     try {
    //     // Evaluamos la expresión: randomMagicEffect(actor, target)
    //     const actor = workflow.actor;
    //     const target = workflow?.targets?.first() ?? null;

    //     // eval seguro entre comillas
    //     await eval(macro);
    //     } catch (err) {
    //     console.error("Magical Beans | Error ejecutando macro:", err);
    //     }
    // });




    // ========== CON MIDI-QOL (Impactos, flechas, bombas, etc.) ==========
    Hooks.on("midi-qol.RollComplete", async (workflow) => {
        const item = workflow.item;
        if (!item) return;

        // lee desde el scope CORRECTO
        const macro = item.getFlag("magical-beans", "macro");
        if (!macro) return;

        console.log("Magical Beans | Ejecutando:", macro);

        const actor = workflow.actor;
        const target = workflow.targets.first() ?? null;

        try {
        await eval(macro);
        } catch (err) {
        console.error("Magical Beans | Error ejecutando macro:", err);
        }
    });

});