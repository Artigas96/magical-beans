import fs from "fs-extra";
import gulp from "gulp";
import prefix from "gulp-autoprefixer";
import sass from "gulp-dart-sass";
import sourcemaps from "gulp-sourcemaps";
import path from "node:path";
import { nanoid } from "nanoid";
import buffer from "vinyl-buffer";
import source from "vinyl-source-stream";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import rollupStream from "@rollup/stream";

import rollupConfig from "./rollup.config.mjs";

/** ******************/
/*  CONFIGURATION   */
/** ******************/

const packageId = "magical-beans";
const sourceDirectory = "./src";
const distDirectory = "./dist";
const stylesDirectory = `${sourceDirectory}/styles`;
const stylesExtension = "scss";
const sourceFileExtension = "js";
const staticFiles = ["items", "scripts", "lang", "packs", "module.json"];

/** ******************/
/*      BUILD       */
/** ******************/

let cache;

/**
 * Build the distributable JavaScript code
 */
function buildCode() {
	return rollupStream({ ...rollupConfig(), cache })
		.on("bundle", (bundle) => {
			cache = bundle;
		})
		.pipe(source(`${packageId}.js`))
		.pipe(buffer())
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest(`${distDirectory}/module`));
}

/**
 * Build style sheets
 */
function buildStyles() {
	return gulp.src([`${stylesDirectory}/${packageId}.${stylesExtension}`], { base: stylesDirectory })
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(sass({ outputStyle: "compressed" }).on("error", sass.logError))
		.pipe(prefix({
			cascade: false
		}))
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest(`${distDirectory}/styles`));
}

/**
 * Copy static files
 */
async function copyFiles() {
	for (const file of staticFiles) {
		if (fs.existsSync(`${sourceDirectory}/${file}`)) {
			await fs.copy(`${sourceDirectory}/${file}`, `${distDirectory}/${file}`);
		}
	}
}


/**
 * Build Compendium Database (.db) from source JSON files
 */
async function buildPacks(cb) {
	console.log("¡Tarea buildPacks iniciada!");
    const packName = "magic-items"; // Debe coincidir con el 'name' en module.json
    const sourcePath = path.join(sourceDirectory, "items");
    const targetPath = path.join(distDirectory, "packs", `${packName}.db`);

    // 1. Asegurar la carpeta de destino
    await fs.ensureDir(path.dirname(targetPath));

    try {
        // 2. Leer todos los archivos JSON de la carpeta fuente
        const filenames = (await fs.readdir(sourcePath)).filter(name => name.endsWith('.json'));
        let dbContent = '';

        console.log(`🔎 Procesando ${filenames.length} documentos para el compendio '${packName}'...`);

        // 3. Procesar cada archivo, añadir ID y formatear
        for (const filename of filenames) {
			const filePath = path.join(sourcePath, filename);
			const fileContent = await fs.readFile(filePath, 'utf8');
			
			try {
				const itemData = JSON.parse(fileContent);

				// Asignar el ID único de Foundry VTT
				itemData._id = nanoid(16); 

				// Convertir a JSON de una sola línea y añadir al contenido de la DB
				dbContent += JSON.stringify(itemData) + '\n';
				console.log(`\t✅ Procesado: ${filename}`); // Muestra el éxito
				
			} catch (e) {
				// ¡Si esto se imprime, tienes un JSON mal formateado!
				console.error(`\t❌ ERROR DE PARSEO en ${filename}: ${e.message}`); 
			}
		}
		
		console.log(`Tamaño del contenido a escribir: ${dbContent.length} bytes.`);
        // 4. Escribir el contenido final en el archivo .db
        await fs.writeFile(targetPath, dbContent);

        console.log(`\n🎉 Compendio '${packName}' generado en ${targetPath}`);

    } catch (error) {
        console.error(`\n❌ ERROR al construir el compendio '${packName}':`, error.message);
        // Llama al callback con el error para fallar la tarea de Gulp
        return cb(error); 
    }

    // Llama al callback si todo ha ido bien
    cb();
}

/**
 * Watch for changes for each build step
 */
export function watch() {
    gulp.watch(`${sourceDirectory}/**/*.${sourceFileExtension}`, { ignoreInitial: false }, buildCode);
    gulp.watch(`${stylesDirectory}/**/*.${stylesExtension}`, { ignoreInitial: false }, buildStyles);
    gulp.watch(
        staticFiles.map((file) => `${sourceDirectory}/${file}`),
        { ignoreInitial: false },
        copyFiles,
    );
    // Watch para los archivos JSON del compendio
    gulp.watch(`${sourceDirectory}/items/**/*.json`, { ignoreInitial: false }, buildPacks); // <-- Añadido el watcher para ítems
}

export const build = gulp.series(clean, gulp.parallel(buildCode, buildStyles, copyFiles, buildPacks));

/** ******************/
/*      CLEAN       */
/** ******************/

/**
 * Remove built files from `dist` folder while ignoring source files
 */
export async function clean() {
	const files = [...staticFiles, "module"];

	if (fs.existsSync(`${stylesDirectory}/${packageId}.${stylesExtension}`)) {
		files.push("styles");
	}

	console.log(" ", "Files to clean:");
	console.log("   ", files.join("\n    "));

	for (const filePath of files) {
		await fs.remove(`${distDirectory}/${filePath}`);
	}
}

/** ******************/
/*       LINK       */
/** ******************/

/**
 * Get the data paths of Foundry VTT based on what is configured in `foundryconfig.json`
 */
function getDataPaths() {
	const config = fs.readJSONSync("foundryconfig.json");
	const dataPath = config?.dataPath;

	if (dataPath) {
		const dataPaths = Array.isArray(dataPath) ? dataPath : [dataPath];

		return dataPaths.map((dataPath) => {
			if (typeof dataPath !== "string") {
				throw new Error(
					`Property dataPath in foundryconfig.json is expected to be a string or an array of strings, but found ${dataPath}`,
				);
			}
			if (!fs.existsSync(path.resolve(dataPath))) {
				throw new Error(`The dataPath ${dataPath} does not exist on the file system`);
			}
			return path.resolve(dataPath);
		});
	} else {
		throw new Error("No dataPath defined in foundryconfig.json");
	}
}

/**
 * Link build to User Data folder
 */
export async function link() {
	let destinationDirectory;
	if (fs.existsSync(path.resolve(sourceDirectory, "module.json"))) {
		destinationDirectory = "modules";
	} else {
		throw new Error("Could not find module.json");
	}

	const linkDirectories = getDataPaths().map((dataPath) =>
		path.resolve(dataPath, "Data", destinationDirectory, packageId),
	);

	const argv = yargs(hideBin(process.argv)).option("clean", {
		alias: "c",
		type: "boolean",
		default: false,
	}).argv;
	const clean = argv.c;

	for (const linkDirectory of linkDirectories) {
		if (clean) {
			console.log(`Removing build in ${linkDirectory}.`);

			await fs.remove(linkDirectory);
		} else if (!fs.existsSync(linkDirectory)) {
			console.log(`Linking dist to ${linkDirectory}.`);
			await fs.ensureDir(path.resolve(linkDirectory, ".."));
			await fs.symlink(path.resolve(distDirectory), linkDirectory);
		} else {
			console.log(`Skipped linking to ${linkDirectory}, as it already exists.`);
		}
	}
}