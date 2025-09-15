// XML validator using fast-xml-parser for well-formedness checks.
const { XMLParser, XMLValidator } = require('fast-xml-parser');

function validate(text) {
    const result = XMLValidator.validate(text, { allowBooleanAttributes: true });
    if (result === true) return [];
    // fast-xml-parser returns an object with err { code, msg, line, col }
    const err = result.err || {};
    const line = typeof err.line === 'number' ? err.line - 1 : 0; // library is 1-based
    const character = typeof err.col === 'number' ? err.col - 1 : 0;
    return [{
        message: err.msg || 'Invalid XML',
        severity: 1,
        range: { start: { line, character }, end: { line, character: character + 1 } }
    }];
}
module.exports = { validate };
