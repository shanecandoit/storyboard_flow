package storage

import (
	"io"
	"os"
	"path/filepath"
)

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
