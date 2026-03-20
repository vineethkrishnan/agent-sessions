# fzf Integration

## Overview

For users who prefer [fzf](https://github.com/junegunn/fzf), claude-sessions can pipe session data directly to fzf for selection.

## Usage

```bash
claude-sessions --fzf
```

## What It Shows

fzf receives a formatted table with columns:

| Column | Description |
|--------|-------------|
| Date | Last modified timestamp |
| Project | Decoded project path |
| Branch | Git branch name |
| Msgs | Message count |
| First Message | Preview of the first user message |

## How It Works

1. Sessions are loaded and formatted into tab-delimited lines
2. Lines are piped to fzf with a header row
3. You select a session using fzf's fuzzy matching
4. The selected session ID is extracted and `claude --resume <id>` is launched

## Requirements

fzf must be installed and available in your `$PATH`.

```bash
# macOS
brew install fzf

# Ubuntu/Debian
sudo apt install fzf
```
