// Legacy lightweight JSON validator kept for fallback (unused when full language service is enabled).
function validate(text) {
    try {
        JSON.parse(text);
        return [];
    } catch (e) {
        const msg = e && e.message ? e.message : 'Invalid JSON';

        // 1. Try to extract absolute character position from V8 error message.
        //    Typical forms:
        //    "Unexpected token } in JSON at position 123"
        //    "Unexpected string in JSON at position 45"
        //    For some errors (Unexpected end of JSON input) there is no position.
        let index = -1;
        const m = msg.match(/position (\d+)/i);
        if (m) index = parseInt(m[1], 10);

        // If no index in message, try a binary search heuristic to find last good parse boundary.
        if (index < 0) {
            let low = 0, high = text.length;
            while (low < high) {
                const mid = Math.floor((low + high + 1) / 2);
                try { JSON.parse(text.slice(0, mid)); low = mid; } catch { high = mid - 1; }
            }
            // Heuristic: error likely occurs at low (next char) unless at end-of-input.
            index = Math.min(low, text.length - 1);
        } else if (index >= text.length) {
            // Clamp if message reports position at end.
            index = text.length - 1;
        }

        // Heuristic adjustment: if parser reported an unexpected closing token and there's a trailing comma,
        // shift highlight to the comma (more intuitive for users fixing the error).
        if (index >= 0 && index < text.length) {
            const ch = text[index];
            if (ch === '}' || ch === ']') {
                let k = index - 1;
                while (k >= 0 && /\s/.test(text[k])) k--;
                if (k >= 0 && text[k] === ',') {
                    index = k; // highlight the trailing comma instead of the closing token
                }
            }
        }

        // Compute line/character from (possibly adjusted) index.
        let line = 0, character = 0;
        if (index >= 0) {
            const until = text.slice(0, index);
            const lines = until.split(/\r?\n/);
            line = lines.length - 1;
            character = lines[lines.length - 1].length;
        }

        // Provide a one-character range. If the character is whitespace, expand to next non-whitespace (best-effort).
        let endChar = character + 1;
        const lineStartIndex = (() => {
            // Reconstruct absolute index of start of the line.
            if (line === 0) return 0;
            // Re-scan to find line starts (cost acceptable for short heredocs).
            let count = 0, curLine = 0;
            for (let i = 0; i < text.length && curLine < line; i++) {
                if (text[i] === '\n') { curLine++; if (curLine === line) return i + 1; }
            }
            return 0;
        })();

        const absoluteChar = lineStartIndex + character;
        if (/\s/.test(text[absoluteChar])) {
            // Advance to first non-whitespace on same line.
            let probe = absoluteChar;
            while (probe < text.length && text[probe] !== '\n' && /\s/.test(text[probe])) probe++;
            if (probe < text.length && text[probe] !== '\n') {
                const delta = probe - absoluteChar;
                character += delta;
                endChar = character + 1;
            }
        }

        return [{
            message: msg,
            severity: 1,
            range: { start: { line, character }, end: { line, character: endChar } }
        }];
    }
}

module.exports = { validate };
