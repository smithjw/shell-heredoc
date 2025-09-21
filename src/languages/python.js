// Python validator using Python's AST module for syntax checking.
const { spawn } = require('child_process');

function validate(text) {
    return new Promise((resolve) => {
        try {
            // Use Python's AST module to check syntax
            const python = spawn('python3', ['-c', `
import ast
import sys
try:
    ast.parse(sys.stdin.read())
    print("OK")
except SyntaxError as e:
    print(f"ERROR:{e.lineno or 1}:{e.offset or 1}:{e.msg or 'Invalid Python syntax'}")
except Exception as e:
    print(f"ERROR:1:1:{str(e)}")
`], {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let output = '';
            let errorOutput = '';

            python.stdout.on('data', (data) => {
                output += data.toString();
            });

            python.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            python.on('close', (code) => {
                if (code !== 0) {
                    // Python executable failed or not found
                    resolve([]);
                    return;
                }

                const result = output.trim();
                if (result === 'OK') {
                    resolve([]);
                    return;
                }

                if (result.startsWith('ERROR:')) {
                    const parts = result.substring(6).split(':', 3);
                    const line = Math.max(0, parseInt(parts[0], 10) - 1);
                    const character = Math.max(0, parseInt(parts[1], 10) - 1);
                    const message = parts[2] || 'Invalid Python syntax';

                    resolve([{
                        message: message,
                        severity: 1,
                        range: {
                            start: { line, character },
                            end: { line, character: character + 1 }
                        }
                    }]);
                    return;
                }

                // Fallback for unexpected output
                resolve([]);
            });

            python.on('error', (err) => {
                // Python executable not found or other spawn error
                resolve([]);
            });

            // Send the Python code to stdin
            python.stdin.write(text);
            python.stdin.end();

        } catch (e) {
            // Any other error - return empty array (no validation)
            resolve([]);
        }
    });
}

module.exports = { validate };