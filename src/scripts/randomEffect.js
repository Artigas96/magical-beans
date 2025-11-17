// scripts/randomEffect.js

async function randomMagicEffect({ actor, item, workflow }) {
  const token = actor.getActiveTokens(true, true).find((t) => t.isOwner);
  const roll = await new Roll("1d100").roll({ async: true });

  await roll.toMessage({
    flavor: `Resultado mágico: ${roll.total}`,
    speaker: ChatMessage.getSpeaker({ actor }),
  });

  const total = roll.total;

  /**
   * APLICA UN EFECTO TEMPORAL COMPLETO
   * - flag
   * - icono de efecto
   * - tintado
   * - fxmaster opcional
   */
  async function applyVisualTimedEffect({
    key,
    duration,
    icon = "icons/magic/light/explosion-star-blue.webp",
    tint = null,
    fx = null,
    onStart = () => {},
    onEnd = () => {},
  }) {
    if (!token) {
      ui.notifications.error(
        "No hay token en el canvas para aplicar efectos visuales"
      );
      return;
    }

    if (actor.getFlag("random-magic", key)) {
      ui.notifications.warn("Este efecto ya está activo.");
      return;
    }

    await actor.setFlag("random-magic", key, true);

    // Añadir icono de efecto
    await token.object.toggleEffect(icon, { active: true });

    // Guardamos el tinte original
    const originalTint = token.document.texture.tint;

    // Si hay tintado lo aplicamos
    if (tint) {
      await token.document.update({ "texture.tint": tint });
    }

    // FXMASTER
    let fxId = null;
    if (fx && game.modules.get("fxmaster")?.active) {
      fxId = await canvas.fxmaster.playEffects({
        name: fx,
        x: token.center.x,
        y: token.center.y,
        anchor: { x: 0.5, y: 0.5 },
      });
    }

    onStart();

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<b>${key}</b> durará ${duration} segundos.`,
    });

    // Al terminar…
    setTimeout(async () => {
      await actor.unsetFlag("random-magic", key);

      // Eliminar icono
      await token.object.toggleEffect(icon, { active: false });

      // Restaurar tintado
      if (tint) {
        await token.document.update({ "texture.tint": originalTint });
      }

      // Detener FX
      if (fxId && game.modules.get("fxmaster")?.active) {
        canvas.fxmaster.removeEffects(fxId);
      }

      onEnd();

      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `El efecto <b>${key}</b> ha terminado.`,
      });
    }, duration * 1000);
  }

  // ----------- EFECTOS -----------

  if (total <= 10) {
    await applyVisualTimedEffect({
      key: "piel-arcoiris",
      duration: 60,
      tint: "#00FFFF",
      icon: "icons/magic/control/hypnosis-mesmerism-swirl.webp",
      fx: "magic_missile", // FXMaster efecto simple
      onStart: () =>
        ui.notifications.info("¡Tu piel se vuelve de colores brillantes!"),
      onEnd: () => ui.notifications.info("Tu piel vuelve a la normalidad."),
    });
  } else if (total <= 20) {
    await applyVisualTimedEffect({
      key: "luz-intensa",
      duration: 60,
      tint: "#FFFFAA",
      icon: "icons/magic/light/explosion-star-yellow.webp",
      fx: "light",
      onStart: () =>
        ui.notifications.info("¡Brillas como si fueras una bombilla!"),
      onEnd: () => ui.notifications.info("Dejas de emitir luz."),
    });
  } else if (total <= 30) {
    await applyVisualTimedEffect({
      key: "levitar",
      duration: 20,
      icon: "icons/magic/air/wind-swirl-blue.webp",
      fx: "energy",
      onStart: async () => {
        await token.document.update({ elevation: 10 });
      },
      onEnd: async () => {
        await token.document.update({ elevation: 0 });
      },
    });
  } else if (total <= 40) {
    await applyVisualTimedEffect({
      key: "lengua-larga",
      duration: 120,
      icon: "icons/creatures/eyes/lizard-single-red.webp",
      onStart: () => ui.notifications.info("Tu lengua crece de forma grotesca"),
      onEnd: () => ui.notifications.info("Tu lengua vuelve a su tamaño normal"),
    });
  } else if (total <= 50) {
    await applyVisualTimedEffect({
      key: "solo-gritos",
      duration: 30,
      icon: "icons/skills/social/intimidate-shout.webp",
    });
  } else if (total <= 60) {
    await applyVisualTimedEffect({
      key: "solo-susurros",
      duration: 30,
      icon: "icons/skills/social/intimidate-shout-silent.webp",
    });
  } else if (total <= 70) {
    await applyVisualTimedEffect({
      key: "vomitos",
      duration: 10,
      icon: "icons/magic/unholy/projectile-glowing-bile.webp",
      fx: "bile",
    });
  } else if (total <= 80) {
    const originalLight = {
      bright: token.document.light.bright,
      dim: token.document.light.dim,
      color: token.document.light.color,
      alpha: token.document.light.alpha,
      animation: token.document.light.animation,
    };

    await applyVisualTimedEffect({
      key: "bombilla",
      duration: 60,
      tint: "#FFFFCC", // Tinte amarillo claro
      icon: "icons/magic/light/light-luminescence-yellow.webp",
      fx: "light_pulse", // Si tienes FXMaster, usa un efecto de luz o similar
      onStart: async () => {
        ui.notifications.info("¡Te conviertes en una potente bombilla de luz!");
        // Aplicar propiedades de luz intensa
        await token.document.update({
          light: {
            bright: 5,
            dim: 10,
            color: "#FFFFAA",
            alpha: 0.5,
            animation: { type: "pulse", speed: 2, intensity: 3 },
          },
        });
      },
      onEnd: async () => {
        ui.notifications.info("Tu luz se apaga y vuelves a la normalidad.");
        // Restaurar propiedades de luz originales
        await token.document.update({
          light: originalLight,
        });
      },
    });
  } else if (total <= 90) {
    // NUEVO EFECTO: PETRIFICADO
    await applyVisualTimedEffect({
      key: "petrificado",
      duration: 60,
      tint: "#808080", // Tinte gris para simular piedra
      icon: "icons/magic/defensive/armor-stone-tiled.webp", // Icono de piedra/petrificación
      fx: null,
      onStart: async () => {
        ui.notifications.error(
          "¡El personaje se petrifica! No puede moverse ni actuar."
        );
        // Dependiendo de tu sistema de juego (D&D5e, PF2e, etc.)
        // aquí podrías crear un Active Effect (o aplicar una condición)
        // para la inmovilización.
        // Ejemplo genérico (requiere el módulo 'Combat Utility Belt' o similar para aplicar condiciones):
        // if (game.cub?.hasCondition) {
        //   game.cub.addCondition("Paralyzed", {token, skipNotification: true});
        // }
      },
      onEnd: async () => {
        ui.notifications.info(
          "La petrificación termina. Vuelves a la normalidad."
        );
        // Quitar condición si fue aplicada
        // if (game.cub?.hasCondition) {
        //   game.cub.removeCondition("Paralyzed", {token, skipNotification: true});
        // }
      },
    });
  } else if (total <= 99) {
    // EFECTO: CURACIÓN 3D4
    const healRoll = await new Roll("3d4").roll({ async: true });

    // 1. Mostrar el resultado de la curación en el chat
    await healRoll.toMessage({
      flavor: `¡Resultado Mágico de Curación! El personaje se cura ${healRoll.total} HP.`,
      speaker: ChatMessage.getSpeaker({ actor }),
    });

    const healAmount = healRoll.total;

    // 2. Aplicar la curación al actor (Requiere manejo de sistema de juego)

    // *******************************************************************
    // LÓGICA DE CURACIÓN ESPECÍFICA DEL SISTEMA (Ejemplo genérico para D&D5e)
    // *******************************************************************

    // Asumiendo que el actor tiene una estructura de HP en 'system.attributes.hp'
    const currentHP = actor.system.attributes.hp.value;
    const maxHP = actor.system.attributes.hp.max;

    // Calcular la nueva vida, sin exceder el máximo (maxHP)
    const newHP = Math.min(currentHP + healAmount, maxHP);

    // Aplicar la actualización si es necesario
    if (newHP > currentHP) {
      await actor.update({ "system.attributes.hp.value": newHP });
      ui.notifications.info(`El personaje se ha curado ${healAmount} HP.`);
    } else {
      ui.notifications.info("El personaje ya tiene la vida máxima.");
    }
  } else {
    // total == 100
    // EFECTO: CURACIÓN MÁXIMA O INSPIRACIÓN
    const maxHP = actor.system.attributes.hp.max;
    const currentHP = actor.system.attributes.hp.value;

    if (currentHP < maxHP) {
      // 1. Curación Máxima
      const healAmount = maxHP - currentHP;

      // Aplicar la curación
      await actor.update({ "system.attributes.hp.value": maxHP });

      // Mostrar el resultado de la curación en el chat
      ChatMessage.create({
        flavor: `¡Resultado Mágico CRÍTICO! El personaje se cura COMPLETAMENTE. (+${healAmount} HP)`,
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `El personaje es sanado por completo por un destello de luz mágica. ¡Vida máxima restaurada!`,
      });

      ui.notifications.info(
        `¡Curación máxima! El personaje ha recuperado ${healAmount} HP.`
      );
    } else {
      // 2. Ya está a vida máxima, otorgar Inspiración.

      // NOTA: 'system.attributes.inspiration' es la ruta común para Inspiración en D&D 5e.
      const hasInspiration = actor.system.attributes.inspiration;

      if (!hasInspiration) {
        // Otorgar Inspiración
        await actor.update({ "system.attributes.inspiration": true });

        ChatMessage.create({
          flavor: `Resultado Mágico CRÍTICO, ¡Inspiración ganada!`,
          speaker: ChatMessage.getSpeaker({ actor }),
          content: `Un aura de magia rodea al personaje, cuya vitalidad ya es máxima. La energía mágica se canaliza en **Inspiración**.`,
        });
        ui.notifications.info(
          "¡Inspiración otorgada! El personaje ya estaba a máxima vida."
        );
      } else {
        // Ya a vida máxima y ya tiene Inspiración
        ChatMessage.create({
          flavor: `Resultado Mágico CRÍTICO, pero sin efecto adicional.`,
          speaker: ChatMessage.getSpeaker({ actor }),
          content: `Un aura de magia rodea al personaje, pero su vitalidad ya es máxima y ya ha sido Inspirado.`,
        });
        ui.notifications.warn(
          "El personaje ya tiene la vida máxima y ya tiene Inspiración."
        );
      }
    }
  }
}

globalThis.randomMagicEffect = randomMagicEffect;
