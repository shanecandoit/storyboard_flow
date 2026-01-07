package storage

import (
	"encoding/json"
	"os"
	"path/filepath"

	"storyboard_flow/internal/models"
)

// SaveProject saves a project to a JSON file
func SaveProject(project *models.Project, filePath string) error {
	// Ensure directory exists
	dir := filepath.Dir(filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	// Marshal project to JSON
	data, err := json.MarshalIndent(project, "", "  ")
	if err != nil {
		return err
	}

	// Write to file
	return os.WriteFile(filePath, data, 0644)
}

// LoadProject loads a project from a JSON file
func LoadProject(filePath string) (*models.Project, error) {
	// Read file
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	// Unmarshal JSON
	var project models.Project
	if err := json.Unmarshal(data, &project); err != nil {
		return nil, err
	}

	return &project, nil
}
