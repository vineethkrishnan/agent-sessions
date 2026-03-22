# Delete flow: navigate → press d → cancel
# Run: CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" vhs vhs/delete.tape

Output docs/assets/delete.gif

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
