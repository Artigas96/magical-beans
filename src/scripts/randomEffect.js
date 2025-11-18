// scripts/randomEffect.js

async function randomMagicEffect({ actor, item, workflow }) {
  // Helper para localizar textos
  const i18n = (key, data = {}) => {
    return data ? game.i18n.format(key, data) : game.i18n.localize(key);
  };

  // Obtener el token del actor de forma robusta en la escena activa
  const tokens = actor.getActiveTokens(true, true);
  const token = tokens.find((t) => t.isOwner) || tokens[0];

  if (!token) {
    ui.notifications.error(i18n("MAGICAL_BEANS.MESSAGES.NoTokenFound"));
    return;
  }

  const roll = await new Roll("1d100").roll();

  await roll.toMessage({
    flavor: i18n("MAGICAL_BEANS.MESSAGES.MagicResult", { total: roll.total }),
    speaker: ChatMessage.getSpeaker({ actor }),
  });

  const total = roll.total;

  /**
   * APLICA UN EFECTO TEMPORAL COMPLETO
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
    // Verificar si el efecto ya está activo
    if (actor.getFlag("magical-beans", key)) {
      ui.notifications.warn(i18n("MAGICAL_BEANS.MESSAGES.EffectAlreadyActive"));
      return;
    }

    // Marcar el efecto como activo
    await actor.setFlag("magical-beans", key, true);

    // Añadir icono de efecto usando toggleEffect en el actor
    await actor.toggleStatusEffect(icon, { active: true });

    // Guardar el tinte original
    const originalTint = token.document.texture?.tint || null;

    // Aplicar tintado si se especifica
    if (tint) {
      await token.document.update({ "texture.tint": tint });
    }

    // FXMASTER (si está disponible)
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
      content: i18n("MAGICAL_BEANS.MESSAGES.EffectDuration", {
        effect: key,
        duration: duration,
      }),
    });

    // Al terminar el efecto
    setTimeout(async () => {
      await actor.unsetFlag("magical-beans", key);

      // Eliminar icono de efecto
      await actor.toggleStatusEffect(icon, { active: false });

      // Restaurar tintado original
      if (originalTint !== null) {
        await token.document.update({ "texture.tint": originalTint });
      }

      // Detener FX
      if (fxId && game.modules.get("fxmaster")?.active) {
        canvas.fxmaster.removeEffects(fxId);
      }

      onEnd();

      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: i18n("MAGICAL_BEANS.MESSAGES.EffectEnded", { effect: key }),
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
        flavor: i18n("MAGICAL_BEANS.EFFECTS.FatalDrain.Flavor"),
        speaker: ChatMessage.getSpeaker({ actor }),
        content: i18n("MAGICAL_BEANS.EFFECTS.FatalDrain.Description"),
      });
      ui.notifications.error(
        i18n("MAGICAL_BEANS.EFFECTS.FatalDrain.NotificationError")
      );
    } else {
      ChatMessage.create({
        flavor: i18n("MAGICAL_BEANS.EFFECTS.FatalDrain.Flavor"),
        speaker: ChatMessage.getSpeaker({ actor }),
        content: i18n("MAGICAL_BEANS.EFFECTS.FatalDrain.NoEffect", {
          hp: currentHP,
        }),
      });
      ui.notifications.info(
        i18n("MAGICAL_BEANS.EFFECTS.FatalDrain.NotificationInfo")
      );
    }
  } else if (total <= 10) {
    // 2-10: Cambia el color de la piel
    const newTint = `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")}`;
    await applyVisualTimedEffect({
      key: i18n("MAGICAL_BEANS.EFFECTS.RainbowSkin.Name"),
      duration: 60,
      tint: newTint,
      fx: "magic_missile",
      onStart: () =>
        ui.notifications.info(
          i18n("MAGICAL_BEANS.EFFECTS.RainbowSkin.NotificationStart")
        ),
      onEnd: () =>
        ui.notifications.info(
          i18n("MAGICAL_BEANS.EFFECTS.RainbowSkin.NotificationEnd")
        ),
    });
  } else if (total <= 20) {
    // 11-20: Le cambiará el color del pelo
    const newTint = `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")}`;
    await applyVisualTimedEffect({
      key: i18n("MAGICAL_BEANS.EFFECTS.ColorfulHair.Name"),
      duration: 60,
      tint: newTint,
      onStart: () =>
        ui.notifications.info(
          i18n("MAGICAL_BEANS.EFFECTS.ColorfulHair.NotificationStart")
        ),
      onEnd: () =>
        ui.notifications.info(
          i18n("MAGICAL_BEANS.EFFECTS.ColorfulHair.NotificationEnd")
        ),
    });
  } else if (total <= 30) {
    // 21-30: Levitará x metros (10 pies de elevación)
    await applyVisualTimedEffect({
      key: i18n("MAGICAL_BEANS.EFFECTS.Levitate.Name"),
      duration: 20,
      fx: "energy",
      onStart: async () => {
        await token.document.update({ elevation: 10 });
        ui.notifications.info(
          i18n("MAGICAL_BEANS.EFFECTS.Levitate.NotificationStart")
        );
      },
      onEnd: async () => {
        await token.document.update({ elevation: 0 });
        ui.notifications.info(
          i18n("MAGICAL_BEANS.EFFECTS.Levitate.NotificationEnd")
        );
      },
    });
  } else if (total <= 40) {
    // 31-40: Le crecerá la lengua
    await applyVisualTimedEffect({
      key: i18n("MAGICAL_BEANS.EFFECTS.LongTongue.Name"),
      duration: 120,
      onStart: () =>
        ui.notifications.info(
          i18n("MAGICAL_BEANS.EFFECTS.LongTongue.NotificationStart")
        ),
      onEnd: () =>
        ui.notifications.info(
          i18n("MAGICAL_BEANS.EFFECTS.LongTongue.NotificationEnd")
        ),
    });
  } else if (total <= 50) {
    // 41-50: En vez de hablar solo podrá gritar
    await applyVisualTimedEffect({
      key: i18n("MAGICAL_BEANS.EFFECTS.OnlyScreams.Name"),
      duration: 30,
      onStart: () =>
        ui.notifications.info(
          i18n("MAGICAL_BEANS.EFFECTS.OnlyScreams.NotificationStart")
        ),
      onEnd: () =>
        ui.notifications.info(
          i18n("MAGICAL_BEANS.EFFECTS.OnlyScreams.NotificationEnd")
        ),
    });
  } else if (total <= 60) {
    // 51-60: En vez de hablar solo podrá susurrar
    await applyVisualTimedEffect({
      key: i18n("MAGICAL_BEANS.EFFECTS.OnlyWhispers.Name"),
      duration: 30,
      onStart: () =>
        ui.notifications.info(
          i18n("MAGICAL_BEANS.EFFECTS.OnlyWhispers.NotificationStart")
        ),
      onEnd: () =>
        ui.notifications.info(
          i18n("MAGICAL_BEANS.EFFECTS.OnlyWhispers.NotificationEnd")
        ),
    });
  } else if (total <= 70) {
    // 61-70: El personaje empezará a vomitar
    await applyVisualTimedEffect({
      key: i18n("MAGICAL_BEANS.EFFECTS.Vomiting.Name"),
      duration: 10,
      fx: "bile",
      onStart: () =>
        ui.notifications.info(
          i18n("MAGICAL_BEANS.EFFECTS.Vomiting.NotificationStart")
        ),
      onEnd: () =>
        ui.notifications.info(
          i18n("MAGICAL_BEANS.EFFECTS.Vomiting.NotificationEnd")
        ),
    });
  } else if (total <= 80) {
    // 71-80: El personaje empezará a emitir luz como si fuera una bombilla
    const originalLight = foundry.utils.deepClone(token.document.light);

    await applyVisualTimedEffect({
      key: i18n("MAGICAL_BEANS.EFFECTS.Lightbulb.Name"),
      duration: 60,
      tint: "#FFFFCC",
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
        ui.notifications.info(
          i18n("MAGICAL_BEANS.EFFECTS.Lightbulb.NotificationStart")
        );
      },
      onEnd: async () => {
        await token.document.update({ light: originalLight });
        ui.notifications.info(
          i18n("MAGICAL_BEANS.EFFECTS.Lightbulb.NotificationEnd")
        );
      },
    });
  } else if (total <= 90) {
    // 81-90: El personaje se petrifica
    await applyVisualTimedEffect({
      key: i18n("MAGICAL_BEANS.EFFECTS.Petrified.Name"),
      duration: 60,
      tint: "#808080",
      onStart: async () => {
        ui.notifications.error(
          i18n("MAGICAL_BEANS.EFFECTS.Petrified.NotificationStart")
        );

        // Aplicar condición de paralizado
        const effect = CONFIG.statusEffects.find((e) => e.id === "paralysis");
        if (effect) {
          await actor.toggleStatusEffect("paralysis", { active: true });
        } else {
          // Fallback: crear un Active Effect manualmente
          await actor.createEmbeddedDocuments("ActiveEffect", [
            {
              name: i18n("MAGICAL_BEANS.EFFECTS.Petrified.Name"),
              origin: actor.uuid,
              disabled: false,
              duration: { seconds: 60 },
              flags: { "magical-beans": { petrified: true } },
            },
          ]);
        }
      },
      onEnd: async () => {
        ui.notifications.info(
          i18n("MAGICAL_BEANS.EFFECTS.Petrified.NotificationEnd")
        );

        // Remover condición
        await actor.toggleStatusEffect("paralysis", { active: false });

        // Remover Active Effect manual si existe
        const customEffect = actor.effects.find(
          (e) => e.flags["magical-beans"]?.petrified
        );
        if (customEffect) {
          await customEffect.delete();
        }
      },
    });
  } else if (total <= 99) {
    // 91-99: El personaje se cura 3d4
    const healRoll = await new Roll("3d4").roll();

    await healRoll.toMessage({
      flavor: i18n("MAGICAL_BEANS.EFFECTS.Healing.Flavor", {
        total: healRoll.total,
      }),
      speaker: ChatMessage.getSpeaker({ actor }),
    });

    const healAmount = healRoll.total;
    const currentHP = actor.system.attributes.hp.value;
    const maxHP = actor.system.attributes.hp.max;

    const newHP = Math.min(currentHP + healAmount, maxHP);

    if (newHP > currentHP) {
      await actor.update({ "system.attributes.hp.value": newHP });
      ui.notifications.info(
        i18n("MAGICAL_BEANS.EFFECTS.Healing.Notification", {
          amount: healAmount,
        })
      );
    } else {
      ui.notifications.info(i18n("MAGICAL_BEANS.MESSAGES.AlreadyMaxHP"));
    }
  } else {
    // total == 100: Curación máxima o inspiración
    const maxHP = actor.system.attributes.hp.max;
    const currentHP = actor.system.attributes.hp.value;

    if (currentHP < maxHP) {
      const healAmount = maxHP - currentHP;

      await actor.update({ "system.attributes.hp.value": maxHP });

      ChatMessage.create({
        flavor: i18n("MAGICAL_BEANS.EFFECTS.MaxHealing.Flavor", {
          amount: healAmount,
        }),
        speaker: ChatMessage.getSpeaker({ actor }),
        content: i18n("MAGICAL_BEANS.EFFECTS.MaxHealing.Description"),
      });

      ui.notifications.info(
        i18n("MAGICAL_BEANS.EFFECTS.MaxHealing.Notification", {
          amount: healAmount,
        })
      );
    } else {
      const hasInspiration = actor.system.attributes.inspiration;

      if (!hasInspiration) {
        await actor.update({ "system.attributes.inspiration": true });

        ChatMessage.create({
          flavor: i18n("MAGICAL_BEANS.EFFECTS.MaxHealing.InspirationFlavor"),
          speaker: ChatMessage.getSpeaker({ actor }),
          content: i18n(
            "MAGICAL_BEANS.EFFECTS.MaxHealing.InspirationDescription"
          ),
        });
        ui.notifications.info(
          i18n("MAGICAL_BEANS.EFFECTS.MaxHealing.InspirationNotification")
        );
      } else {
        ChatMessage.create({
          flavor: i18n("MAGICAL_BEANS.EFFECTS.MaxHealing.NoEffectFlavor"),
          speaker: ChatMessage.getSpeaker({ actor }),
          content: i18n("MAGICAL_BEANS.EFFECTS.MaxHealing.NoEffectDescription"),
        });
        ui.notifications.warn(
          i18n("MAGICAL_BEANS.MESSAGES.AlreadyHasInspiration")
        );
      }
    }
  }
}

// Exportar la función globalmente
globalThis.randomMagicEffect = randomMagicEffect;
