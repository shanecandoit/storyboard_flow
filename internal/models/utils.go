package models

import (
	"crypto/rand"
	"encoding/hex"
)

// generateID creates a unique ID for entities
func generateID() string {
	bytes := make([]byte, 8)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}
