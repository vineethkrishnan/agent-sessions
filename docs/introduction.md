# Introduction

**agent-sessions** is an interactive terminal UI (TUI) tool for browsing, searching, and resuming sessions from various AI CLI agents.

While tools like [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Gemini CLI](https://geminicli.com/), [OpenAI Codex](https://openai.com/), and [Cursor](https://cursor.com/) provide ways to resume sessions, browsing and searching through your history can be challenging. This tool provides a unified interface for all of them.

![demo](./assets/demo.gif)

## Why?

- You have dozens (or hundreds) of AI agent sessions across different tools
- You want to find that conversation from last week about the auth refactor
- You want to clean up old sessions cluttering your hidden directories
- You don't want to manually copy-paste session IDs or project hashes

## Supported Agents

| Agent | Store | Format | Resume Command |
|-------|-------|--------|----------------|
| **Claude** | `~/.claude/projects/` | JSONL | `claude --resume` |
| **Gemini** | `~/.gemini/tmp/` | JSON/JSONL | `gemini --resume` |
| **OpenAI Codex** | `~/.codex/sessions/` | JSONL | `codex resume` |
| **Cursor** | `~/.cursor-agent/sessions/` | JSONL | `agent --resume` |

## Features

| Feature | Description |
|---------|-------------|
| **Agent Selector** | Choose your AI agent upon startup or switch anytime |
| **Browse** | All sessions sorted by most recent |
| **Metadata** | Date, project, git branch, message count, first message preview |
| **Preview** | Peek into a session's conversation before resuming |
| **Search** | Live filter across project, branch, and message text |
| **Resume** | Launch the agent's resume command with one keypress |
| **Delete** | Remove old sessions with confirmation |
| **fzf mode** | Alternative selection via fzf for power users |

## Tech Stack

- **TypeScript** with strict mode
- **Ink** (React for the terminal) for the TUI
- **Commander** for CLI argument parsing
- **Hexagonal architecture** with a **Provider-based system** for multi-agent support
- **Vitest** for testing

## Requirements

- Node.js 20+
- At least one supported AI CLI agent installed
- [fzf](https://github.com/junegunn/fzf) (optional, for `--fzf` mode)
