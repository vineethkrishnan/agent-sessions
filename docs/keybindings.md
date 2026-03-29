# Keybindings

## TUI Mode

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate sessions / providers |
| `Page Up` / `Page Down` | Jump 10 sessions |
| `/` | Start search / filter |
| `Enter` | Resume selected session (or confirm search / select provider) |
| `p` | Preview session conversation |
| `d` | Delete selected session (with confirmation) |
| `a` | **Switch Agent** (go back to agent selector) |
| `Esc` | Clear search filter |
| `q` | Quit |

## Preview Mode

![preview](./assets/preview.gif)

When you press `p` on a session, a detail pane opens showing:

- **Session metadata** — ID, project, branch, date, message count, working directory
- **Conversation history** — The first 20 messages (user and assistant exchanges)

Preview keybindings:

| Key | Action |
|-----|--------|
| `↑` / `↓` | Scroll through messages |
| `Page Up` / `Page Down` | Scroll by 10 lines |
| `Enter` | Resume the session |
| `p` / `Esc` | Close preview, return to list |
| `q` | Quit |

## Search Mode

![search](./assets/search.gif)

When you press `/`, the search bar activates:

- Type to filter sessions by project name, git branch, or message preview
- Search is case-insensitive substring matching
- Press `Enter` to confirm the filter and return to navigation
- Press `Esc` to clear the filter

## Delete Confirmation

![delete](./assets/delete.gif)

When you press `d` on a session:

- A confirmation dialog appears showing the session details
- Press `y` to confirm deletion
- Press `n` or `Esc` to cancel
