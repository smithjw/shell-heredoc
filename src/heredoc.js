// Registry mapping heredoc tag (exact, uppercase) to validator key.
// Extend here to support new validator handlers.
const TAG_TO_HANDLER = {
    JSON: 'json',
    YAML: 'yaml',
    YML: 'yaml',
    XML: 'xml',
    PLIST: 'xml',
    PYTHON: 'python',
    PY: 'python',
    JS: 'javascript',
    JAVASCRIPT: 'javascript'
};

function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findBlocks(doc) {
    const tags = Object.keys(TAG_TO_HANDLER);
    if (!tags.length) return [];
    const tagAlt = tags.map(escapeRe).join('|');
    // m[1] = optional dash (<<-), m[3] = tag. \2 backrefs the optional quote.
    const startRe = new RegExp(String.raw`<<(-?)\s*(['"]?)(${tagAlt})(\2).*$`);
    const blocks = [];

    for (let i = 0; i < doc.lineCount; i++) {
        const m = doc.lineAt(i).text.match(startRe);
        if (!m) continue;
        const stripTabs = m[1] === '-';
        const tag = m[3];
        const endRe = new RegExp(String.raw`^\s*` + escapeRe(tag) + String.raw`\s*$`);
        let closed = false;
        for (let j = i + 1; j < doc.lineCount; j++) {
            if (endRe.test(doc.lineAt(j).text)) {
                blocks.push({ tag, startLine: i + 1, endLine: j, stripTabs }); // body: [startLine, endLine)
                i = j; // resume after the block (also skips nested starts in the body)
                closed = true;
                break;
            }
        }
        // An unterminated heredoc consumes the rest of the file, so there are no
        // further blocks. Stopping here also keeps the scan linear (no rescans).
        if (!closed) break;
    }
    return blocks;
}

// Assemble a block's body text. For <<- heredocs, bash strips leading tabs from
// each body line, so we mirror that before validation to avoid false positives.
function getBlockText(doc, block) {
    const lines = [];
    for (let ln = block.startLine; ln < block.endLine; ln++) {
        let t = doc.lineAt(ln).text;
        if (block.stripTabs) t = t.replace(/^\t+/, '');
        lines.push(t);
    }
    return lines.join('\n');
}

module.exports = { findBlocks, getBlockText, TAG_TO_HANDLER };
