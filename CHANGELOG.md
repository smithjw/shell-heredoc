# Change Log

All notable changes to the "shell-heredoc" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.3.0]

### Added

- JavaScript validation for `JS` / `JAVASCRIPT` heredocs, using a bundled copy of acorn.
- `shellHeredoc.validate.javascript` setting to toggle it.
- Mocha test suite and a post-build smoke test that validates the bundled extension.
- Syntax highlighting for `APPLESCRIPT` and `OSA` heredocs. Thanks [@mjec](https://github.com/mjec) for [#3](https://github.com/smithjw/shell-heredoc/pull/3)!
- The AppleScript grammar is bundled (from [idleberg/vscode-applescript](https://github.com/idleberg/vscode-applescript), MIT), so no separate AppleScript extension is needed.

### Changed

- Python validation now parses in-process with a bundled copy of pyright. No system `python3` is required.
- The extension is now fully bundled: the published vsix ships only `dist/` and needs no `node_modules`.
- The bundle is minified and ships pyright's English messages only, cutting the vsix from ~620 KB to ~236 KB. Python syntax errors are now always in English, like the other validators.

### Fixed

- Python validation produced no diagnostics at all; it now reports syntax errors correctly.
- Unterminated heredocs no longer cause a quadratic scan that could freeze the editor.
- `<<-` heredocs have their leading tabs stripped before validation, matching bash.
- An invalid `shellHeredoc.maxBytes` value now falls back to the default instead of disabling the size guard.
