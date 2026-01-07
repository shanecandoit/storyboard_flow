package models

import "time"

// Project represents a storyboard project
type Project struct {
	Name         string      `json:"name"`
	CreatedAt    time.Time   `json:"created_at"`
	ModifiedAt   time.Time   `json:"modified_at"`
	AspectRatio  string      `json:"aspect_ratio"`  // e.g., "16:9", "4:3"
	FrameRate    int         `json:"frame_rate"`    // frames per second
	Panels       []Panel     `json:"panels"`
	Characters   []Character `json:"characters"`
}

// NewProject creates a new project with default settings
func NewProject(name string) *Project {
	now := time.Now()
	return &Project{
		Name:        name,
		CreatedAt:   now,
		ModifiedAt:  now,
		AspectRatio: "16:9",
		FrameRate:   24,
		Panels:      []Panel{},
		Characters:  []Character{},
	}
}
