# Usage

## Quick Start

```bash
agent-sessions
```

This launches the **Agent Selector** by default, allowing you to choose between Claude, Gemini, OpenAI Codex, and Cursor.

## Modes

### Agent Selector (default)

```bash
agent-sessions
```

If launched without a specific agent, you'll be prompted to select one. Use ↑/↓ and `Enter` to confirm. 

**Pro-tip:** Press `a` while browsing sessions to go back to this selector at any time.

### Specific Agent

```bash
agent-sessions --agent <name>
```

Skip the selector and go straight to sessions for a specific agent (e.g., `claude`, `gemini`, `codex`, `cursor`).

### Interactive TUI

```bash
agent-sessions
```

![splash](./assets/splash.gif)

Browse sessions in a full-screen table. Use arrow keys to navigate, `/` to search, `p` to preview a session's conversation, `Enter` to resume.

### fzf Mode

```bash
agent-sessions --fzf
```

Pipes session data for the selected agent to fzf for selection. Useful if you prefer fzf's fuzzy matching.

### Delete Mode

```bash
agent-sessions --delete
```

Enables the delete key (`d`) to remove sessions. A confirmation dialog prevents accidental deletions.

### Skip Splash Screen

```bash
agent-sessions --no-splash
```

Skips the animated splash screen and goes straight to the agent selector or session table.

## Combining Flags

```bash
agent-sessions --agent gemini --delete --no-splash
```

All flags can be combined freely.
