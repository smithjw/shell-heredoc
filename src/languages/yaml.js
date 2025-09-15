// YAML validator using js-yaml. Provides basic syntax diagnostics.
const yaml = require('js-yaml');

function validate(text) {
    try {
        yaml.loadAll(text, () => { });
        return [];
    } catch (e) {
        const line = typeof e.mark?.line === 'number' ? e.mark.line : 0;
        const character = typeof e.mark?.column === 'number' ? e.mark.column : 0;
        return [{
            message: e.message || 'Invalid YAML',
            severity: 1,
            range: {
                start: { line, character },
                end: { line, character: character + 1 }
            }
        }];
    }
}
module.exports = { validate };
