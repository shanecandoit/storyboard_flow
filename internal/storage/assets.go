package storage

import (
	"encoding/base64"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// SaveCharacterImage saves a base64 encoded image to the assets/characters directory
func SaveCharacterImage(base64Data, filenamePrefix string) (string, error) {
	// Ensure directory exists
	dir := filepath.Join("assets", "characters")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("failed to create assets directory: %w", err)
	}

	// Parse base64 data
	// Format usually is "data:image/png;base64,....."
	parts := strings.Split(base64Data, ",")
	if len(parts) != 2 {
		return "", fmt.Errorf("invalid base64 image data")
	}

	data, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return "", fmt.Errorf("failed to decode base64 data: %w", err)
	}

	// Determine extension (simple check)
	ext := ".png"
	if strings.Contains(parts[0], "image/jpeg") {
		ext = ".jpg"
	}

	// Create filename
	filename := fmt.Sprintf("%s_%d%s", filenamePrefix, time.Now().UnixNano(), ext)
	path := filepath.Join(dir, filename)

	// Write file
	if err := os.WriteFile(path, data, 0644); err != nil {
		return "", fmt.Errorf("failed to write image file: %w", err)
	}

	// Return relative path with forward slashes for web usage
	return filepath.ToSlash(path), nil
}

// SaveAsset saves an asset file (like character images) to the assets directory
func SaveAsset(sourceReader io.Reader, destPath string) error {
	// Ensure directory exists
	dir := filepath.Dir(destPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	// Create destination file
	destFile, err := os.Create(destPath)
	if err != nil {
		return err
	}
	defer destFile.Close()

	// Copy data
	_, err = io.Copy(destFile, sourceReader)
	return err
}

// DeleteAsset deletes an asset file
func DeleteAsset(filePath string) error {
	return os.Remove(filePath)
}
