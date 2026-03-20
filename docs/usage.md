# Usage

## Quick Start

```bash
claude-sessions
```

This launches the interactive TUI showing all your Claude Code sessions.

## Modes

### Interactive TUI (default)

```bash
claude-sessions
```

Browse sessions in a full-screen table. Use arrow keys to navigate, `/` to search, `Enter` to resume.

### fzf Mode

```bash
claude-sessions --fzf
```

Pipes session data to fzf for selection. Useful if you prefer fzf's fuzzy matching.

### Delete Mode

```bash
claude-sessions --delete
```

Enables the delete key (`d`) to remove sessions. A confirmation dialog prevents accidental deletions.

### Skip Splash Screen

```bash
claude-sessions --no-splash
```

Skips the animated splash screen and goes straight to the session table.

## Combining Flags

```bash
claude-sessions --delete --no-splash
```

All flags can be combined freely.
