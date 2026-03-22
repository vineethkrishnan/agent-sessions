# Full demo: browse → preview → search → quit
# Run: CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" vhs vhs/demo.tape

Output docs/assets/demo.gif

Set Shell zsh
Set Theme "Catppuccin Mocha"
Set FontSize 14
Set Width 1200
Set Height 600
Set Padding 20
Set TypingSpeed 50ms

Type "node dist/cli.js --no-splash"
Enter
Sleep 3s

# Navigate down through sessions
Down
Sleep 600ms
Down
Sleep 600ms
Down
Sleep 600ms

# Open preview
Type "p"
Sleep 3s

# Scroll down in preview
Down
Sleep 400ms
Down
Sleep 400ms
Down
Sleep 400ms

Sleep 2s

# Close preview
Escape
Sleep 2s

# Open search
Type "/"
Sleep 600ms
Type "backupctl"
Sleep 2s

# Confirm search
Enter
Sleep 2s

# Clear search
Escape
Sleep 1s

# Quit
Type "q"
Sleep 500ms
