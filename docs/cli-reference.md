# CLI Reference

## Synopsis

```
agent-sessions [options]
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--agent <name>` | Specify the AI agent (`claude`, `gemini`, `openai`, `cursor`) | `(selector)` |
| `--fzf` | Use fzf for session selection | `false` |
| `--delete` | Enable delete mode | `false` |
| `--no-splash` | Skip the splash screen animation | `false` |
| `-v, --version` | Print version and exit | — |
| `-h, --help` | Print help and exit | — |

## Examples

```bash
# Launch interactive TUI (shows Agent Selector)
agent-sessions

# Launch directly for Gemini
agent-sessions --agent gemini

# Use fzf picker for Cursor
agent-sessions --agent cursor --fzf

# Enable deletion with no splash for Claude
agent-sessions --agent claude --delete --no-splash

# Check version
agent-sessions --version
```

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Normal exit or session resumed |
| `1` | No sessions found for selected agent |
