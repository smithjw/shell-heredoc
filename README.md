# shell-heredoc README

`shell-heredoc` is a VS Code extension that provides syntax highlighting and validation within bash/shell heredocs based on the delimiter tag.

``` shell
#!/bin/bash
/bin/cat << 'JSON'
{ "status": "active", "count": 42 }
JSON
```

## Features

This extension automatically detects and highlights code within heredoc blocks using the following delimiter mappings. Languages marked as validated also get inline syntax diagnostics; validation runs entirely in-process, with no system interpreters or other dependencies required.

| Language     | Supported Delimiters   | Validated |
| ------------ | ---------------------- | --------- |
| `json`       | `JSON`                 | yes       |
| `yaml`       | `YAML`, `YML`          | yes       |
| `xml`        | `XML`, `PLIST`         | yes       |
| `python`     | `PYTHON`, `PY`         | yes       |
| `javascript` | `JS`, `JAVASCRIPT`     | yes       |
| `shell`      | `SHELL`, `BASH`, `ZSH` | no        |
| `sql`        | `SQL`                  | no        |
| `html`       | `HTML`                 | no        |
| `typescript` | `TS`, `TYPESCRIPT`     | no        |
| `markdown`   | `MARKDOWN`, `MD`       | no        |

## Installation

1. Open VS Code
2. Go to Extensions view (`Cmd+Shift+X`)
3. Search for "shell-heredoc"
4. Click Install

## Usage

Simply use heredocs in your shell scripts with one of the supported delimiters:

```bash
cat << SQL
SELECT name, email
FROM users
WHERE active = true;
SQL
```

```bash
python3 << PYTHON
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

for i in range(5):
    print(f"F({i}) = {fibonacci(i)}")
PYTHON
```

## Requirements

- VS Code 1.80.0 or higher
- No additional dependencies required

## Extension Settings

| Setting | Default | Description |
| ------- | ------- | ----------- |
| `shellHeredoc.validate.json` | `true` | Validate JSON heredocs. |
| `shellHeredoc.validate.yaml` | `true` | Validate YAML/YML heredocs. |
| `shellHeredoc.validate.xml` | `true` | Validate XML and PLIST heredocs. |
| `shellHeredoc.validate.python` | `true` | Validate Python heredocs. |
| `shellHeredoc.validate.javascript` | `true` | Validate JavaScript heredocs. |
| `shellHeredoc.maxBytes` | `200000` | Skip validation for heredocs larger than this many bytes. |

## Known Issues

- Nested heredocs may not highlight correctly
- Some complex shell syntax within heredocs might interfere with highlighting

## Release Notes

See the commit history for full details.

- Syntax highlighting for 10 languages, automatically detected from the heredoc delimiter
- In-process validation for JSON, YAML, XML, Python, and JavaScript — no system interpreters required
- Works with both quoted and unquoted heredoc markers

---

**Enjoy enhanced shell scripting with proper syntax highlighting!**
