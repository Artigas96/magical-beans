// scripts/randomEffect.js

// Función principal
async function randomMagicEffect({actor, item, workflow}) {
    const roll = await new Roll("1d100").roll({async: true});
    ui.notifications.info(`Resultado mágico: ${roll.total}`);

    // Efectos aleatorios
    if (roll.total <= 20) {
        await actor.applyDamage([{ value: -10 }]); // curación
        ui.notifications.info("¡Efecto: curación!");
    }
    else if (roll.total <= 40) {
        await actor.applyDamage([{ value: 10 }]);
        ui.notifications.info("¡Efecto: daño!");
    }
    else if (roll.total <= 60) {
        await actor.update({ "system.abilities.str.value": actor.system.abilities.str.value + 2 });
        ui.notifications.info("¡Aumenta tu fuerza temporalmente!");
    }
    else if (roll.total <= 80) {
        const target = workflow.targets.first();
        if (target) {
            await target.actor.applyDamage([{ value: 15 }]);
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
}

// HOOK que se ejecuta al usar objetos en D&D5e v4 (Foundry V12)
Hooks.on("dnd5e.useItem", async (item, config, options) => {
  const flag = item.getFlag("magic-random-items", "macro");
  if (!flag) return;

  const actor = item.actor;

  // Ejecutar la macro global
  const macro = game.macros.getName(flag);
  if (!macro) {
    ui.notifications.error(`No se encontró la macro: ${flag}`);
    return;
  }

  // Lanza tu efecto mágico
  await macro.execute(actor);

  console.log(`Efecto mágico aleatorio ejecutado para ${item.name}`);
});

