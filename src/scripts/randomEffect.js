// scripts/randomEffect.js
globalThis.randomMagicEffect = async function (actor, target = null) {
    const roll = await new Roll("1d100").roll({async: true});
    ui.notifications.info(`Resultado mágico: ${roll.total}`);

    // Ejemplo simple de tabla de efectos
    if (roll.total <= 20) {
        actor.applyDamage(-10); // cura 10
        ui.notifications.info("¡Efecto: curación!");
    }
    else if (roll.total <= 40) {
        actor.applyDamage(10); // daño 10
        ui.notifications.info("¡Efecto: daño!");
    }
    else if (roll.total <= 60) {
        actor.update({ "system.abilities.str.value": actor.system.abilities.str.value + 2 });
        ui.notifications.info("¡Aumenta tu fuerza temporalmente!");
    }
    else if (roll.total <= 80) {
        if (target) {
            target.applyDamage(15);
            ui.notifications.info("¡La explosión daña al objetivo!");
        }
    }
    else {
        await actor.createEmbeddedDocuments("Item", [{
            name: "Bendición Arcana",
            type: "feat",
            system: { description: { value: "Beneficio mágico misterioso." } }
        }]);
        ui.notifications.info("¡Ganas una bendición aleatoria!");
    }
};
