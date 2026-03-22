# Delete flow: navigate → press d → cancel
# Run: vhs vhs/delete.tape

Output docs/assets/delete.gif

Set Shell zsh
Set Theme "Catppuccin Mocha"
Set FontSize 14
Set Width 1200
Set Height 600
Set Padding 20
Set TypingSpeed 50ms

Hide
Type "export CLAUDE_SESSIONS_DIR=vhs/fixtures"
Enter
Sleep 500ms
Show

Type "claude-sessions --no-splash"
Enter
Sleep 3s

# Navigate to a session
Down
Sleep 500ms
Down
Sleep 500ms
Down
Sleep 500ms

# Press d to delete
Type "d"
Sleep 3s

# Cancel the delete
Type "n"
Sleep 2s

Type "q"
Sleep 500ms
