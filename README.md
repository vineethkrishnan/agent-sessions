# claude-sessions

Interactive session manager for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Browse, search, delete, and resume past conversations from your terminal.

Claude Code provides `--resume <session-id>` and `--continue`, but no way to browse or search through your session history. This tool fills that gap.

```
     ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗
    ██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝
    ██║     ██║     ███████║██║   ██║██║  ██║█████╗
    ╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗
     ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝
            ██████╗ ███████╗███████╗██╗   ██╗███╗   ███╗███████╗
            ██████╔╝█████╗  ███████╗██║   ██║██╔████╔██║█████╗
            ██║  ██║███████╗███████║╚██████╔╝██║ ╚═╝ ██║███████╗
            ╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝
```

## Features

- Browse all Claude Code sessions sorted by most recent
- Shows date, project, git branch, message count, and first message preview
- Fuzzy search/filter to find sessions quickly
- Delete old sessions you no longer need
- Optional fzf integration for power users
- Animated splash screen on startup
- Works on macOS and Linux

## Installation

```bash
npm install -g claude-sessions
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
| `d`         | Delete selected session        |
| `Esc`       | Clear search filter            |
| `q`         | Quit                           |

## Architecture

Vertical-slice hexagonal architecture with modular domain structure:

```
src/
├── domain/session/              # Session domain module
│   ├── domain/                  # Pure business logic (zero deps)
│   │   ├── session.model.ts     # Session entity + filtering
│   │   └── session.error.ts     # Domain errors
│   ├── application/             # Use cases + ports
│   │   ├── ports/               # Interface contracts
│   │   ├── list-sessions.use-case.ts
│   │   ├── delete-session.use-case.ts
│   │   └── resume-session.use-case.ts
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

- **test.yml** — Runs tests on Node 18/20/22 on every push and PR
- **pr-title-check.yml** — Validates Conventional Commits format on PR titles
- **duplication-check.yml** — Detects code duplication via jscpd
- **release-please.yml** — Automated semantic versioning and npm publish

### Commit Convention

Follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(session): add fuzzy search filtering
fix(parser): handle array content format in JSONL
chore: update dependencies
```

## Requirements

- Node.js 18+
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI installed
- [fzf](https://github.com/junegunn/fzf) (optional)

## License

MIT
