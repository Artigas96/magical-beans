// scripts/localizeItems.js

/**
 * Localiza dinámicamente los items de Magical Beans
 * Intercepta la creación y renderizado de items para localizar nombres y descripciones
 */

/**
 * Helper para localizar un item si contiene claves de i18n
 */
function localizeItemData(itemData) {
    const localized = { ...itemData };

    // Localizar el nombre si es una clave de i18n
    if (localized.name && localized.name.startsWith("MAGICAL_BEANS.")) {
        const localizedName = game.i18n.localize(localized.name);
        if (localizedName !== localized.name) {
            localized.name = localizedName;
        }
    }

    // Localizar la descripción si es una clave de i18n
    const description = localized.system?.description?.value;
    if (description && description.startsWith("MAGICAL_BEANS.")) {
        const localizedDescription = game.i18n.localize(description);
        if (localizedDescription !== description) {
            if (!localized.system) localized.system = {};
            if (!localized.system.description) localized.system.description = {};
            localized.system.description.value = localizedDescription;
        }
    }

    return localized;
}

/**
 * Hook: Cuando se crea un item desde el compendio al mundo/actor
 * Localiza el item antes de crearlo
 */
Hooks.on("preCreateItem", (item, data, options, userId) => {
    // Solo procesar items que vienen del compendio de magical-beans
    const sourceId = item.flags?.core?.sourceId;
    if (!sourceId || !sourceId.includes("magical-beans.magical-items")) {
        return;
    }

    // Localizar los datos del item
    const localizedData = localizeItemData(data);

    // Actualizar los datos del item antes de crearlo
    if (localizedData.name !== data.name) {
        item.updateSource({ name: localizedData.name });
    }

    if (localizedData.system?.description?.value !== data.system?.description?.value) {
        item.updateSource({ "system.description.value": localizedData.system.description.value });
    }

    console.log(`Magical Beans | Item localizado al importar: ${localizedData.name}`);
});

/**
 * Hook: Cuando se renderiza la hoja de un item
 * Asegura que los nombres y descripciones se muestren localizados
 */
Hooks.on("renderItemSheet", (app, html, data) => {
    const item = app.object;

    // Solo procesar items de magical-beans
    const sourceId = item.flags?.core?.sourceId;
    if (!sourceId || !sourceId.includes("magical-beans.magical-items")) {
        return;
    }

    // Localizar nombre en el título de la ventana
    if (item.name && item.name.startsWith("MAGICAL_BEANS.")) {
        const localizedName = game.i18n.localize(item.name);
        html.find(".window-title").text(localizedName);
    }

    // Localizar descripción en el contenido
    const description = item.system?.description?.value;
    if (description && description.startsWith("MAGICAL_BEANS.")) {
        const localizedDescription = game.i18n.localize(description);
        html.find(".editor-content").html(localizedDescription);
    }
});

/**
 * Hook: Cuando se renderiza el directorio de compendios
 * Localiza los nombres de los items en la lista del compendio
 */
Hooks.on("renderCompendium", async (app, html, data) => {
    // Solo procesar el compendio de magical-beans
    if (app.collection.metadata.id !== "magical-beans.magical-items") {
        return;
    }

    // Esperar un momento para que el contenido se renderice
    await new Promise(resolve => setTimeout(resolve, 100));

    // Localizar cada entrada del compendio
    html.find(".directory-item").each((i, el) => {
        const $el = $(el);
        const entryId = $el.data("document-id");

        if (entryId) {
            const item = app.collection.index.get(entryId);
            if (item && item.name && item.name.startsWith("MAGICAL_BEANS.")) {
                const localizedName = game.i18n.localize(item.name);
                $el.find(".document-name").text(localizedName);
            }
        }
    });

    console.log("Magical Beans | Compendio localizado en la UI");
});

console.log("Magical Beans | Sistema de localización de items cargado");
