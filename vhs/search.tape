# Search and filter: type queries → see results narrow down
# Run: CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" vhs vhs/search.tape

Output docs/assets/search.gif

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

# Start search
Type "/"
Sleep 600ms

# Type search query
Type@100ms "ayunis"
Sleep 2s

# Confirm search
Enter
Sleep 2s

# Clear filter
Escape
Sleep 1.5s

# Search again
Type "/"
Sleep 600ms
Type@100ms "backupctl"
Sleep 2s

Enter
Sleep 1.5s

Escape
Sleep 1s

Type "q"
Sleep 500ms
