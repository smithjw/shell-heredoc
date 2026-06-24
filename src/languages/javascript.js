// JavaScript syntax validator using acorn (bundled, pure JS, no system deps).
const acorn = require('acorn');

// Heredoc snippets are often fragments piped to node, not whole programs, so
// allow top-level return/await and a hashbang. These are accepted in both parse
// modes and are valid as script anyway, so they don't mask real syntax errors.
const OPTS = {
    ecmaVersion: 'latest',
    allowReturnOutsideFunction: true,
    allowAwaitOutsideFunction: true,
    allowHashBang: true
};

function parseError(text, sourceType) {
    try {
        acorn.parse(text, Object.assign({ sourceType }, OPTS));
        return null;
    } catch (e) {
        return e;
    }
}

function validate(text) {
    // Accept either module or script syntax; only flag input that fails as both,
    // so valid `import`/`export` (module) and valid `with` (script) don't false-positive.
    const mErr = parseError(text, 'module');
    if (!mErr) return [];
    const sErr = parseError(text, 'script');
    if (!sErr) return [];
    // Both failed: report whichever parse advanced further (higher byte offset).
    // Otherwise module code with a typo would report the script-mode "import only
    // allowed with sourceType: module" error on line 1 instead of the real error.
    const err = (mErr.pos ?? 0) >= (sErr.pos ?? 0) ? mErr : sErr;
    // acorn SyntaxError: loc.line is 1-based, loc.column is 0-based.
    const line = typeof err.loc?.line === 'number' ? err.loc.line - 1 : 0;
    const character = typeof err.loc?.column === 'number' ? err.loc.column : 0;
    const message = (err.message || 'Invalid JavaScript').replace(/\s*\(\d+:\d+\)$/, '');
    return [{
        message,
        severity: 1,
        range: { start: { line, character }, end: { line, character: character + 1 } }
    }];
}

module.exports = { validate };
