# AGENTS

This repository uses OpenCode agents to assist with development.

Guidelines:
- Keep edits minimal and focused; prefer pure JS dependencies for validation.
- Avoid introducing external runtime requirements for validators.
- For Python heredoc validation, we use `@zzzen/pyright-internal` to parse code in-process.
- Follow existing patterns in `src/extension.js` and `src/languages/*` for new languages.

Common Tasks:
- Build: `pnpm run build`
- Package: `pnpm run package`
- Publish: `pnpm run publish`

Notes:
- Large heredocs are skipped based on `shellHeredoc.maxBytes`.
- Toggle validators via settings under `Shell Heredoc`.
