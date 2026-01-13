package exporter

import (
	"fmt"
	"image"
	idraw "image/draw"
	"os"
	"path/filepath"
	"sort"

	"image/color"

	vidio "github.com/AlexEidt/Vidio"
	xdraw "golang.org/x/image/draw"

	"storyboard_flow/internal/models"
)

// ExportOptions configures a video export
type ExportOptions struct {
	Width       int
	Height      int
	FPS         int
	Bitrate     int
	DefaultSecs float64
}

// ExportProjectToMP4 exports the given project to an MP4 using Vidio (ffmpeg wrapper).
// Currently panels must reference local image file paths in Panel.ImageData.
func ExportProjectToMP4(p *models.Project, outputPath string, opts ExportOptions) error {
	if p == nil {
		return fmt.Errorf("nil project")
	}

	// Ensure panels are in order
	panels := make([]models.Panel, len(p.Panels))
	copy(panels, p.Panels)
	sort.Slice(panels, func(i, j int) bool { return panels[i].Order < panels[j].Order })

	// Create parent dir
	if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
		return err
	}

	options := &vidio.Options{
		FPS:     float64(opts.FPS),
		Bitrate: opts.Bitrate,
		Codec:   "libx264",
	}

	writer, err := vidio.NewVideoWriter(outputPath, opts.Width, opts.Height, options)
	if err != nil {
		return err
	}
	defer writer.Close()

	// For each panel, load image and write repeated frames for duration
	for _, panel := range panels {
		img, err := loadAndPrepareImage(panel.ImageData, opts.Width, opts.Height)
		if err != nil {
			// fallback: produce a blank frame
			img = image.NewRGBA(image.Rect(0, 0, opts.Width, opts.Height))
			bg := image.NewUniform(color.White)
			idraw.Draw(img, img.Bounds(), bg, image.Point{}, idraw.Src)
		}

		secs := panel.Duration
		if secs <= 0 {
			secs = opts.DefaultSecs
		}
		frames := int(secs * float64(opts.FPS))
		if frames <= 0 {
			frames = int(opts.FPS) // at least one second
		}

		// Vidio expects a flattened RGBA byte slice
		buf := img.Pix
		for i := 0; i < frames; i++ {
			if err := writer.Write(buf); err != nil {
				return err
			}
		}
	}

	return nil
}

// loadAndPrepareImage loads an image from a file path and resizes it to width/height as RGBA
func loadAndPrepareImage(path string, width, height int) (*image.RGBA, error) {
	if path == "" {
		return nil, fmt.Errorf("empty image path")
	}

	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	src, _, err := image.Decode(f)
	if err != nil {
		return nil, err
	}

	dst := image.NewRGBA(image.Rect(0, 0, width, height))
	xdraw.CatmullRom.Scale(dst, dst.Bounds(), src, src.Bounds(), xdraw.Over, nil)

	// if dst has no alpha filled, ensure background is white — not strictly necessary for all inputs
	bg := image.NewUniform(color.White)
	idraw.Draw(dst, dst.Bounds(), bg, image.Point{}, idraw.Over)

	return dst, nil
}
