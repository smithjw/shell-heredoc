#!/usr/bin/env node
// Post-build smoke test: loads the BUNDLED dist/extension.js (not src/) with a
// stubbed vscode API, drives activate() with a document containing broken Python
// and JavaScript heredocs, and asserts diagnostics come back. This is the canary
// for esbuild failing to inline pyright/acorn — something the src-based unit
// tests structurally cannot catch.
const assert = require('assert');
const path = require('path');
const Module = require('module');

let captured = [];
const disposable = { dispose() {} };

const vscodeStub = {
    languages: {
        createDiagnosticCollection: () => ({
            set: (_uri, diags) => { captured = diags; },
            clear() {}, delete() {}, dispose() {}
        })
    },
    Range: class { constructor(sl, sc, el, ec) { this.start = { line: sl, character: sc }; this.end = { line: el, character: ec }; } },
    Diagnostic: class { constructor(range, message, severity) { this.range = range; this.message = message; this.severity = severity; } },
    DiagnosticSeverity: { Error: 0, Warning: 1, Information: 2, Hint: 3 },
    workspace: {
        getConfiguration: () => ({ get: () => undefined }), // defaults: all validators on
        onDidOpenTextDocument: () => disposable,
        onDidChangeTextDocument: () => disposable,
        onDidSaveTextDocument: () => disposable
    },
    window: { activeTextEditor: undefined, onDidChangeActiveTextEditor: () => disposable },
    commands: { registerCommand: () => disposable }
};

const origLoad = Module._load;
Module._load = function (request) {
    if (request === 'vscode') return vscodeStub;
    return origLoad.apply(this, arguments);
};

const lines = [
    'cat <<JSON',
    '{"a": }',      // broken JSON (json-languageservice has conditional requires)
    'JSON',
    'cat <<PY',
    'def f(:',      // broken Python
    'PY',
    'cat <<JS',
    'const x = ;',  // broken JavaScript
    'JS'
].join('\n').split('\n');

const doc = {
    languageId: 'shellscript',
    version: 1,
    uri: { toString: () => 'file:///smoke.sh' },
    lineCount: lines.length,
    lineAt: (i) => ({ text: lines[i] })
};

const bundlePath = path.join(__dirname, '..', 'dist', 'extension.js');
if (!require('fs').existsSync(bundlePath)) {
    console.error('smoke: dist/extension.js not found — run `pnpm run build` first');
    process.exit(1);
}
const ext = require(bundlePath);

// Drive validateDoc directly so the check is deterministic (no debounce timer).
const collection = vscodeStub.languages.createDiagnosticCollection();
(async () => {
    await ext.validateDoc(doc, collection, true);
    const messages = captured.map(d => d.message);

    // A validator that fails to inline throws inside validate(); extension.js turns
    // that into a "[heredoc:<lang>] Cannot find module ..." diagnostic — which would
    // otherwise satisfy the per-language substring checks below. Fail hard on it.
    const loadFailure = messages.find(m => /Cannot find module|is not a function|is not defined/.test(m));
    assert.ok(!loadFailure, `bundle emitted a load-failure diagnostic (a parser is not inlined): ${loadFailure}`);

    assert.ok(messages.some(m => m.includes('[heredoc:json]')), 'bundle produced no JSON diagnostic (json-languageservice not inlined?)');
    assert.ok(messages.some(m => m.includes('[heredoc:python]')), 'bundle produced no Python diagnostic (pyright not inlined?)');
    assert.ok(messages.some(m => m.includes('[heredoc:javascript]')), 'bundle produced no JavaScript diagnostic (acorn not inlined?)');
    console.log(`smoke: bundle OK — ${captured.length} diagnostics:`);
    for (const m of messages) console.log('  -', m);
})().catch(err => { console.error('smoke FAILED:', err.message); process.exit(1); });
