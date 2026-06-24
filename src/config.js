// Pure config helpers, separated from the vscode API so they can be unit-tested.
// `cfg` is anything with a `.get(key)` method (vscode WorkspaceConfiguration).
const DEFAULT_MAX_BYTES = 200000;

function enabledFor(cfg, key) {
    // A validator is on unless its toggle is explicitly set to false.
    return cfg.get(`shellHeredoc.validate.${key}`) !== false;
}

function maxBytes(cfg) {
    const n = Number(cfg.get('shellHeredoc.maxBytes'));
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_BYTES;
}

module.exports = { enabledFor, maxBytes, DEFAULT_MAX_BYTES };
