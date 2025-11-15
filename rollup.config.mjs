import { nodeResolve } from "@rollup/plugin-node-resolve";

export default () => ({
	input: "src/scripts/randomEffect.js",
	output: {
		dir: "dist/scripts",
		format: "es",
		sourcemap: false,
	},
	plugins: [nodeResolve()],
});