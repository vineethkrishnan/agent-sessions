# Installation

## npm (recommended)

```bash
npm install -g @vineethnkrishnan/agent-sessions
```

Or run without installing:

```bash
npx @vineethnkrishnan/agent-sessions
```

## From source

```bash
git clone https://github.com/vineethkrishnan/agent-sessions.git
cd agent-sessions
npm install
npm run build
npm link
```

## Verify

```bash
agent-sessions --version
```

## Prerequisites

- **Node.js 20+** — [Download](https://nodejs.org/)
- **At least one supported AI CLI agent** — Claude Code, Gemini CLI, OpenAI Codex, or Cursor
- **fzf** (optional) — Only needed for `--fzf` mode. [Install fzf](https://github.com/junegunn/fzf#installation)
