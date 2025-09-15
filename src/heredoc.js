// Registry of tags to validate.
const TAG_TO_HANDLER = {
    JSON: 'json',
    // Add more down the line
};

function findBlocks(doc) {
    const tags = Object.keys(TAG_TO_HANDLER);
    if (tags.length === 0) return [];
    const tagAlt = tags.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

    // Match << or <<-, optional quotes, one of our tags; tolerate anything after (redir/pipe/comment)
    const startRe = new RegExp(String.raw`<<-?\s*(['"]?)(` + tagAlt + String.raw`)(['"]?).*$`);
    const blocks = [];

    for (let i = 0; i < doc.lineCount; i++) {
        const line = doc.lineAt(i).text;
        const m = line.match(startRe);
        if (!m) continue;

        const tag = m[2];
        // Find the terminator: the tag alone on a line (whitespace allowed)
        const endRe = new RegExp(String.raw`^\s*` + tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + String.raw`\s*$`);
        for (let j = i + 1; j < doc.lineCount; j++) {
            const endLine = doc.lineAt(j).text;
            if (endRe.test(endLine)) {
                blocks.push({ tag, startLine: i + 1, endLine: j }); // body is [startLine, endLine)
                i = j; // continue after this block
                break;
            }
        }
    }
    return blocks;
}

module.exports = { findBlocks, TAG_TO_HANDLER };
