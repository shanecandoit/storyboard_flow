package app

import (
	"sync"
	"time"

	"storyboard_flow/internal/models"
)

// State manages the application state
type State struct {
	mu             sync.RWMutex
	CurrentProject *models.Project
	ProjectPath    string
	IsDirty        bool // true if project has unsaved changes
}

// NewState creates a new application state
func NewState() *State {
	return &State{
		CurrentProject: nil,
		ProjectPath:    "",
		IsDirty:        false,
	}
}

// NewProject creates a new project
func (s *State) NewProject(name string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.CurrentProject = models.NewProject(name)
	s.ProjectPath = ""
	s.IsDirty = true
}

// AddPanel adds a new panel to the current project
func (s *State) AddPanel() *models.Panel {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.CurrentProject == nil {
		return nil
	}

	order := len(s.CurrentProject.Panels)
	panel := models.NewPanel(order)
	s.CurrentProject.Panels = append(s.CurrentProject.Panels, *panel)
	s.CurrentProject.ModifiedAt = time.Now()
	s.IsDirty = true

	return panel
}

// DuplicatePanel creates a copy of the specified panel and appends it
func (s *State) DuplicatePanel(panelID string) *models.Panel {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.CurrentProject == nil {
		return nil
	}

	var src *models.Panel
	for i := range s.CurrentProject.Panels {
		if s.CurrentProject.Panels[i].ID == panelID {
			src = &s.CurrentProject.Panels[i]
			break
		}
	}

	if src == nil {
		return nil
	}

	// Create a new panel and copy fields (use NewPanel to get a valid ID)
	newPanel := models.NewPanel(len(s.CurrentProject.Panels))
	newPanel.ImageData = src.ImageData
	newPanel.ActionNotes = src.ActionNotes
	newPanel.Dialogue = src.Dialogue
	newPanel.ShotType = src.ShotType
	newPanel.CameraAngle = src.CameraAngle
	newPanel.CameraMove = src.CameraMove
	newPanel.Duration = src.Duration
	// Copy character IDs slice
	if len(src.CharacterIDs) > 0 {
		newPanel.CharacterIDs = make([]string, len(src.CharacterIDs))
		copy(newPanel.CharacterIDs, src.CharacterIDs)
	}

	s.CurrentProject.Panels = append(s.CurrentProject.Panels, *newPanel)
	s.CurrentProject.ModifiedAt = time.Now()
	s.IsDirty = true

	return newPanel
}

// UpdatePanel updates an existing panel
func (s *State) UpdatePanel(panelID string, updater func(*models.Panel)) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.CurrentProject == nil {
		return false
	}

	for i := range s.CurrentProject.Panels {
		if s.CurrentProject.Panels[i].ID == panelID {
			updater(&s.CurrentProject.Panels[i])
			s.CurrentProject.ModifiedAt = time.Now()
			s.IsDirty = true
			return true
		}
	}

	return false
}

// DeletePanel removes a panel from the current project
func (s *State) DeletePanel(panelID string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.CurrentProject == nil {
		return false
	}

	for i, panel := range s.CurrentProject.Panels {
		if panel.ID == panelID {
			// Remove panel
			s.CurrentProject.Panels = append(
				s.CurrentProject.Panels[:i],
				s.CurrentProject.Panels[i+1:]...,
			)

			// Reorder remaining panels
			for j := i; j < len(s.CurrentProject.Panels); j++ {
				s.CurrentProject.Panels[j].Order = j
			}

			s.CurrentProject.ModifiedAt = time.Now()
			s.IsDirty = true
			return true
		}
	}

	return false
}

// GetPanels returns all panels (read-only copy)
func (s *State) GetPanels() []models.Panel {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if s.CurrentProject == nil {
		return []models.Panel{}
	}

	// Return a copy to prevent external modification
	panels := make([]models.Panel, len(s.CurrentProject.Panels))
	copy(panels, s.CurrentProject.Panels)
	return panels
}

// AddCharacter adds a new character to the current project
func (s *State) AddCharacter(name, description string) *models.Character {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.CurrentProject == nil {
		return nil
	}

	character := models.NewCharacter(name, description)
	s.CurrentProject.Characters = append(s.CurrentProject.Characters, *character)
	s.CurrentProject.ModifiedAt = time.Now()
	s.IsDirty = true

	return character
}

// GetCharacters returns all characters (read-only copy)
func (s *State) GetCharacters() []models.Character {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if s.CurrentProject == nil {
		return []models.Character{}
	}

	characters := make([]models.Character, len(s.CurrentProject.Characters))
	copy(characters, s.CurrentProject.Characters)
	return characters
}

// GetProject returns a copy of the current project (thread-safe)
func (s *State) GetProject() *models.Project {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if s.CurrentProject == nil {
		return nil
	}

	// Return a pointer to the project (caller should not modify)
	return s.CurrentProject
}

// GetProjectPath returns the current project path
func (s *State) GetProjectPath() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.ProjectPath
}

// SetProjectPath sets the project path
func (s *State) SetProjectPath(path string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.ProjectPath = path
}

// SetProject sets the current project
func (s *State) SetProject(project *models.Project, path string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.CurrentProject = project
	s.ProjectPath = path
	s.IsDirty = false
}

// MarkClean marks the project as saved
func (s *State) MarkClean() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.IsDirty = false
}

// ReorderPanel moves a panel to a new index
func (s *State) ReorderPanel(panelID string, newIndex int) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.CurrentProject == nil {
		return false
	}

	// Find the current index of the panel
	currentIndex := -1
	for i, panel := range s.CurrentProject.Panels {
		if panel.ID == panelID {
			currentIndex = i
			break
		}
	}

	if currentIndex == -1 {
		return false // Panel not found
	}

	// Validate new index
	if newIndex < 0 || newIndex >= len(s.CurrentProject.Panels) {
		return false
	}

	if currentIndex == newIndex {
		return true // No change
	}

	// Move the panel
	panel := s.CurrentProject.Panels[currentIndex]
	
	// Remove from old position
	s.CurrentProject.Panels = append(
		s.CurrentProject.Panels[:currentIndex],
		s.CurrentProject.Panels[currentIndex+1:]...,
	)

	// Insert at new position
	// If newIndex is basically extending (handling bounds for insert)
	if newIndex >= len(s.CurrentProject.Panels) {
		s.CurrentProject.Panels = append(s.CurrentProject.Panels, panel)
	} else {
		s.CurrentProject.Panels = append(
			s.CurrentProject.Panels[:newIndex],
			append([]models.Panel{panel}, s.CurrentProject.Panels[newIndex:]...)...,
		)
	}

	// Update Order fields for all panels
	for i := range s.CurrentProject.Panels {
		s.CurrentProject.Panels[i].Order = i
	}

	s.CurrentProject.ModifiedAt = time.Now()
	s.IsDirty = true
	return true
}

// RenameProject renames the current project
func (s *State) RenameProject(newName string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.CurrentProject == nil {
		return false
	}

	s.CurrentProject.Name = newName
	s.CurrentProject.ModifiedAt = time.Now()
	s.IsDirty = true
	return true
}
