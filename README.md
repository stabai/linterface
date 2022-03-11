# Linterface

A sane interface for all your linters.

Note: Linterface is still missing key functionality, like reading a config file.
It's not yet ready for use.

## What?

Linterface is a linter multiplexer. Its goal is to automatically run all your
linters and unify their results together.

It currently supports the following linters:

| File Type        | Linter        |
| ---------------- | ------------- |
| GitHub Actions   | actionlint    |
| Go               | golangci-lint |
| JSON/JSONC/JSON5 | eslint        |
| JavaScript/JSX   | eslint        |
| Markdown         | markdownlint  |
| Protocol Buffers | buf           |
| TypeScript/TSX   | eslint        |

## Why?

Super-Linter is great, but running it locally is a huge pain. A good development
feedback loop requires linters that are fast and easy.

## Where?

Everywhere. On your machine, on your coworker's machine, in your CI system. Like
testing, linting should be consistent and easily reproducible.

## How?

TODO: Add example command lines for different workflows

## Limitations

Linterface currently assumes the following about your workspace:

- Git for source control (possible support for other versioning systems in the
  future)
- GitHub Actions for continuous integration (not required, and possible support
  for other CI systems in the future)
- Using macOS or Linux (sorry if things break on Windows, just use WSL)
- Individual linters are already available (soon: or can be installed with
  Homebrew/NPM/Go)

## P1 TODO List

### Linters

- Buildifier
- Shellcheck
- EditorConfig

### Workflows

- Precommit (all files with uncommitted changes)
- Premerge (all files that changed between `HEAD` and `HEAD~1`)
- Postmerge (all files)

### Core

- Configuration files
- CLI command parsing
- Buffered linter logs for better readability
- Multiple execution modes (e.g. direct, `nix-shell`)

### Installers

- NPM package
- Nix package

### Code Health

- Tests
- Better documentation
- CI 😏

## P2 TODO List

- GitHub Action integration for adding comments
- GitHub Action integration for separating linter workflows
- Approximate linter support parity with Super-Linter
- Option to automatically install linters that are missing

## Possible Future Ideas

- Orchestrated workflows that do more than just linting
- Preset linting configurations
- Code sync linting (for code files that need to be kept in sync)
- Plugins for Visual Studio Code and JetBrains IDEs
