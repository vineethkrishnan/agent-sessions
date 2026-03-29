# Splash screen animation
# Run: vhs vhs/splash.tape

Output docs/assets/splash.gif

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

Type "agent-sessions"
Enter
Sleep 5s

Type "q"
Sleep 500ms
