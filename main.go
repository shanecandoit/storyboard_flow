package main

import (
	"embed"
	"io/fs"
	"log"

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

	// Inject CSS and JS into HTML
	html := string(htmlBytes)
	html = injectAssets(html, string(cssBytes), string(appJSBytes), string(panelsJSBytes))

	log.Printf("Final HTML length: %d bytes\n", len(html))
	log.Println("Setting HTML content...")

	w.SetHtml(html)
	w.Run()

	log.Println("WebView closed")
}

func injectAssets(html, css, appJS, panelsJS string) string {
	// Replace link and script tags with inline content
	html = replaceTag(html, `<link rel="stylesheet" href="css/styles.css">`, `<style>`+css+`</style>`)
	html = replaceTag(html, `<script src="js/app.js"></script>`, `<script>`+appJS+`</script>`)
	html = replaceTag(html, `<script src="js/panels.js"></script>`, `<script>`+panelsJS+`</script>`)
	return html
}

func replaceTag(html, old, new string) string {
	// Simple string replacement
	result := ""
	for i := 0; i < len(html); i++ {
		if i+len(old) <= len(html) && html[i:i+len(old)] == old {
			result += new
			i += len(old) - 1
		} else {
			result += string(html[i])
		}
	}
	return result
}
