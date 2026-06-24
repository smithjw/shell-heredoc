const assert = require('assert');
const { enabledFor, maxBytes, DEFAULT_MAX_BYTES } = require('../src/config');

// Fake vscode WorkspaceConfiguration backed by a plain object.
const cfg = (values) => ({ get: (k) => values[k] });

describe('config.enabledFor', () => {
    it('is enabled by default when the setting is absent', () => {
        assert.strictEqual(enabledFor(cfg({}), 'python'), true);
    });
    it('is disabled only when explicitly false', () => {
        assert.strictEqual(enabledFor(cfg({ 'shellHeredoc.validate.python': false }), 'python'), false);
        assert.strictEqual(enabledFor(cfg({ 'shellHeredoc.validate.python': true }), 'python'), true);
    });
    it('builds the key from the validator name (guards against a key typo)', () => {
        // If the key template broke, this would read the wrong setting and stay true.
        assert.strictEqual(enabledFor(cfg({ 'shellHeredoc.validate.javascript': false }), 'javascript'), false);
    });
});

describe('config.maxBytes', () => {
    it('returns the configured positive number', () => {
        assert.strictEqual(maxBytes(cfg({ 'shellHeredoc.maxBytes': 1000 })), 1000);
    });
    it('falls back to the default for absent / non-numeric / <= 0 values', () => {
        assert.strictEqual(maxBytes(cfg({})), DEFAULT_MAX_BYTES);
        assert.strictEqual(maxBytes(cfg({ 'shellHeredoc.maxBytes': 'big' })), DEFAULT_MAX_BYTES);
        assert.strictEqual(maxBytes(cfg({ 'shellHeredoc.maxBytes': 0 })), DEFAULT_MAX_BYTES);
        assert.strictEqual(maxBytes(cfg({ 'shellHeredoc.maxBytes': -5 })), DEFAULT_MAX_BYTES);
    });
});
