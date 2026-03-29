# FAQ

## Where does Claude Code store sessions?

Sessions are stored in `~/.claude/projects/`. Each project has its own subdirectory containing `.jsonl` files for each session.

## Why don't I see any sessions?

Make sure you have used Claude Code at least once. Sessions only appear after you've had at least one conversation. Check that `~/.claude/projects/` exists and contains `.jsonl` files.

## Can I use this without Claude Code installed?

The tool reads session files directly from disk, so it works without Claude Code being installed. However, the "resume" feature requires `claude` to be available in your `$PATH`.

## Does this modify my sessions?

**No.** agent-sessions only reads session files. The only destructive operation is the explicit "delete" feature, which removes the `.jsonl` file and its companion directory after confirmation.

## What platforms are supported?

macOS and Linux. Windows is not currently supported due to path handling differences.

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
