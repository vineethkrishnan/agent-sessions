# CLI Reference

## Synopsis

```
claude-sessions [options]
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--fzf` | Use fzf for session selection | `false` |
| `--delete` | Enable delete mode | `false` |
| `--no-splash` | Skip the splash screen animation | `false` |
| `-v, --version` | Print version and exit | — |
| `-h, --help` | Print help and exit | — |

## Examples

```bash
# Launch interactive TUI
claude-sessions

# Use fzf picker
claude-sessions --fzf

# Enable deletion with no splash
claude-sessions --delete --no-splash

# Check version
claude-sessions --version
```

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Normal exit or session resumed |
| `1` | No sessions found |
