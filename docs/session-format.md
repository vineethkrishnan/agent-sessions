# Session Format

## How Claude Code Stores Sessions

Claude Code stores session data in `~/.claude/projects/`. Each project directory is named using an encoded path (e.g., `-Users-vineeth-projects-myapp`).

Inside each project directory, sessions are stored as `.jsonl` files named by session ID.

## Directory Layout

```
~/.claude/projects/
├── -Users-vineeth-projects-myapp/
│   ├── abc123def.jsonl
│   ├── xyz789ghi.jsonl
│   └── ...
├── -Users-vineeth-projects-other/
│   └── ...
```

## JSONL Structure

Each line in a `.jsonl` file is a JSON object representing a message:

```json
{"type": "human", "message": {"content": "Fix the auth bug"}}
{"type": "assistant", "message": {"content": "I'll look at the auth module..."}}
```

## What claude-sessions Extracts

### Session List

| Field | Source |
|-------|--------|
| Session ID | Filename (without `.jsonl`) |
| Project | Decoded from parent directory name |
| Modified At | File modification timestamp |
| Git Branch | Extracted from session metadata |
| Message Count | Count of human + assistant messages |
| Preview | First human message, truncated to 80 chars |
| Working Directory | Decoded from directory path |

### Session Preview

When you press `p` on a session, the tool parses the full JSONL file and extracts the first 20 user/assistant messages with their complete text content. This lets you review a conversation before resuming it.

## Path Decoding

The encoded directory name `-Users-vineeth-projects-myapp` is decoded to `/Users/vineeth/projects/myapp`, and the home prefix is replaced with `~` for display.
