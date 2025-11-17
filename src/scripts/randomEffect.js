// scripts/randomEffect.js

async function randomMagicEffect({ actor, item, workflow }) {

    const token = canvas.tokens.get(actor.token?.id);
    const roll = await new Roll("1d100").roll({ async: true });

    await roll.toMessage({
        flavor: `Resultado mágico: ${roll.total}`,
        speaker: ChatMessage.getSpeaker({ actor })
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
            ui.notifications.error("No hay token en el canvas para aplicar efectos visuales");
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
            content: `<b>${key}</b> durará ${duration} segundos.`
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
                content: `El efecto <b>${key}</b> ha terminado.`
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
            onStart: () => ui.notifications.info("¡Tu piel se vuelve de colores brillantes!"),
            onEnd: () => ui.notifications.info("Tu piel vuelve a la normalidad.")
        });
    }

    else if (total <= 20) {
        await applyVisualTimedEffect({
            key: "luz-intensa",
            duration: 60,
            tint: "#FFFFAA",
            icon: "icons/magic/light/explosion-star-yellow.webp",
            fx: "light",
            onStart: () => ui.notifications.info("¡Brillas como si fueras una bombilla!"),
            onEnd: () => ui.notifications.info("Dejas de emitir luz.")
        });
    }

    else if (total <= 30) {
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
            }
        });
    }

    else if (total <= 40) {
        await applyVisualTimedEffect({
            key: "lengua-larga",
            duration: 120,
            icon: "icons/creatures/eyes/lizard-single-red.webp",
            onStart: () => ui.notifications.info("Tu lengua crece de forma grotesca"),
            onEnd: () => ui.notifications.info("Tu lengua vuelve a su tamaño normal")
        });
    }

    else if (total <= 50) {
        await applyVisualTimedEffect({
            key: "solo-gritos",
            duration: 30,
            icon: "icons/skills/social/intimidate-shout.webp",
        });
    }

    else if (total <= 60) {
        await applyVisualTimedEffect({
            key: "solo-susurros",
            duration: 30,
            icon: "icons/skills/social/intimidate-shout-silent.webp",
        });
    }

    else if (total <= 70) {
        await applyVisualTimedEffect({
            key: "vomitos",
            duration: 10,
            icon: "icons/magic/unholy/projectile-glowing-bile.webp",
            fx: "bile",
        });
    }

    // … aquí seguirían los efectos no temporales del 70 al 100
}

globalThis.randomMagicEffect = randomMagicEffect;
