# Keybindings

## TUI Mode

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate sessions |
| `Page Up` / `Page Down` | Jump 10 sessions |
| `/` | Start search / filter |
| `Enter` | Resume selected session (or confirm search) |
| `d` | Delete selected session (with confirmation) |
| `Esc` | Clear search filter |
| `q` | Quit |

## Search Mode

When you press `/`, the search bar activates:

- Type to filter sessions by project name, git branch, or message preview
- Search is case-insensitive substring matching
- Press `Enter` to confirm the filter and return to navigation
- Press `Esc` to clear the filter

## Delete Confirmation

When you press `d` on a session:

- A confirmation dialog appears showing the session details
- Press `y` to confirm deletion
- Press `n` or `Esc` to cancel
