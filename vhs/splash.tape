# Splash screen animation
# Run: CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" vhs vhs/splash.tape

Output docs/assets/splash.gif

Set Shell zsh
Set Theme "Catppuccin Mocha"
Set FontSize 14
Set Width 1200
Set Height 600
Set Padding 20
Set TypingSpeed 50ms

Type "node dist/cli.js"
Enter
Sleep 5s

Type "q"
Sleep 500ms
