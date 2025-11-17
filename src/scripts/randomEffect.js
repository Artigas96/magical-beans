// scripts/randomEffect.js

async function randomMagicEffect({ actor, item, workflow }) {
  // Obtener el token del actor de forma robusta en la escena activa.
  const token = actor.getActiveTokens(true, true).find((t) => t.isOwner);

  const roll = await new Roll("1d100").roll({ async: true });

  await roll.toMessage({
    flavor: `Resultado mágico: ${roll.total}`,
    speaker: ChatMessage.getSpeaker({ actor }),
  });

  const total = roll.total;

  /**
   * APLICA UN EFECTO TEMPORAL COMPLETO
   * Se ha corregido el acceso a 'texture' y se usa el scope 'magical-beans'.
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

    // Usar el scope corregido: "magical-beans"
    if (actor.getFlag("magical-beans", key)) {
      ui.notifications.warn("Este efecto ya está activo.");
      return;
    }

    // Usar el scope corregido: "magical-beans"
    await actor.setFlag("magical-beans", key, true);

    // Añadir icono de efecto
    await token.toggleEffect(icon, { active: true });

    // GUARDAR EL TINTE ORIGINAL DE FORMA ROBUSTA
    const originalTint = token.document.texture?.tint;

    // Si hay tintado lo aplicamos
    if (tint) {
      await token.document.update({ "texture.tint": tint });
    }

    // FXMASTER
    let fxId = null;
    if (fx && game.modules.get("fxmaster")?.active) {
      const tokenCenter = token.center;
      fxId = await canvas.fxmaster.playEffects({
        name: fx,
        x: tokenCenter.x,
        y: tokenCenter.y,
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
      // Usar el scope corregido: "magical-beans"
      await actor.unsetFlag("magical-beans", key);

      // Eliminar icono
      await token.toggleEffect(icon, { active: false });

      // Restaurar tintado (solo si se había guardado un valor original)
      if (originalTint !== undefined) {
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

  // ----------- EFECTOS POR RANGO DE 1D100 -----------

  if (total === 1) {
    // 1: Se quedará a 1 punto de vida
    const currentHP = actor.system.attributes.hp.value;

    if (currentHP > 1) {
      await actor.update({ "system.attributes.hp.value": 1 });
      ChatMessage.create({
        flavor: `¡Resultado Mágico FATAL!`,
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `Un drenaje repentino de energía deja al personaje con **1 Punto de Vida** restante.`,
      });
      ui.notifications.error("¡Quedas a 1 HP!");
    } else {
      ChatMessage.create({
        flavor: `Resultado Mágico sin efecto.`,
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `El drenaje de energía es leve, la vida del personaje se mantiene en ${currentHP}.`,
      });
      ui.notifications.info("Ya estabas a 1 HP o menos.");
    }
  } else if (total <= 10) {
    // 2-10: Cambia el color de la piel
    const newTint = `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")}`;
    await applyVisualTimedEffect({
      key: "piel-arcoiris",
      duration: 60,
      tint: newTint,
      icon: "icons/magic/control/hypnosis-mesmerism-swirl.webp",
      fx: "magic_missile",
      onStart: () =>
        ui.notifications.info("¡Tu piel se vuelve de un color brillante!"),
      onEnd: () => ui.notifications.info("Tu piel vuelve a la normalidad."),
    });
  } else if (total <= 20) {
    // 11-20: Le cambiará el color del pelo
    // Usaremos tintado para simular el cambio, aunque el efecto es de pelo
    const newTint = `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")}`;
    await applyVisualTimedEffect({
      key: "pelo-color",
      duration: 60,
      tint: newTint,
      icon: "icons/equipment/head/hat-cowboy-red.webp",
      onStart: () =>
        ui.notifications.info("Tu pelo cambia a un color inesperado."),
      onEnd: () => ui.notifications.info("Tu pelo vuelve a la normalidad."),
    });
  } else if (total <= 30) {
    // 21-30: Levitara x metros (usaremos 10 metros/pies de elevación)
    await applyVisualTimedEffect({
      key: "levitar",
      duration: 20,
      icon: "icons/magic/air/wind-swirl-blue.webp",
      fx: "energy",
      onStart: async () => {
        await token.document.update({ elevation: 10 });
        ui.notifications.info("¡Comienzas a levitar 10 pies!");
      },
      onEnd: async () => {
        await token.document.update({ elevation: 0 });
        ui.notifications.info("Vuelves a tocar tierra.");
      },
    });
  } else if (total <= 40) {
    // 31-40: Le crecerá la lengua
    await applyVisualTimedEffect({
      key: "lengua-larga",
      duration: 120,
      icon: "icons/creatures/eyes/lizard-single-red.webp",
      onStart: () => ui.notifications.info("Tu lengua crece de forma grotesca"),
      onEnd: () => ui.notifications.info("Tu lengua vuelve a su tamaño normal"),
    });
  } else if (total <= 50) {
    // 41-50: En vez de hablar solo podra gritar
    await applyVisualTimedEffect({
      key: "solo-gritos",
      duration: 30,
      icon: "icons/skills/social/intimidate-shout.webp",
      onStart: () =>
        ui.notifications.info("¡Solo puedes comunicarte gritando!"),
      onEnd: () => ui.notifications.info("Vuelves a hablar normalmente."),
    });
  } else if (total <= 60) {
    // 51-60: En vez de hablar solo podra susurrar
    await applyVisualTimedEffect({
      key: "solo-susurros",
      duration: 30,
      icon: "icons/skills/social/intimidate-shout-silent.webp",
      onStart: () =>
        ui.notifications.info("¡Solo puedes comunicarte susurrando!"),
      onEnd: () => ui.notifications.info("Vuelves a hablar normalmente."),
    });
  } else if (total <= 70) {
    // 61-70: El personaje empezara a vomitar
    await applyVisualTimedEffect({
      key: "vomitos",
      duration: 10,
      icon: "icons/magic/unholy/projectile-glowing-bile.webp",
      fx: "bile",
      onStart: () =>
        ui.notifications.info("¡Empiezas a vomitar descontroladamente!"),
      onEnd: () => ui.notifications.info("Los vómitos han cesado."),
    });
  } else if (total <= 80) {
    // 71-80: El personaje empezara a emitir luz como si fuera una bombilla
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
      tint: "#FFFFCC",
      icon: "icons/magic/light/light-luminescence-yellow.webp",
      fx: "light_pulse",
      onStart: async () => {
        await token.document.update({
          light: {
            bright: 5,
            dim: 10,
            color: "#FFFFAA",
            alpha: 0.5,
            animation: { type: "pulse", speed: 2, intensity: 3 },
          },
        });
        ui.notifications.info("¡Te conviertes en una potente bombilla de luz!");
      },
      onEnd: async () => {
        await token.document.update({
          light: originalLight,
        });
        ui.notifications.info("Tu luz se apaga y vuelves a la normalidad.");
      },
    });
  } else if (total <= 90) {
    // 81-90: El personaje se petrifica
    await applyVisualTimedEffect({
      key: "petrificado",
      duration: 60,
      tint: "#808080", // Gris para simular piedra
      icon: "icons/magic/defensive/armor-stone-tiled.webp",
      onStart: async () => {
        ui.notifications.error(
          "¡El personaje se petrifica! No puede moverse ni actuar."
        );
        // Aquí se aplicaría la condición de Inmovilizado/Petrificado del sistema.
      },
      onEnd: () =>
        ui.notifications.info(
          "La petrificación termina. Vuelves a la normalidad."
        ),
    });
  } else if (total <= 99) {
    // 91-99: El personaje se cura 3d4
    const healRoll = await new Roll("3d4").roll({ async: true });

    await healRoll.toMessage({
      flavor: `¡Resultado Mágico de Curación! El personaje se cura ${healRoll.total} HP.`,
      speaker: ChatMessage.getSpeaker({ actor }),
    });

    const healAmount = healRoll.total;

    // Aplicar la curación (Ejemplo genérico D&D5e)
    const currentHP = actor.system.attributes.hp.value;
    const maxHP = actor.system.attributes.hp.max;

    const newHP = Math.min(currentHP + healAmount, maxHP);

    if (newHP > currentHP) {
      await actor.update({ "system.attributes.hp.value": newHP });
      ui.notifications.info(`El personaje se ha curado ${healAmount} HP.`);
    } else {
      ui.notifications.info("El personaje ya tiene la vida máxima.");
    }
  } else {
    // total == 100
    // 100: El personaje se cura al maximo, si ya lo esta tiene que estar inspirado
    const maxHP = actor.system.attributes.hp.max;
    const currentHP = actor.system.attributes.hp.value;

    if (currentHP < maxHP) {
      // Curación Máxima
      const healAmount = maxHP - currentHP;

      await actor.update({ "system.attributes.hp.value": maxHP });

      ChatMessage.create({
        flavor: `¡Resultado Mágico CRÍTICO! El personaje se cura COMPLETAMENTE. (+${healAmount} HP)`,
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `El personaje es sanado por completo por un destello de luz mágica. ¡Vida máxima restaurada!`,
      });

      ui.notifications.info(
        `¡Curación máxima! El personaje ha recuperado ${healAmount} HP.`
      );
    } else {
      // Ya a vida máxima, otorgar Inspiración.
      const hasInspiration = actor.system.attributes.inspiration;

      if (!hasInspiration) {
        // Otorgar Inspiración (Asumiendo D&D5e path)
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
