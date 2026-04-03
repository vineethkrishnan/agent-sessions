# agent-sessions

[![npm](https://img.shields.io/npm/v/@vineethnkrishnan/agent-sessions)](https://www.npmjs.com/package/@vineethnkrishnan/agent-sessions)
[![CI](https://github.com/vineethkrishnan/agent-sessions/actions/workflows/ci.yml/badge.svg)](https://github.com/vineethkrishnan/agent-sessions/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[Documentation](https://agent-sessions.vineethnk.in/)** · **[npm](https://www.npmjs.com/package/@vineethnkrishnan/agent-sessions)** · **[GitHub](https://github.com/vineethkrishnan/agent-sessions)**

Interactive session manager for CLI agents — [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Gemini CLI](https://github.com/google-gemini/gemini-cli), [OpenAI Codex](https://github.com/openai/codex), and [Cursor Agent](https://www.cursor.com/). Browse, search, delete, and resume past conversations from your terminal.

These CLI agents provide `--resume <session-id>` but no way to browse or search through session history. This tool fills that gap with a unified TUI for all your AI sessions.

![demo](docs/assets/demo.gif)

## Features

- **Multi-agent support** — Claude, Gemini, Codex, and Cursor in one tool
- Browse all sessions sorted by most recent across agents
- Shows date, agent, project, git branch, message count, and first message preview
- **Session preview** — press `p` to peek into a conversation before resuming
- Fuzzy search/filter to find sessions quickly
- Delete old sessions you no longer need
- Agent selector — switch between agents or view all at once
- Optional fzf integration for power users
- Animated splash screen on startup
- Works on macOS, Linux, and Windows

## Installation

```bash
npm install -g @vineethnkrishnan/agent-sessions
```

Or run without installing:

```bash
npx @vineethnkrishnan/agent-sessions
```

## Usage

```bash
agent-sessions                    # Interactive TUI (agent selector)
agent-sessions --agent claude     # Jump to Claude sessions
agent-sessions --agent gemini     # Jump to Gemini sessions
agent-sessions --fzf              # Use fzf for selection
agent-sessions --delete           # Delete mode
agent-sessions --no-splash        # Skip splash screen
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
| `a`         | Switch agent                   |
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
│   ├── infrastructure/          # Adapters + providers
│   │   ├── adapters/            # Generic adapters
│   │   ├── providers/           # One folder per agent
│   │   │   ├── claude/          # JSONL parser
│   │   │   ├── gemini/          # JSON parser
│   │   │   ├── openai/          # JSONL parser
│   │   │   └── cursor/          # SQLite reader
│   │   └── parsers/             # Shared JSONL parser
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
git clone https://github.com/vineethkrishnan/agent-sessions.git
cd agent-sessions
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
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run test:all` | Run unit + E2E tests |
| `npm run test:cov` | Run tests with coverage |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint source files |
| `npm run lint:dead-code` | Detect dead code (knip) |
| `npm run lint:duplicates` | Detect code duplication |
| `npm run analyze` | Run all quality checks |
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
- At least one supported CLI agent installed:
  - [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
  - [Gemini CLI](https://github.com/google-gemini/gemini-cli)
  - [OpenAI Codex](https://github.com/openai/codex)
  - [Cursor Agent](https://www.cursor.com/)
- [fzf](https://github.com/junegunn/fzf) (optional)

## Documentation

Full documentation is available at **[agent-sessions.vineethnk.in](https://agent-sessions.vineethnk.in/)**.

## License

MIT
