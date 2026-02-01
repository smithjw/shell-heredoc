// Python syntax validator using pyright-internal (bundled, no system Python required)
const { Parser } = require('@zzzen/pyright-internal/dist/parser/parser');

function buildLineStarts(text) {
    const starts = [0];
    for (let i = 0; i < text.length; i++) {
        if (text.charCodeAt(i) === 10) starts.push(i + 1); // "\n"
    }
    return starts;
}

function offsetToPos(offset, lineStarts) {
    let lo = 0, hi = lineStarts.length - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (lineStarts[mid] <= offset) lo = mid + 1; else hi = mid - 1;
    }
    const line = Math.max(0, hi);
    const character = offset - lineStarts[line];
    return { line, character };
}

function validate(text) {
    try {
        const parseResults = Parser.parseSourceFile(text, 'inmemory://heredoc.py', false, {});
        const errors = parseResults && parseResults.parserErrors ? parseResults.parserErrors : [];
        if (!errors.length) return [];
        const lineStarts = buildLineStarts(text);
        const maxErrors = 20;
        const out = [];
        for (let i = 0; i < errors.length && i < maxErrors; i++) {
            const e = errors[i];
            const start = offsetToPos(e.start, lineStarts);
            const end = offsetToPos(e.start + Math.max(1, e.length || 1), lineStarts);
            out.push({
                message: e.message || 'Invalid Python syntax',
                severity: 1,
                range: { start, end }
            });
        }
        return out;
    } catch (err) {
        return [];
    }
}

module.exports = { validate };
