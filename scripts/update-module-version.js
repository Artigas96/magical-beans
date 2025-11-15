const fs = require("fs");

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf8"));
const module = JSON.parse(fs.readFileSync("./module.json", "utf8"));

module.version = pkg.version;

fs.writeFileSync("./module.json", JSON.stringify(module, null, 2));

console.log(`Versión sincronizada: ${pkg.version}`);
