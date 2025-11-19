import { nodeResolve } from "@rollup/plugin-node-resolve";

export default () => ({
	input: "src/scripts/randomEffect.js",
	output: {
		file: "dist/scripts/randomEffect.js",  // Cambiado de 'dir' a 'file' con ruta específica
		format: "es",
		sourcemap: false,  // Activado para debugging
	},
	plugins: [nodeResolve()],
});