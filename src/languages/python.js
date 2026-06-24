// Python syntax validator using pyright-internal (bundled, no system Python required).
// Lazily require the parser so module load is cheap and a load failure surfaces
// as a visible per-block diagnostic (via extension.js) rather than crashing the host.
let _mod;
function getMod() {
    if (!_mod) {
        const parser = require('@zzzen/pyright-internal/dist/parser/parser');
        const sink = require('@zzzen/pyright-internal/dist/common/diagnosticSink');
        _mod = { Parser: parser.Parser, ParseOptions: parser.ParseOptions, DiagnosticSink: sink.DiagnosticSink };
    }
    return _mod;
}

const MAX_ERRORS = 20;

function validate(text) {
    const { Parser, ParseOptions, DiagnosticSink } = getMod();
    const sink = new DiagnosticSink();
    new Parser().parseSourceFile(text, new ParseOptions(), sink);
    return sink.getErrors().slice(0, MAX_ERRORS).map(e => ({
        message: e.message || 'Invalid Python syntax',
        severity: 1,
        range: {
            start: { line: e.range?.start?.line ?? 0, character: e.range?.start?.character ?? 0 },
            end: { line: e.range?.end?.line ?? 0, character: e.range?.end?.character ?? 0 }
        }
    }));
}

module.exports = { validate };
