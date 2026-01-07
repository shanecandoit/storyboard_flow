package models

// Panel represents a single storyboard panel/frame
type Panel struct {
	ID           string   `json:"id"`
	Order        int      `json:"order"`
	ImageData    string   `json:"image_data"`     // base64 encoded image or file path
	ActionNotes  string   `json:"action_notes"`
	Dialogue     string   `json:"dialogue"`
	ShotType     string   `json:"shot_type"`      // Wide, Medium, Close-up, Extreme Close-up
	CameraAngle  string   `json:"camera_angle"`   // Eye-level, Low, High, Dutch
	CameraMove   string   `json:"camera_move"`    // Static, Pan, Tilt, Zoom, Dolly, Truck
	Duration     float64  `json:"duration"`       // in seconds
	CharacterIDs []string `json:"character_ids"`  // IDs of characters in this panel
}

// NewPanel creates a new panel with the given order
func NewPanel(order int) *Panel {
	return &Panel{
		ID:           generateID(),
		Order:        order,
		ImageData:    "",
		ActionNotes:  "",
		Dialogue:     "",
		ShotType:     "Medium",
		CameraAngle:  "Eye-level",
		CameraMove:   "Static",
		Duration:     3.0,
		CharacterIDs: []string{},
	}
}
