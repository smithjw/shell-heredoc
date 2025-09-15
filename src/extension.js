const vscode = require('vscode');
const { findBlocks, TAG_TO_HANDLER } = require('./heredoc');
const jsonValidator = require('./languages/json');

const HANDLERS = {
    json: jsonValidator.validate
    // Add more handlers down the line
};

function mapSeverity(s) {
    const VS = vscode.DiagnosticSeverity;
    return s === 1 ? VS.Error : s === 2 ? VS.Warning : s === 3 ? VS.Information : VS.Hint;
}

async function validateDoc(doc, collection) {
    if (doc.languageId !== 'shellscript') return;

    const diags = [];
    const blocks = findBlocks(doc);

    for (const b of blocks) {
        const handlerKey = TAG_TO_HANDLER[b.tag];
        const validate = HANDLERS[handlerKey];
        if (!validate) continue;

        // Extract heredoc body
        const lines = [];
        for (let ln = b.startLine; ln < b.endLine; ln++) lines.push(doc.lineAt(ln).text);
        const text = lines.join('\n');

        try {
            const results = await validate(text);
            for (const r of results) {
                const range = new vscode.Range(
                    b.startLine + r.range.start.line,
                    r.range.start.character,
                    b.startLine + r.range.end.line,
                    r.range.end.character
                );
                const diag = new vscode.Diagnostic(range, r.message, mapSeverity(r.severity));
                diag.source = `heredoc-${handlerKey}`;
                diags.push(diag);
            }
        } catch (err) {
            // If a validator throws, surface a single-line error at block start
            const msg = (err && err.message) ? err.message : String(err);
            diags.push(new vscode.Diagnostic(new vscode.Range(b.startLine, 0, b.startLine, 0), msg, vscode.DiagnosticSeverity.Error));
        }
    }

    collection.set(doc.uri, diags);
}

function activate(context) {
    const collection = vscode.languages.createDiagnosticCollection('heredoc');
    context.subscriptions.push(collection);

    const debounced = (() => {
        let t;
        return (doc) => {
            clearTimeout(t);
            t = setTimeout(() => validateDoc(doc, collection), 200);
        };
    })();

    if (vscode.window.activeTextEditor) debounced(vscode.window.activeTextEditor.document);
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(debounced),
        vscode.workspace.onDidChangeTextDocument(e => debounced(e.document)),
        vscode.workspace.onDidSaveTextDocument(debounced),
        vscode.window.onDidChangeActiveTextEditor(ed => ed && debounced(ed.document))
    );
}

function deactivate() { }

module.exports = { activate, deactivate };
