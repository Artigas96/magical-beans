import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const sourceModuleJsonPath = path.join(rootDir, 'src', 'module.json');
const distModuleJsonPath = path.join(rootDir, 'dist', 'module.json');

async function updateModuleVersion() {
    try {
        // Read package.json to get version
        const packageJson = await fs.readJson(packageJsonPath);
        const version = packageJson.version;

        if (!version) {
            throw new Error('No version found in package.json');
        }

        // Read source module.json
        const moduleJson = await fs.readJson(sourceModuleJsonPath);

        // Repository information
        const repoUrl = 'https://github.com/Artigas96/magical-beans';
        const manifestUrl = `${repoUrl}/releases/latest/download/module.json`;
        const downloadUrl = `${repoUrl}/releases/download/v${version}/module.zip`;

        // Replace placeholders ONLY if they haven't been replaced yet
        // This allows the GitHub Action to pre-populate these values
        if (moduleJson.version === 'This is auto replaced' || !moduleJson.version) {
            moduleJson.version = version;
            console.log(`   ✏️  Reemplazando version: ${version}`);
        } else {
            console.log(`   ✓  Version ya establecida: ${moduleJson.version}`);
        }

        if (moduleJson.url === 'This is auto replaced' || !moduleJson.url) {
            moduleJson.url = repoUrl;
            console.log(`   ✏️  Reemplazando url: ${repoUrl}`);
        } else {
            console.log(`   ✓  URL ya establecida: ${moduleJson.url}`);
        }

        if (moduleJson.manifest === 'This is auto replaced' || !moduleJson.manifest) {
            moduleJson.manifest = manifestUrl;
            console.log(`   ✏️  Reemplazando manifest: ${manifestUrl}`);
        } else {
            console.log(`   ✓  Manifest ya establecido: ${moduleJson.manifest}`);
        }

        if (moduleJson.download === 'This is auto replaced' || !moduleJson.download) {
            moduleJson.download = downloadUrl;
            console.log(`   ✏️  Reemplazando download: ${downloadUrl}`);
        } else {
            console.log(`   ✓  Download ya establecido: ${moduleJson.download}`);
        }

        // Ensure dist directory exists
        await fs.ensureDir(path.dirname(distModuleJsonPath));

        // Write to dist/module.json
        await fs.writeJson(distModuleJsonPath, moduleJson, { spaces: 2 });

        console.log(`✅ module.json procesado correctamente`);

    } catch (error) {
        console.error('❌ Error procesando module.json:', error.message);
        process.exit(1);
    }
}

updateModuleVersion();
