# Session Format

## Provider Storage Overview

Each AI agent stores sessions differently. agent-sessions reads each format natively.

| Provider | Location | Format | Metadata Extracted |
|----------|----------|--------|-------------------|
| **Claude** | `~/.claude/projects/<encoded-path>/` | JSONL | Project, git branch, cwd, messages |
| **Gemini** | `~/.gemini/tmp/<hash>/chats/` | JSON | Project, git branch, cwd, messages |
| **OpenAI Codex** | `~/.codex/sessions/` (recursive) | JSONL | Messages only |
| **Cursor** | `~/.cursor/chats/<hash>/<uuid>/store.db` | SQLite | Session name, cwd, messages |

## Claude Code

Sessions are stored in `~/.claude/projects/`. Each project directory is named using an encoded path (e.g., `-Users-vineeth-projects-myapp`).

### Directory Layout

```
~/.claude/projects/
├── -Users-vineeth-projects-myapp/
│   ├── abc123def.jsonl
│   ├── xyz789ghi.jsonl
│   └── ...
├── -Users-vineeth-projects-other/
│   └── ...
```

### JSONL Structure

Each line is a JSON object representing a message:

```json
{"type": "user", "message": {"content": "Fix the auth bug"}, "gitBranch": "main", "cwd": "/Users/me/myapp"}
{"type": "assistant", "message": {"content": "I'll look at the auth module..."}}
```

### Path Decoding

The encoded directory name `-Users-vineeth-projects-myapp` is decoded to `/Users/vineeth/projects/myapp`, and the home prefix is replaced with `~` for display.

## Gemini CLI

Sessions are stored as JSON files inside `~/.gemini/tmp/<project-hash>/chats/`.

### JSON Structure

```json
{
  "sessionId": "session-abc",
  "project": "my-project",
  "cwd": "/home/user/project",
  "gitBranch": "main",
  "messages": [
    { "type": "user", "content": "How do I fix this?" },
    { "type": "gemini", "content": "Let me help..." }
  ]
}
```

Note: Gemini uses `type: "gemini"` for assistant messages (not `"assistant"`).

## OpenAI Codex

Sessions are stored as JSONL files in `~/.codex/sessions/`, scanned recursively.

### JSONL Structure

```json
{"role": "user", "content": "Build a REST API"}
{"role": "assistant", "content": "I'll create the API..."}
```

Codex uses `role` (not `type`) to identify message authors. Project and git branch metadata are not available in the session files.

## Cursor

Cursor stores sessions as SQLite databases at `~/.cursor/chats/<workspace-hash>/<agent-uuid>/store.db`. On Windows, the path is `%APPDATA%/Cursor/chats/`.

### Database Schema

**`meta` table** — Session metadata stored as hex-encoded JSON:

```json
{
  "agentId": "3d52bc50-f05d-44fc-9bd1-2b2d3b9e4059",
  "name": "Fix Auth Bug",
  "createdAt": 1772175077867,
  "lastUsedModel": "claude-4.6-opus-high-thinking"
}
```

**`blobs` table** — Messages stored as JSON blobs:

```json
{"role": "user", "content": "Fix the login bug"}
{"role": "assistant", "content": "I'll investigate the login flow..."}
```

The first user message typically contains Cursor's system context (`<user_info>` block with OS, workspace path, etc.). The actual user query is wrapped in `<user_query>` tags in subsequent messages. agent-sessions extracts the workspace path and strips the XML wrappers automatically.

## What agent-sessions Extracts

### Session List

| Field | Claude | Gemini | Codex | Cursor |
|-------|--------|--------|-------|--------|
| Session ID | Filename | Filename | Filename | Agent UUID |
| Project | Decoded dir name | JSON field | "Unknown" | Session name |
| Git Branch | JSONL metadata | JSON field | — | — |
| Working Dir | JSONL metadata | JSON field | — | Extracted from context |
| Message Count | user + assistant | user + gemini | user + assistant | user + assistant |
| Preview | First user message | First user message | First user message | First user query (XML-stripped) |

### Session Preview

When you press `p` on a session, the tool parses up to 20 messages and displays the conversation with proper `You` / `<Agent>` labels.

### Resume

When you press `Enter`, agent-sessions spawns the agent's CLI resume command from the session's original working directory, so the agent can locate its session files.
