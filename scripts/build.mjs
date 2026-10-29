// Bundles src/ into dist/extension.js. See AGENTS.md "Bundling model".
import * as esbuild from 'esbuild';

// pyright statically requires its message translations for 15 locales (~1.7 MB
// of a ~2.4 MB bundle). Ship English only, matching every other validator.
const englishOnly = {
    name: 'pyright-english-only',
    setup(build) {
        build.onLoad({ filter: /pyright-internal[\\/]dist[\\/]localization[\\/]package\.nls\.[\w-]+\.json$/ }, args =>
            args.path.endsWith('package.nls.en-us.json') ? undefined : { contents: '{}', loader: 'json' });
    }
};

await esbuild.build({
    entryPoints: ['src/extension.js'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    external: ['vscode'],
    // vscode-json-languageservice's UMD `main` uses conditional requires esbuild can't inline.
    mainFields: ['module', 'main'],
    minify: true,
    sourcemap: true,
    outfile: 'dist/extension.js',
    plugins: [englishOnly],
    logLevel: 'info'
});
