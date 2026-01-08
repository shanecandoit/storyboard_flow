package ui

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"storyboard_flow/internal/app"
	"storyboard_flow/internal/models"
	"storyboard_flow/internal/storage"
)

// Handlers contains all the Go functions bound to JavaScript
type Handlers struct {
	state *app.State
}

// NewHandlers creates a new handlers instance
func NewHandlers(state *app.State) *Handlers {
	return &Handlers{state: state}
}

// CreateNewProject creates a new project
func (h *Handlers) CreateNewProject(name string) error {
	h.state.NewProject(name)
	return nil
}

// CreatePanel adds a new panel and returns it
func (h *Handlers) CreatePanel() (string, error) {
	panel := h.state.AddPanel()
	if panel == nil {
		return "", fmt.Errorf("failed to create panel")
	}

	data, err := json.Marshal(panel)
	if err != nil {
		return "", err
	}

	return string(data), nil
}

// DuplicatePanel duplicates an existing panel and returns the new panel as JSON
func (h *Handlers) DuplicatePanel(panelID string) (string, error) {
	panel := h.state.DuplicatePanel(panelID)
	if panel == nil {
		return "", fmt.Errorf("failed to duplicate panel")
	}

	data, err := json.Marshal(panel)
	if err != nil {
		return "", err
	}

	return string(data), nil
}

// GetPanels returns all panels as JSON
func (h *Handlers) GetPanels() (string, error) {
	panels := h.state.GetPanels()
	data, err := json.Marshal(panels)
	if err != nil {
		return "", err
	}

	return string(data), nil
}

// UpdatePanel updates a specific field of a panel
func (h *Handlers) UpdatePanel(panelID, field string, value interface{}) error {
	updated := h.state.UpdatePanel(panelID, func(p *models.Panel) {
		switch field {
		case "action_notes":
			if v, ok := value.(string); ok {
				p.ActionNotes = v
			}
		case "dialogue":
			if v, ok := value.(string); ok {
				p.Dialogue = v
			}
		case "shot_type":
			if v, ok := value.(string); ok {
				p.ShotType = v
			}
		case "camera_angle":
			if v, ok := value.(string); ok {
				p.CameraAngle = v
			}
		case "camera_move":
			if v, ok := value.(string); ok {
				p.CameraMove = v
			}
		case "duration":
			if v, ok := value.(float64); ok {
				p.Duration = v
			}
		case "image_data":
			if v, ok := value.(string); ok {
				p.ImageData = v
			}
		}
	})

	if !updated {
		return fmt.Errorf("panel not found")
	}

	return nil
}

// DeletePanel removes a panel
func (h *Handlers) DeletePanel(panelID string) error {
	if !h.state.DeletePanel(panelID) {
		return fmt.Errorf("panel not found")
	}
	return nil
}

// SaveProject saves the current project to a file
func (h *Handlers) SaveProject() (string, error) {
	project := h.state.GetProject()
	projectPath := h.state.GetProjectPath()

	if project == nil {
		return "", fmt.Errorf("no project to save")
	}

	// If no path set, use default
	if projectPath == "" {
		projectPath = fmt.Sprintf("projects/%s.json", project.Name)
		h.state.SetProjectPath(projectPath)
	}

	if err := storage.SaveProject(project, projectPath); err != nil {
		return "", err
	}

	h.state.MarkClean()

	return fmt.Sprintf("Project saved to %s", projectPath), nil
}

// LoadProject loads a project from a file
func (h *Handlers) LoadProject() (string, error) {
	// Use default path pattern - in real app would use file dialog
	// For now, just look for project.json
	filePath := "projects/project.json"

	project, err := storage.LoadProject(filePath)
	if err != nil {
		return "", err
	}

	h.state.SetProject(project, filePath)

	data, err := json.Marshal(map[string]interface{}{
		"name":   project.Name,
		"panels": len(project.Panels),
	})
	if err != nil {
		return "", err
	}

	return string(data), nil
}

// RenameProject renames the current project
func (h *Handlers) RenameProject(newName string) error {
	if !h.state.RenameProject(newName) {
		return fmt.Errorf("no project to rename")
	}
	return nil
}

// SaveExportHTML saves provided HTML content to disk under assets/prints
func (h *Handlers) SaveExportHTML(filename, content string) (string, error) {
	dir := filepath.FromSlash("assets/prints")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", err
	}

	if filename == "" {
		filename = "export.html"
	}

	// keep filename safe-ish
	safe := filepath.Base(filename)
	path := filepath.Join(dir, safe)

	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		return "", err
	}

	return path, nil
}
