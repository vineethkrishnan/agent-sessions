# FAQ

## Where are sessions stored?

Each agent stores sessions in a different location:

| Agent | Location | Format |
|-------|----------|--------|
| Claude | `~/.claude/projects/` | JSONL |
| Gemini | `~/.gemini/tmp/` | JSON |
| OpenAI Codex | `~/.codex/sessions/` | JSONL |
| Cursor | `~/.cursor/chats/` (macOS/Linux), `%APPDATA%/Cursor/chats/` (Windows) | SQLite |

## Why don't I see any sessions?

Make sure you have used at least one supported agent. Sessions only appear after you've had at least one conversation. You can also use the `a` key to switch between agents, or `--agent <name>` to target a specific one.

## Can I use this without all agents installed?

Yes. agent-sessions reads session files directly from disk and only shows agents that have sessions on your machine. The "resume" feature requires the respective agent's CLI to be available in your `$PATH`.

## Does this modify my sessions?

**No.** agent-sessions only reads session files. The only destructive operation is the explicit "delete" feature, which removes the session file and its companion directory after confirmation.

## What platforms are supported?

macOS, Linux, and Windows. Session paths are detected automatically per platform.

## Why does resume fail with "No conversation found"?

Some agents (like Claude Code) scope session lookup to the current working directory. agent-sessions handles this by spawning the resume command from the session's original working directory. If the original directory no longer exists, resume may fail.

## How do I update?

```bash
npm update -g @vineethnkrishnan/agent-sessions
```

## How do I uninstall?

```bash
npm uninstall -g @vineethnkrishnan/agent-sessions
```

## The splash screen is too slow

Use `--no-splash` to skip it:

```bash
agent-sessions --no-splash
```

## fzf mode doesn't work

Make sure fzf is installed and in your `$PATH`:

```bash
which fzf        # Should print a path
brew install fzf  # macOS
sudo apt install fzf  # Ubuntu/Debian
```
