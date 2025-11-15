const fs = require("fs");

// Argumento recibido desde Github Action
const version = process.argv[2];

if (!version) {
    console.error("No se recibió versión en update-module-version.js");
    process.exit(1);
}

console.log("Aplicando versión:", version);

const modulePath = "./module.json";
const moduleData = JSON.parse(fs.readFileSync(modulePath, "utf8"));

moduleData.version = version;

// Actualizar download URL y manifest URL automáticamente
const repo = process.env.GITHUB_REPOSITORY; // ej: "JavierArtigas/magic-random-items"

moduleData.download = `https://github.com/${repo}/releases/download/v${version}/module.zip`;
moduleData.manifest = `https://raw.githubusercontent.com/${repo}/main/module.json`;

fs.writeFileSync(modulePath, JSON.stringify(moduleData, null, 2));

console.log("module.json actualizado correctamente");
