# AGENTS

Guidance for AI coding agents working in this repository.

Guidelines:
- Keep edits minimal and focused; prefer pure JS dependencies for validation.
- Avoid introducing external runtime requirements for validators (no system interpreters, no subprocesses).
- For Python heredoc validation, we use `@zzzen/pyright-internal` to parse code in-process; for JavaScript we use `acorn`.
- Follow existing patterns in `src/extension.js` and `src/languages/*` for new languages.

Bundling model:
- Everything `require()`d from `src/` is bundled by esbuild into `dist/extension.js`. The vsix ships only `dist/` — no `node_modules`.
- Runtime libs therefore live in `devDependencies` (they are build-time inputs to the bundle), and `dependencies` is empty. Do NOT add a validator lib to esbuild's `--external` list or it will fail to load at runtime.
- Only `vscode` and node builtins are external. `vscode-json-languageservice` needs `--main-fields=module,main` so esbuild follows its ESM build (the UMD `main` uses conditional requires esbuild can't inline).
- `pnpm run smoke` loads the built bundle (not `src/`) and asserts json/python/javascript diagnostics come back — this is the canary for a dependency failing to inline. It runs before `package`/`publish`.

Adding a new language validator:
1. Create `src/languages/<name>.js` exporting `validate(text)` → array of `{ message, severity, range:{start:{line,character},end:{line,character}} }` (0-based lines). Return `[]` when valid.
2. Add the heredoc tag(s) → validator key in `TAG_TO_HANDLER` (`src/heredoc.js`).
3. Add the key → validate function in `HANDLERS` (`src/extension.js`).
4. Add a `shellHeredoc.validate.<key>` boolean setting (default true) in `package.json`.
5. Add the highlighting scope mapping in `scripts/build-grammar.mjs` if the tag isn't already highlighted.
6. Add tests under `test/` and a broken block to `scripts/smoke.js`.

Error-handling convention: let a validator throw only for unexpected/internal failures (e.g. a bundled parser API breaking) — `extension.js` turns a throw into a visible diagnostic so the breakage isn't silent. Catch and translate the parser's *normal* syntax errors into the diagnostic shape above.

Common Tasks:
- Build: `pnpm run build`
- Test: `pnpm test`
- Smoke-test the bundle: `pnpm run smoke`
- Package: `pnpm run package`
- Publish: `pnpm run publish`

Notes:
- Large heredocs are skipped based on `shellHeredoc.maxBytes`.
- Toggle validators via settings under `Shell Heredoc`.
- `<<-` heredocs have leading tabs stripped before validation, mirroring bash.
