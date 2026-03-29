# fzf Integration

## Overview

For users who prefer [fzf](https://github.com/junegunn/fzf), **agent-sessions** can pipe session data directly to fzf for selection. This works for all supported agents.

## Usage

```bash
# Use current agent (prompts for agent if not specified)
agent-sessions --fzf

# Use a specific agent with fzf
agent-sessions --agent gemini --fzf
```

## What It Shows

fzf receives a formatted table with columns:

| Column | Description |
|--------|-------------|
| Date | Last modified timestamp |
| Agent | Provider name (Claude, Gemini, etc.) |
| Project | Decoded project path |
| Branch | Git branch name |
| Msgs | Message count |
| First Message | Preview of the first user message |

## How It Works

1. Sessions for the selected agent (or all agents) are loaded and formatted into tab-delimited lines
2. Each line encodes `{sessionId}::{providerName}` before the tab, followed by the visible columns
3. Lines are piped to fzf with a header row — fzf only displays the part after the tab
4. You select a session using fzf's fuzzy matching
5. The session ID and provider are extracted from the selection, and the provider's resume command is launched

## Requirements

fzf must be installed and available in your `$PATH`.

```bash
# macOS
brew install fzf

# Ubuntu/Debian
sudo apt install fzf
```
