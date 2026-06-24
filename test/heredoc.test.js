const assert = require('assert');
const { findBlocks, getBlockText } = require('../src/heredoc');

// Minimal stand-in for a vscode TextDocument: just what heredoc.js touches.
function fakeDoc(text) {
    const lines = text.split('\n');
    return { lineCount: lines.length, lineAt: (i) => ({ text: lines[i] }) };
}

describe('heredoc.findBlocks', () => {
    it('finds a simple block and reports body line range', () => {
        const doc = fakeDoc(['cat <<JSON', '{"a":1}', 'JSON', 'echo done'].join('\n'));
        const blocks = findBlocks(doc);
        assert.strictEqual(blocks.length, 1);
        assert.strictEqual(blocks[0].tag, 'JSON');
        assert.strictEqual(blocks[0].startLine, 1); // body starts after opener
        assert.strictEqual(blocks[0].endLine, 2);   // exclusive: closer is line 2
        assert.strictEqual(blocks[0].stripTabs, false);
    });

    it('marks <<- blocks for tab stripping', () => {
        const doc = fakeDoc(['cat <<-PY', '\tprint(1)', 'PY'].join('\n'));
        const blocks = findBlocks(doc);
        assert.strictEqual(blocks.length, 1);
        assert.strictEqual(blocks[0].stripTabs, true);
    });

    it('returns no block for an unterminated heredoc (and stays linear)', () => {
        // 50k unclosed start lines: O(N^2) would rescan to EOF each time and hang.
        // The linear scan breaks on the first unterminated opener.
        const doc = fakeDoc(Array(50000).fill('cat <<JSON').join('\n'));
        const start = Date.now();
        const blocks = findBlocks(doc);
        assert.strictEqual(blocks.length, 0);
        assert.ok(Date.now() - start < 1000, 'scan should be linear, not O(n^2)');
    });

    it('does not treat the body opener as a nested block', () => {
        const doc = fakeDoc(['cat <<JSON', 'cat <<YAML', 'JSON', 'YAML'].join('\n'));
        const blocks = findBlocks(doc);
        assert.strictEqual(blocks.length, 1);
        assert.strictEqual(blocks[0].tag, 'JSON');
    });

    it('finds multiple independent blocks and resumes after each', () => {
        const doc = fakeDoc([
            'cat <<JSON', '{"a":1}', 'JSON',
            'echo mid',
            'cat <<PY', 'print(1)', 'PY'
        ].join('\n'));
        const blocks = findBlocks(doc);
        assert.strictEqual(blocks.length, 2);
        assert.deepStrictEqual(blocks.map(b => b.tag), ['JSON', 'PY']);
        assert.strictEqual(blocks[1].startLine, 5);
    });
});

describe('heredoc.getBlockText', () => {
    it('joins body lines verbatim for plain heredocs', () => {
        const doc = fakeDoc(['cat <<JSON', '{"a":1}', '  nested', 'JSON'].join('\n'));
        const [b] = findBlocks(doc);
        assert.strictEqual(getBlockText(doc, b), '{"a":1}\n  nested');
    });

    it('strips all leading tabs for <<- blocks (mirrors bash)', () => {
        // bash <<- removes every leading tab from each body line, not just one.
        const doc = fakeDoc(['cat <<-PY', '\t\tdef f():', '\t\t\treturn 1', 'PY'].join('\n'));
        const [b] = findBlocks(doc);
        assert.strictEqual(getBlockText(doc, b), 'def f():\nreturn 1');
    });
});
