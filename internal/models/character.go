package models

// Character represents a character asset for reference
type Character struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	ImagePath   string `json:"image_path"` // relative path to character reference image
	ColorPalette string `json:"color_palette,omitempty"` // optional hex colors
}

// NewCharacter creates a new character
func NewCharacter(name, description string) *Character {
	return &Character{
		ID:          generateID(),
		Name:        name,
		Description: description,
		ImagePath:   "",
		ColorPalette: "",
	}
}
