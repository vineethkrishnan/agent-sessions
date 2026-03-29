# Session preview: navigate → open preview → scroll → close
# Run: vhs vhs/preview.tape

Output docs/assets/preview.gif

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

Type "agent-sessions --no-splash"
Enter
Sleep 3s

# Navigate to a session
Down
Sleep 500ms
Down
Sleep 500ms

# Open preview
Type "p"
Sleep 3s

# Scroll through conversation
Down
Sleep 400ms
Down
Sleep 400ms
Down
Sleep 400ms
Down
Sleep 400ms
Down
Sleep 400ms

Sleep 2s

# Close preview
Escape
Sleep 1.5s

Type "q"
Sleep 500ms
