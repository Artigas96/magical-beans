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
const staticFiles = ["lang"];

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
		.pipe(source(`randomEffect.js`))
		.pipe(buffer())
		.pipe(gulp.dest(`${distDirectory}/scripts`));
}

/**
 * Copy additional script files that don't need bundling
 */
async function copyScripts() {
	const scriptFiles = [
		"magicRandomHook.js",
		"localizeItems.js"
	];

	await fs.ensureDir(`${distDirectory}/scripts`);

	for (const file of scriptFiles) {
		const sourcePath = `${sourceDirectory}/scripts/${file}`;
		const destPath = `${distDirectory}/scripts/${file}`;

		if (fs.existsSync(sourcePath)) {
			await fs.copy(sourcePath, destPath);
			console.log(`  Copiado: ${file}`);
		}
	}
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
			console.log(`  Copiado: ${file}`);
		}
	}
}

/**
 * Process module.json to replace version placeholders
 */
async function processModuleJson() {
	console.log("  Procesando module.json...");
	try {
		// Dynamically import the update script
		await import('./scripts/update-module-version.js');
	} catch (error) {
		console.error("  ❌ Error procesando module.json:", error.message);
		throw error;
	}
}



/**
 * Build Compendium Database (.db) from source JSON files
 */
async function buildPacks(cb) {
	console.log("¡Tarea buildPacks iniciada!");
	const packName = "magical-items";
	const sourcePath = path.join(sourceDirectory, "items");
	const targetPath = path.join(distDirectory, "packs", `${packName}.db`);

	await fs.ensureDir(path.dirname(targetPath));

	try {
		const filenames = (await fs.readdir(sourcePath)).filter(name => name.endsWith('.json'));
		let dbContent = '';

		console.log(`🔎 Procesando ${filenames.length} documentos para el compendio '${packName}'...`);

		for (const filename of filenames) {
			const filePath = path.join(sourcePath, filename);
			const fileContent = await fs.readFile(filePath, 'utf8');

			try {
				const itemData = JSON.parse(fileContent);
				itemData._id = nanoid(16);
				dbContent += JSON.stringify(itemData) + '\n';
				console.log(`\t✅ Procesado: ${filename}`);

			} catch (e) {
				console.error(`\t❌ ERROR DE PARSEO en ${filename}: ${e.message}`);
			}
		}

		console.log(`Tamaño del contenido a escribir: ${dbContent.length} bytes.`);
		await fs.writeFile(targetPath, dbContent);

		console.log(`\n🎉 Compendio '${packName}' generado en ${targetPath}`);

	} catch (error) {
		console.error(`\n❌ ERROR al construir el compendio '${packName}':`, error.message);
		return cb(error);
	}

	cb();
}

/**
 * Watch for changes for each build step
 */
export function watch() {
	gulp.watch(`${sourceDirectory}/**/*.${sourceFileExtension}`, { ignoreInitial: false }, gulp.series(buildCode, copyScripts));
	gulp.watch(`${stylesDirectory}/**/*.${stylesExtension}`, { ignoreInitial: false }, buildStyles);
	gulp.watch(
		staticFiles.map((file) => `${sourceDirectory}/${file}`),
		{ ignoreInitial: false },
		copyFiles,
	);
	gulp.watch(`${sourceDirectory}/items/**/*.json`, { ignoreInitial: false }, buildPacks);
}

export const build = gulp.series(clean, gulp.parallel(buildCode, copyScripts, buildStyles, copyFiles, buildPacks, processModuleJson));

/** ******************/
/*      CLEAN       */
/** ******************/

/**
 * Remove built files from `dist` folder while ignoring source files
 */
export async function clean() {
	const files = ["lang", "module.json", "scripts", "packs"];

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