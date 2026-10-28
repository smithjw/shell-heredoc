// Vendors the AppleScript grammar from idleberg/vscode-applescript (MIT) so
// APPLESCRIPT heredocs highlight without a separate extension installed.
// To update: change COMMIT, run `node scripts/fetch-applescript-grammar.mjs`, commit the output.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { XMLParser } from 'fast-xml-parser';

const REPO = 'idleberg/vscode-applescript';
const COMMIT = 'fcaf4ba0d7d157f3b70448b389225edac6ec61e2';
const SCOPE = 'source.applescript.shell-heredoc';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'syntaxes');

async function get(file) {
    const res = await fetch(`https://raw.githubusercontent.com/${REPO}/${COMMIT}/${file}`);
    if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
    return res.text();
}

// Converts fast-xml-parser preserveOrder nodes for a plist value into plain JS.
function value(node) {
    const tag = Object.keys(node).find(k => k !== ':@');
    const all = node[tag];
    // Drop the whitespace between elements; string content is read from `all`.
    const kids = tag === 'dict' || tag === 'array' ? all.filter(k => !('#text' in k)) : all;
    const text = () => kids.map(k => k['#text'] ?? '').join('');
    switch (tag) {
        case 'dict': {
            const out = {};
            for (let i = 0; i < kids.length; i += 2) {
                out[String(kids[i].key.map(k => k['#text'] ?? '').join(''))] = value(kids[i + 1]);
            }
            return out;
        }
        case 'array': return kids.map(value);
        case 'string': return text();
        case 'integer': return Number(text());
        case 'true': return true;
        case 'false': return false;
        default: throw new Error(`Unsupported plist element <${tag}>`);
    }
}

const xml = await get('syntaxes/applescript.tmLanguage');
const doc = new XMLParser({ preserveOrder: true, parseTagValue: false, trimValues: false })
    .parse(xml);
const plist = doc.find(n => n.plist).plist.filter(n => !('#text' in n));
const grammar = value(plist[0]);

const orig = grammar.scopeName;
if (orig !== 'source.applescript') throw new Error(`Unexpected scopeName ${orig}`);
// Own scope name so we never clash with an installed AppleScript extension.
const json = JSON.stringify({ ...grammar, scopeName: SCOPE }, null, 2)
    .replaceAll(`"include": "${orig}`, `"include": "${SCOPE}`);

fs.writeFileSync(path.join(outDir, 'applescript.tmLanguage.json'), json + '\n');
fs.writeFileSync(
    path.join(outDir, 'applescript.LICENSE'),
    `Vendored from https://github.com/${REPO}/blob/${COMMIT}/syntaxes/applescript.tmLanguage\n\n` +
    await get('LICENSE')
);
console.log('Wrote applescript grammar from', REPO, COMMIT);
