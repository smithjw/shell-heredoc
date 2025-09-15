// scripts/build-grammar.mjs
// Usage: pnpm run build:grammar (or node scripts/build-grammar.mjs)

import fs from 'node:fs';
import path from 'node:path';

const outPath = path.join(process.cwd(), 'syntaxes', 'shell-heredoc-injections.tmLanguage.json');

// Define heredoc tag sets and the injected language scopes
const defs = [
    { tags: ['JSON'], scope: 'source.json' },
    { tags: ['YAML', 'YML'], scope: 'source.yaml' },
    { tags: ['SHELL', 'BASH', 'ZSH'], scope: 'source.shell' },
    { tags: ['SQL'], scope: 'source.sql' },
    { tags: ['HTML'], scope: 'text.html.basic' },
    { tags: ['XML'], scope: 'text.xml' },
    { tags: ['JS', 'JAVASCRIPT'], scope: 'source.js' },
    { tags: ['TS', 'TYPESCRIPT'], scope: 'source.ts' },
    { tags: ['MARKDOWN', 'MD'], scope: 'text.html.markdown' }
];

// Scopes to approximate shell tokenization on the start line
const beginCaptures = {
    "1": { "name": "keyword.operator.heredoc.shell" },          // << or <<-
    "2": { "name": "punctuation.definition.string.begin.shell" },// opening quote around tag (if any)
    "3": { "name": "entity.name.tag.heredoc.shell" },           // tag
    "4": { "name": "punctuation.definition.string.end.shell" },  // closing quote around tag (if any)
    "5": { "name": "constant.numeric.file-descriptor.shell" },   // optional fd number before redirection (e.g., 2>)
    "6": { "name": "keyword.operator.redirect.shell" },          // redirection operator
    "7": { "name": "punctuation.definition.string.begin.shell" },// opening double quote for redirect target
    "8": { "name": "variable.other.readwrite.shell" },           // last variable inside double quotes (best effort)
    "9": { "name": "punctuation.definition.string.end.shell" },  // closing double quote
    "10": { "name": "punctuation.definition.string.begin.shell" },// opening single quote for redirect target
    "11": { "name": "string.quoted.single.shell" },              // single-quoted target content
    "12": { "name": "punctuation.definition.string.end.shell" }, // closing single quote
    "13": { "name": "variable.other.readwrite.shell" },          // unquoted $VAR or ${VAR}
    "14": { "name": "string.unquoted.filename.shell" },          // unquoted filename/word
    "15": { "name": "keyword.operator.pipe.shell" },             // | or |&
    "16": { "name": "meta.pipeline.command.shell" },             // rest of pipeline command
    "17": { "name": "comment.line.number-sign.shell" }           // trailing # comment
};

function ruleFor(tags, injectedScope) {
    // Escape and build tag alternation
    const tagAlt = tags.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

    // Begin:
    // (1) << or <<-
    // (2) optional quote before tag
    // (3) tag
    // (4) optional quote after tag
    // (?!\w) prevents matching JSONx
    // Optional:
    //   - redirection: (5) fd? (6) operator (7..14) target with quoted/unquoted/variable
    //   - OR pipeline: (15) pipe operator (16) rest of pipeline cmd
    // Optional trailing comment: (17)
    // Anchor to end of line to avoid spilling onto next lines.
    const begin = String.raw`(<<-?)\s*(['"]?)(${tagAlt})(['"]?)(?!\w)(?:\s*(?:(?:(\d+)?\s*(>>?|<<?|>&|&>|>\||<>&?)\s*(?:(\")(?:(?:[^"\\$]|\\.|(\$\{[^}]+\}|\$[A-Za-z_][A-Za-z0-9_]*))*)(\")|(')([^']*)(')|(\$\{[^}]+\}|\$[A-Za-z_][A-Za-z0-9_]*)|([^\t #]+)))|(\|&?)\s*([^#\n]*?)))?\s*(#.*)?$`;

    // End: zero-width lookahead for exact tag on its own line
    const end = String.raw`(?=^\s*(?:${tagAlt})\s*$)`;

    return {
        begin,
        end,
        contentName: injectedScope,
        patterns: [{ include: injectedScope }],
        beginCaptures
    };
}

const grammar = {
    scopeName: 'shell.heredoc.injections',
    injectionSelector: 'L:source.shell',
    patterns: defs.map(def => ruleFor(def.tags, def.scope))
};

// Ensure output directory and write the grammar
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(grammar, null, 2) + '\n');
console.log('Wrote', outPath);
