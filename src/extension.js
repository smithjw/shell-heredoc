const vscode = require('vscode');
const { findBlocks, TAG_TO_HANDLER } = require('./heredoc');

// JSON Language Service (full) for richer diagnostics
const { getLanguageService } = require('vscode-json-languageservice');
// (avoid requiring internal ./services/* paths)
const { TextDocument } = require('vscode-languageserver-textdocument');
const yamlValidator = require('./languages/yaml');
const xmlValidator = require('./languages/xml');

// Initialize JSON language service once.
const jsonService = getLanguageService({});

async function validateJson(text) {
    // Create an in-memory TextDocument for the service
    const document = TextDocument.create('inmemory://model.json', 'json', 0, text);
    const jsonDoc = jsonService.parseJSONDocument(document);
    const diagnostics = await jsonService.doValidation(document, jsonDoc);
    return diagnostics.map(d => ({
        message: d.message,
        severity: 1, // map all to error; could map d.severity
        range: {
            start: { line: d.range.start.line, character: d.range.start.character },
            end: { line: d.range.end.line, character: d.range.end.character }
        }
    }));
}

const HANDLERS = {
    json: validateJson,
    yaml: yamlValidator.validate,
    xml: xmlValidator.validate
};

// Cache last diagnostics version per document to avoid redundant work.
const docVersionCache = new Map(); // uri -> version

function enabledFor(key) {
    const cfg = vscode.workspace.getConfiguration();
    if (key === 'json' && !cfg.get('shellHeredoc.validate.json')) return false;
    if (key === 'yaml' && !cfg.get('shellHeredoc.validate.yaml')) return false;
    if (key === 'xml' && !cfg.get('shellHeredoc.validate.xml')) return false;
    return true;
}

function maxBytes() {
    return vscode.workspace.getConfiguration().get('shellHeredoc.maxBytes');
}

function mapSeverity(s) {
    const VS = vscode.DiagnosticSeverity;
    return s === 1 ? VS.Error : s === 2 ? VS.Warning : s === 3 ? VS.Information : VS.Hint;
}

async function validateDoc(doc, collection, force = false) {
    if (!doc || doc.languageId !== 'shellscript') return;
    if (!force) {
        const lastVersion = docVersionCache.get(doc.uri.toString());
        if (lastVersion === doc.version) return; // unchanged
    }
    const diags = [];
    const blocks = findBlocks(doc);
    for (const b of blocks) {
        const key = TAG_TO_HANDLER[b.tag];
        const validator = HANDLERS[key];
        if (!validator || !enabledFor(key)) continue;
        const bodyLines = [];
        for (let ln = b.startLine; ln < b.endLine; ln++) bodyLines.push(doc.lineAt(ln).text);
        const text = bodyLines.join('\n');
        if (Buffer.byteLength(text, 'utf8') > maxBytes()) {
            // Provide informational diagnostic about skipped large block
            const range = new vscode.Range(b.startLine, 0, b.startLine, 0);
            const d = new vscode.Diagnostic(range, `[heredoc:${key}] skipped validation (exceeds size limit)`, vscode.DiagnosticSeverity.Information);
            diags.push(d);
            continue;
        }
        try {
            const results = await Promise.resolve(validator(text));
            for (const r of results) {
                if (!r.range) continue;
                const startLine = b.startLine + r.range.start.line;
                const endLine = b.startLine + r.range.end.line;
                const range = new vscode.Range(startLine, r.range.start.character, endLine, r.range.end.character);
                const messagePrefix = `[heredoc:${key}] `;
                const d = new vscode.Diagnostic(range, messagePrefix + r.message, mapSeverity(r.severity));
                diags.push(d);
            }
        } catch (err) {
            const range = new vscode.Range(b.startLine, 0, b.startLine, 0);
            diags.push(new vscode.Diagnostic(range, `[heredoc:${key}] ${err.message || err}`, vscode.DiagnosticSeverity.Error));
        }
    }
    collection.set(doc.uri, diags);
    docVersionCache.set(doc.uri.toString(), doc.version);
}

function activate(context) {
    const collection = vscode.languages.createDiagnosticCollection('heredoc');
    context.subscriptions.push(collection);
    const debounceMs = 250;
    let timer;
    const schedule = (doc) => {
        clearTimeout(timer);
        timer = setTimeout(() => validateDoc(doc, collection), debounceMs);
    };
    if (vscode.window.activeTextEditor) schedule(vscode.window.activeTextEditor.document);
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(schedule),
        vscode.workspace.onDidChangeTextDocument(e => schedule(e.document)),
        vscode.workspace.onDidSaveTextDocument(schedule),
        vscode.window.onDidChangeActiveTextEditor(ed => ed && schedule(ed.document))
    );

    // Command to force revalidation.
    const revalidateCmd = vscode.commands.registerCommand('shellHeredoc.revalidateCurrent', () => {
        const ed = vscode.window.activeTextEditor;
        if (ed) {
            docVersionCache.delete(ed.document.uri.toString());
            validateDoc(ed.document, collection, true);
        }
    });
    context.subscriptions.push(revalidateCmd);
}

function deactivate() { }

module.exports = { activate, deactivate };
