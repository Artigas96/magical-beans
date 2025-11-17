// scripts/randomEffect.js

async function randomMagicEffect({ actor, item, workflow }) {
    const roll = await new Roll("1d100").roll({ async: true });
    await roll.toMessage({
        flavor: `Resultado mágico: ${roll.total}`,
        speaker: ChatMessage.getSpeaker({ actor })
    });

    const result = roll.total;

    // ==============================
    // 1 — Queda a 1 punto de vida
    // ==============================
    if (result === 1) {
        await actor.update({ "system.attributes.hp.value": 1 });
        ui.notifications.warn("¡Tu cuerpo se desmorona… pero quedas a 1 punto de vida!");
    }

    // ==============================
    // 2–10 — Cambia color de piel
    // ==============================
    else if (result >= 2 && result <= 10) {
        await actor.update({ "system.details.appearance": "Tu piel cambia de color de forma mágica." });
        ui.notifications.info("¡Tu piel cambia de color!");
    }

    // ==============================
    // 11–20 — Cambia color del pelo
    // ==============================
    else if (result >= 11 && result <= 20) {
        await actor.update({ "system.details.appearance": "Tu cabello cambia de color repentinamente." });
        ui.notifications.info("¡Tu pelo cambia de color!");
    }

    // ==============================
    // 21–30 — Levita X metros
    // ==============================
    else if (result >= 21 && result <= 30) {
        ui.notifications.info("¡Comienzas a levitar varios metros sobre el suelo!");
        
        // Animación opcional: efecto de elevación (no físico, solo flavor)
        ChatMessage.create({
            content: `<b>${actor.name}</b> levita mágicamente unos metros en el aire.`,
            speaker: ChatMessage.getSpeaker({ actor })
        });
    }

    // ==============================
    // 31–40 — Le crece la lengua
    // ==============================
    else if (result >= 31 && result <= 40) {
        ChatMessage.create({
            content: `${actor.name} siente cómo su lengua se alarga grotescamente.`,
            speaker: ChatMessage.getSpeaker({ actor })
        });
        ui.notifications.warn("¡Tu lengua crece de forma antinatural!");
    }

    // ==============================
    // 41–50 — Solo puede gritar
    // ==============================
    else if (result >= 41 && result <= 50) {
        actor.setFlag("magical-beans", "voiceEffect", "shout");
        ui.notifications.warn("¡Solo puedes comunicarte gritando!");
    }

    // ==============================
    // 51–60 — Solo puede susurrar
    // ==============================
    else if (result >= 51 && result <= 60) {
        actor.setFlag("magical-beans", "voiceEffect", "whisper");
        ui.notifications.warn("¡Tu voz se reduce a un susurro!");
    }

    // ==============================
    // 61–70 — Vomita
    // ==============================
    else if (result >= 61 && result <= 70) {
        ChatMessage.create({
            content: `${actor.name} empieza a vomitar de manera incontrolable 🤮`,
            speaker: ChatMessage.getSpeaker({ actor })
        });
        ui.notifications.info("No puedes evitar vomitar...");
    }

    // ==============================
    // 71–80 — Emite luz como una bombilla
    // ==============================
    else if (result >= 71 && result <= 80) {
        await actor.update({
            "system.attributes.senses.darkvision": 9999
        });

        ui.notifications.info("¡Brillas como una bombilla!");
    }

    // ==============================
    // 81–90 — Petrificación
    // ==============================
    else if (result >= 81 && result <= 90) {
        await actor.update({ "system.attributes.movement.all": 0 });

        ChatMessage.create({
            content: `${actor.name} se convierte en piedra completamente.`,
            speaker: ChatMessage.getSpeaker({ actor })
        });

        ui.notifications.error("¡Te petrificas!");
    }

    // ==============================
    // 91–99 — Se cura
    // ==============================
    else if (result >= 91 && result <= 99) {
        await actor.applyDamage([{ value: -20 }]);
        ui.notifications.info("¡Un aura mágica te cura!");
    }

    // ==============================
    // 100 — Cura completa
    // ==============================
    else if (result === 100) {
        await actor.update({ "system.attributes.hp.value": actor.system.attributes.hp.max });
        ui.notifications.info("¡Te curas por completo!");
    }
}

// 🔥 Clave para Foundry V12
globalThis.randomMagicEffect = randomMagicEffect;
