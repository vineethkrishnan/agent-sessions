# claude-sessions

[![npm](https://img.shields.io/npm/v/@vineethnkrishnan/claude-sessions)](https://www.npmjs.com/package/@vineethnkrishnan/claude-sessions)
[![CI](https://github.com/vineethkrishnan/claude-sessions/actions/workflows/ci.yml/badge.svg)](https://github.com/vineethkrishnan/claude-sessions/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[Documentation](https://claude-sessions.vineethnk.in/)** · **[npm](https://www.npmjs.com/package/@vineethnkrishnan/claude-sessions)** · **[GitHub](https://github.com/vineethkrishnan/claude-sessions)**

Interactive session manager for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Browse, search, delete, and resume past conversations from your terminal.

Claude Code provides `--resume <session-id>` and `--continue`, but no way to browse or search through your session history. This tool fills that gap.

![demo](docs/assets/demo.gif)

## Features

- Browse all Claude Code sessions sorted by most recent
- Shows date, project, git branch, message count, and first message preview
- **Session preview** — press `p` to peek into a conversation before resuming
- Fuzzy search/filter to find sessions quickly
- Delete old sessions you no longer need
- Optional fzf integration for power users
- Animated splash screen on startup
- Works on macOS and Linux

## Installation

```bash
npm install -g @vineethnkrishnan/claude-sessions
```

Or run without installing:

```bash
npx @vineethnkrishnan/claude-sessions
```

## Usage

```bash
claude-sessions              # Interactive TUI
claude-sessions --fzf        # Use fzf for selection
claude-sessions --delete     # Delete mode
claude-sessions --no-splash  # Skip splash screen
```

## Keybindings

| Key         | Action                         |
|-------------|--------------------------------|
| `Up/Down`   | Navigate                       |
| `Page Up/Down` | Jump 10                     |
| `/`         | Search / filter                |
| `Enter`     | Resume session (or end search) |
| `p`         | Preview session conversation   |
| `d`         | Delete selected session        |
| `Esc`       | Clear search / close preview   |
| `q`         | Quit                           |

## Architecture

Vertical-slice hexagonal architecture with modular domain structure:

```
src/
├── domain/session/              # Session domain module
│   ├── domain/                  # Pure business logic (zero deps)
│   │   ├── session.model.ts     # Session entity + filtering
│   │   ├── session-detail.model.ts  # Conversation detail model
│   │   └── session.error.ts     # Domain errors
│   ├── application/             # Use cases + ports
│   │   ├── ports/               # Interface contracts
│   │   ├── list-sessions.use-case.ts
│   │   ├── delete-session.use-case.ts
│   │   ├── resume-session.use-case.ts
│   │   └── get-session-detail.use-case.ts
│   ├── infrastructure/          # Adapters (fs, spawn)
│   │   ├── fs-session-repository.adapter.ts
│   │   ├── fs-session-storage.adapter.ts
│   │   ├── cli-process-launcher.adapter.ts
│   │   └── jsonl-parser.ts
│   ├── presenters/              # UI layer (Ink/React)
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── formatters/
│   │   └── app.tsx
│   └── session.module.ts        # Module wiring (DI)
├── common/helpers/              # Cross-domain utilities
│   └── path.helper.ts
└── cli.tsx                      # Entry point
```

**Dependency flow:** `presenters → application → domain ← infrastructure`

Tests are co-located with source files (`*.spec.ts`).

## Development

```bash
git clone https://github.com/vineethkrishnan/claude-sessions.git
cd claude-sessions
npm install
npm run build
npm test

# Run locally
node dist/cli.js
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint source files |
| `npm run lint:fix` | Lint and auto-fix |
| `npm run format` | Format with Prettier |

### CI/CD

- **ci.yml** — Lint, test (Node 20/22), build on every push and PR
- **quality.yml** — Dead code detection, duplication check, strict type safety
- **security.yml** — CodeQL, dependency review, Trivy filesystem scan
- **commitlint.yml** — Validates Conventional Commits format on PR titles
- **release.yml** — Automated semantic versioning, npm publish, docs deploy

### Commit Convention

Follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(session): add fuzzy search filtering
fix(parser): handle array content format in JSONL
chore: update dependencies
```

## Requirements

- Node.js 20+
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI installed
- [fzf](https://github.com/junegunn/fzf) (optional)

## Documentation

Full documentation is available at **[claude-sessions.vineethnk.in](https://claude-sessions.vineethnk.in/)**.

## License

MIT
