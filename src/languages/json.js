const { getLanguageService } = require('vscode-json-languageservice');
const { TextDocument } = require('vscode-languageserver-textdocument');

const service = getLanguageService({});

async function validate(text) {
    const doc = TextDocument.create('inmemory://heredoc.json', 'json', 1, text);
    const jsonDoc = service.parseJSONDocument(doc);
    const diagnostics = await service.doValidation(doc, jsonDoc);
    // Return VS Code-like objects: { message, severity, range }
    return diagnostics.map(d => ({ message: d.message, severity: d.severity, range: d.range }));
}

module.exports = { validate };
