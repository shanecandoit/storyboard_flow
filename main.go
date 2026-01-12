package main

import (
	"embed"
	"io/fs"
	"log"
	"strings"

	webview "github.com/webview/webview_go"

	"storyboard_flow/internal/app"
	"storyboard_flow/internal/ui"
)

//go:embed web
var webFS embed.FS

func main() {
	// Create application state
	state := app.NewState()

	// Create handlers
	handlers := ui.NewHandlers(state)

	// Create webview
	debug := true
	w := webview.New(debug)
	defer w.Destroy()

	w.SetTitle("Storyboard Flow")
	w.SetSize(1400, 900, webview.HintNone)

	// Bind Go functions to JavaScript
	w.Bind("createNewProject", handlers.CreateNewProject)
	w.Bind("createPanel", handlers.CreatePanel)
	w.Bind("getPanels", handlers.GetPanels)
	w.Bind("updatePanel", handlers.UpdatePanel)
	w.Bind("deletePanel", handlers.DeletePanel)
	w.Bind("saveProject", handlers.SaveProject)
	w.Bind("loadProject", handlers.LoadProject)
	w.Bind("renameProject", handlers.RenameProject)
	w.Bind("saveExportHTML", handlers.SaveExportHTML)
	w.Bind("duplicatePanel", handlers.DuplicatePanel)
	w.Bind("reorderPanel", handlers.ReorderPanel)
	w.Bind("addCharacter", handlers.AddCharacter)
	w.Bind("getCharacters", handlers.GetCharacters)
	w.Bind("deleteCharacter", handlers.DeleteCharacter)

	// Load HTML from embedded filesystem
	log.Println("Loading web assets...")

	htmlBytes, err := fs.ReadFile(webFS, "web/index.html")
	if err != nil {
		log.Fatal("Failed to read index.html:", err)
	}
	log.Printf("Loaded index.html: %d bytes\n", len(htmlBytes))

	cssBytes, err := fs.ReadFile(webFS, "web/css/styles.css")
	if err != nil {
		log.Fatal("Failed to read styles.css:", err)
	}
	log.Printf("Loaded styles.css: %d bytes\n", len(cssBytes))

	appJSBytes, err := fs.ReadFile(webFS, "web/js/app.js")
	if err != nil {
		log.Fatal("Failed to read app.js:", err)
	}
	log.Printf("Loaded app.js: %d bytes\n", len(appJSBytes))

	panelsJSBytes, err := fs.ReadFile(webFS, "web/js/panels.js")
	if err != nil {
		log.Fatal("Failed to read panels.js:", err)
	}
	log.Printf("Loaded panels.js: %d bytes\n", len(panelsJSBytes))

	charactersJSBytes, err := fs.ReadFile(webFS, "web/js/characters.js")
	if err != nil {
		log.Printf("Warning: Failed to read characters.js (might not exist yet): %v\n", err)
		charactersJSBytes = []byte("")
	} else {
		log.Printf("Loaded characters.js: %d bytes\n", len(charactersJSBytes))
	}

	timelineCSSBytes, err := fs.ReadFile(webFS, "web/css/timeline.css")
	if err != nil {
		log.Printf("Warning: Failed to read timeline.css (might not exist yet): %v\n", err)
		timelineCSSBytes = []byte("")
	} else {
		log.Printf("Loaded timeline.css: %d bytes\n", len(timelineCSSBytes))
	}

	timelineJSBytes, err := fs.ReadFile(webFS, "web/js/timeline.js")
	if err != nil {
		log.Printf("Warning: Failed to read timeline.js (might not exist yet): %v\n", err)
		timelineJSBytes = []byte("")
	} else {
		log.Printf("Loaded timeline.js: %d bytes\n", len(timelineJSBytes))
	}

	// Inject CSS and JS into HTML
	html := string(htmlBytes)
	html = injectAssets(html, string(cssBytes), string(appJSBytes), string(panelsJSBytes), string(charactersJSBytes), string(timelineCSSBytes), string(timelineJSBytes))

	log.Printf("Final HTML length: %d bytes\n", len(html))
	log.Println("Setting HTML content...")

	w.SetHtml(html)
	w.Run()

	log.Println("WebView closed")
}

func injectAssets(html, css, appJS, panelsJS, charactersJS, timelineCSS, timelineJS string) string {
	// Replace link and script tags with inline content
	html = strings.ReplaceAll(html, `<link rel="stylesheet" href="css/styles.css">`, `<style>`+css+`</style>`)
	html = strings.ReplaceAll(html, `<link rel="stylesheet" href="css/timeline.css">`, `<style>`+timelineCSS+`</style>`)
	html = strings.ReplaceAll(html, `<script src="js/app.js"></script>`, `<script>`+appJS+`</script>`)
	html = strings.ReplaceAll(html, `<script src="js/characters.js"></script>`, `<script>`+charactersJS+`</script>`)
	html = strings.ReplaceAll(html, `<script src="js/panels.js"></script>`, `<script>`+panelsJS+`</script>`)
	html = strings.ReplaceAll(html, `<script src="js/timeline.js"></script>`, `<script>`+timelineJS+`</script>`)
	return html
}
