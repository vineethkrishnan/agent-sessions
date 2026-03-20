# Installation

## npm (recommended)

```bash
npm install -g claude-sessions
```

## From source

```bash
git clone https://github.com/vineethkrishnan/claude-sessions.git
cd claude-sessions
npm install
npm run build
npm link
```

## Verify

```bash
claude-sessions --version
```

## Prerequisites

- **Node.js 18+** — [Download](https://nodejs.org/)
- **Claude Code CLI** — Must be installed and have at least one session in `~/.claude/projects/`
- **fzf** (optional) — Only needed for `--fzf` mode. [Install fzf](https://github.com/junegunn/fzf#installation)
