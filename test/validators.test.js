const assert = require('assert');
const python = require('../src/languages/python');
const javascript = require('../src/languages/javascript');
const yaml = require('../src/languages/yaml');
const xml = require('../src/languages/xml');

function assertShape(d) {
    assert.ok(typeof d.message === 'string' && d.message.length, 'has message');
    assert.strictEqual(d.severity, 1);
    assert.strictEqual(typeof d.range.start.line, 'number');
    assert.strictEqual(typeof d.range.start.character, 'number');
    assert.strictEqual(typeof d.range.end.line, 'number');
    assert.strictEqual(typeof d.range.end.character, 'number');
}

describe('python.validate', () => {
    it('returns [] for valid Python', () => {
        assert.deepStrictEqual(python.validate('def f():\n    return 1\n'), []);
    });

    it('flags a syntax error with a usable range', () => {
        const out = python.validate('def f(:\n  return\n');
        assert.ok(out.length > 0, 'expected at least one diagnostic');
        out.forEach(assertShape);
        assert.strictEqual(out[0].range.start.line, 0); // error is on first line (0-based)
    });

    it('caps the number of diagnostics at 20', () => {
        const out = python.validate(Array(100).fill('x = = =').join('\n'));
        assert.ok(out.length <= 20);
    });
});

describe('javascript.validate', () => {
    it('returns [] for valid script', () => {
        assert.deepStrictEqual(javascript.validate('const x = 1;\nfunction f() { return x; }\n'), []);
    });

    it('returns [] for valid ES module syntax', () => {
        assert.deepStrictEqual(javascript.validate('import os from "os";\nexport const y = 2;\n'), []);
    });

    it('returns [] for top-level await and return (heredoc snippets)', () => {
        assert.deepStrictEqual(javascript.validate('return 1;\n'), []);
        assert.deepStrictEqual(javascript.validate('await fetch("/x");\n'), []);
    });

    it('flags a syntax error with a usable range and stripped location suffix', () => {
        const out = javascript.validate('const x = ;\n');
        assert.strictEqual(out.length, 1);
        assertShape(out[0]);
        assert.strictEqual(out[0].range.start.line, 0);
        assert.ok(!/\(\d+:\d+\)$/.test(out[0].message), 'trailing (line:col) should be stripped');
    });

    it('reports the real error line for module code with a typo, not the sourceType error', () => {
        // import => module; the typo is on line 2. Script-mode would fail on line 1
        // with an "import only allowed with sourceType: module" message — wrong.
        const out = javascript.validate('import x from "y";\nconst a = ;\n');
        assert.strictEqual(out.length, 1);
        assert.strictEqual(out[0].range.start.line, 1, 'should point at the real typo on line 2');
        assert.ok(!/sourceType/i.test(out[0].message), 'should not leak the module/script-mode message');
    });
});

describe('yaml.validate', () => {
    it('returns [] for valid YAML', () => {
        assert.deepStrictEqual(yaml.validate('a: 1\nb:\n  - x\n  - y\n'), []);
    });
    it('flags invalid YAML', () => {
        const out = yaml.validate('a: [1, 2\nb: 3\n');
        assert.ok(out.length > 0);
        out.forEach(assertShape);
    });
});

describe('xml.validate', () => {
    it('returns [] for well-formed XML', () => {
        assert.deepStrictEqual(xml.validate('<root><a>1</a></root>'), []);
    });
    it('flags malformed XML', () => {
        const out = xml.validate('<root><a>1</root>');
        assert.ok(out.length > 0);
        out.forEach(assertShape);
    });
});
