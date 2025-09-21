// Registry mapping heredoc tag (exact, uppercase) to validator key.
// Extend here to support new validator handlers.
const TAG_TO_HANDLER = {
    JSON: 'json',
    YAML: 'yaml',
    YML: 'yaml',
    XML: 'xml',
    PLIST: 'xml',
    PYTHON: 'python',
    PY: 'python'
};

function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findBlocks(doc) {
    const tags = Object.keys(TAG_TO_HANDLER);
    if (!tags.length) return [];
    const tagAlt = tags.map(escapeRe).join('|');
    const startRe = new RegExp(String.raw`<<-?\s*(['"]?)(${tagAlt})(\1).*$`);
    const blocks = [];

    for (let i = 0; i < doc.lineCount; i++) {
        const line = doc.lineAt(i).text;
        const m = line.match(startRe);
        if (!m) continue;
        const tag = m[2];
        const endRe = new RegExp(String.raw`^\s*` + escapeRe(tag) + String.raw`\s*$`);
        for (let j = i + 1; j < doc.lineCount; j++) {
            if (endRe.test(doc.lineAt(j).text)) {
                blocks.push({ tag, startLine: i + 1, endLine: j }); // body: [startLine, endLine)
                i = j;
                break;
            }
        }
    }
    return blocks;
}

module.exports = { findBlocks, TAG_TO_HANDLER };
