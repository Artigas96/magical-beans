// scripts/localizeItems.js

/**
 * Localiza dinámicamente los items del compendio "magical-items"
 * Convierte las claves de i18n en los nombres y descripciones a sus valores localizados
 */
Hooks.once("ready", async () => {
    console.log("Magical Beans | Localizando items del compendio...");

    // Obtener el compendio
    const pack = game.packs.get("magical-beans.magical-items");
    if (!pack) {
        console.warn("Magical Beans | No se encontró el compendio 'magical-items'");
        return;
    }

    // Obtener todos los items del compendio
    const items = await pack.getDocuments();

    for (const item of items) {
        const updates = {};

        // Localizar el nombre si es una clave de i18n
        if (item.name && item.name.startsWith("MAGICAL_BEANS.")) {
            const localizedName = game.i18n.localize(item.name);
            if (localizedName !== item.name) {
                updates.name = localizedName;
            }
        }

        // Localizar la descripción si es una clave de i18n
        const description = item.system?.description?.value;
        if (description && description.startsWith("MAGICAL_BEANS.")) {
            const localizedDescription = game.i18n.localize(description);
            if (localizedDescription !== description) {
                updates["system.description.value"] = localizedDescription;
            }
        }

        // Aplicar actualizaciones si hay cambios
        if (Object.keys(updates).length > 0) {
            await item.update(updates);
            console.log(`Magical Beans | Item localizado: ${updates.name || item.name}`);
        }
    }

    console.log("Magical Beans | Localización de items completada");
});
