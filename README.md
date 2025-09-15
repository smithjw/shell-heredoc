# shell-heredoc README

`shell-heredoc` is a VS Code extension that provides syntax highlighting within bash/shell heredocs based on the delimiter tag.

``` shell
#!/bin/bash
/bin/cat << 'JSON'
{ "status": "active", "count": 42 }
JSON
```

## Features

This extension automatically detects and highlights code within heredoc blocks using the following delimiter mappings:

| Language     | Supported Delimiters   |
| ------------ | ---------------------- |
| `json`       | `JSON`                 |
| `yaml`       | `YAML`, `YML`          |
| `shell`      | `SHELL`, `BASH`, `ZSH` |
| `sql`        | `SQL`                  |
| `html`       | `HTML`                 |
| `xml`        | `XML`                  |
| `javascript` | `JS`, `JAVASCRIPT`     |
| `typescript` | `TS`, `TYPESCRIPT`     |
| `markdown`   | `MARKDOWN`, `MD`       |

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

## Requirements

- VS Code 1.60.0 or higher
- No additional dependencies required

## Extension Settings

This extension currently does not contribute any configurable settings.

## Known Issues

- Nested heredocs may not highlight correctly
- Some complex shell syntax within heredocs might interfere with highlighting

## Release Notes

### 1.0.0

- Initial release
- Support for 9 programming languages
- Automatic syntax detection based on heredoc delimiters
- Works with both quoted and unquoted heredoc markers

---

**Enjoy enhanced shell scripting with proper syntax highlighting!**
