// Timeline / Theatre View Component
const Timeline = {
    panels: [],
    segments: [],
    totalRuntime: 0,
    playbackState: {
        playing: false,
        startTimestamp: 0,
        offsetSeconds: 0
    },
    currentPanelIndex: -1,
    rafId: null,
    preloadedImages: [],

    // Initialize timeline component
    async init() {
        await this.loadPanels();
        this.computeSegments();
        this.preloadImages();
        this.render();
        // Setup event listeners after a small delay to ensure DOM is ready
        setTimeout(() => {
            this.setupEventListeners();
        }, 100);
    },

    // Load panels from backend
    async loadPanels() {
        try {
            const panelsStr = await getPanels();
            this.panels = JSON.parse(panelsStr);
            // Sort by order
            this.panels.sort((a, b) => a.order - b.order);
        } catch (err) {
            console.error('Error loading panels:', err);
            this.panels = [];
        }
    },

    // Compute timeline segments from panels
    computeSegments() {
        this.segments = [];
        let start = 0;
        
        for (let i = 0; i < this.panels.length; i++) {
            const panel = this.panels[i];
            const duration = panel.duration || 0;
            this.segments.push({
                id: panel.id,
                start: start,
                end: start + duration,
                duration: duration,
                index: i
            });
            start += duration;
        }
        
        this.totalRuntime = start;
    },

    // Preload panel images for smooth switching
    preloadImages() {
        this.preloadedImages = [];
        for (const panel of this.panels) {
            if (panel.image_data) {
                const img = new Image();
                img.src = panel.image_data;
                this.preloadedImages.push(img);
            } else {
                this.preloadedImages.push(null);
            }
        }
    },

    // Render timeline UI
    render() {
        const container = document.getElementById('timelineContainer');
        if (!container) return;

        // Render theatre area
        this.renderTheatre();
        
        // Render timeline bar
        this.renderTimelineBar();
        
        // Render controls
        this.renderControls();
        
        // Update display
        this.updateDisplay();
    },

    // Render theatre area (single panel display)
    renderTheatre() {
        const theatre = document.getElementById('theatreView');
        if (!theatre) return;

        if (this.panels.length === 0) {
            theatre.innerHTML = '<div class="theatre-empty">No panels to display</div>';
            return;
        }

        const currentPanel = this.getCurrentPanel();
        if (!currentPanel) {
            theatre.innerHTML = '<div class="theatre-empty">Select a position on the timeline</div>';
            return;
        }

        const img = this.preloadedImages[currentPanel.index];
        if (img && img.src) {
            theatre.innerHTML = `<img src="${img.src}" alt="Panel ${currentPanel.order + 1}" class="theatre-image">`;
        } else {
            theatre.innerHTML = `<div class="theatre-placeholder">Panel ${currentPanel.order + 1}<br>No image</div>`;
        }
    },

    // Render timeline bar with segments and markers
    renderTimelineBar() {
        const timelineBar = document.getElementById('timelineBar');
        if (!timelineBar) return;

        if (this.totalRuntime === 0) {
            timelineBar.innerHTML = '<div class="timeline-empty">No timeline data</div>';
            return;
        }

        // Force a layout calculation by accessing offsetWidth
        const width = timelineBar.offsetWidth || timelineBar.clientWidth || 800;
        if (width === 0) {
            // If width is 0, try again after a short delay
            setTimeout(() => this.renderTimelineBar(), 100);
            return;
        }
        
        const pxPerSecond = width / this.totalRuntime;

        // Clear existing content
        timelineBar.innerHTML = '';

        // Create segments container
        const segmentsContainer = document.createElement('div');
        segmentsContainer.className = 'timeline-segments';
        segmentsContainer.style.width = '100%';
        segmentsContainer.style.height = '100%';
        segmentsContainer.style.position = 'relative';

        // Draw segments and markers
        for (const segment of this.segments) {
            const segmentLeft = segment.start * pxPerSecond;
            const segmentWidth = segment.duration * pxPerSecond;

            // Segment background
            const segmentEl = document.createElement('div');
            segmentEl.className = 'timeline-segment';
            segmentEl.style.position = 'absolute';
            segmentEl.style.left = `${segmentLeft}px`;
            segmentEl.style.width = `${segmentWidth}px`;
            segmentEl.style.height = '100%';
            segmentEl.style.borderRight = '1px solid var(--border)';
            segmentEl.title = `Panel ${segment.index + 1}: ${segment.duration.toFixed(1)}s`;
            segmentsContainer.appendChild(segmentEl);

            // Marker line at end of segment (except last)
            if (segment.index < this.segments.length - 1) {
                const marker = document.createElement('div');
                marker.className = 'timeline-marker';
                marker.style.position = 'absolute';
                marker.style.left = `${segmentLeft + segmentWidth}px`;
                marker.style.width = '1px';
                marker.style.height = '100%';
                marker.style.backgroundColor = 'var(--text)';
                segmentsContainer.appendChild(marker);
            }
        }

        timelineBar.appendChild(segmentsContainer);

        // Create playhead
        const playhead = document.createElement('div');
        playhead.id = 'timelinePlayhead';
        playhead.className = 'timeline-playhead';
        playhead.style.position = 'absolute';
        playhead.style.top = '0';
        playhead.style.width = '2px';
        playhead.style.height = '100%';
        playhead.style.backgroundColor = '#ff0000';
        playhead.style.zIndex = '10';
        playhead.style.pointerEvents = 'none';
        timelineBar.appendChild(playhead);

        // Update playhead position
        this.updatePlayheadPosition();
    },

    // Render controls (play/pause, time display, etc.)
    renderControls() {
        const controls = document.getElementById('timelineControls');
        if (!controls) return;

        const icon = this.playbackState.playing ? '⏸' : '▶';
        controls.innerHTML = `
            <div class="timeline-controls-left">
                <button id="timelinePlayPause" class="timeline-btn">
                    <span id="playPauseIcon">${icon}</span>
                </button>
                <button id="timelineRewind" class="timeline-btn" title="Rewind 1 second">⏪</button>
                <button id="timelineForward" class="timeline-btn" title="Forward 1 second">⏩</button>
            </div>
            <div class="timeline-controls-center">
                <span id="timelineTime">${this.formatTime(this.playbackState.offsetSeconds)}</span>
            </div>
            <div class="timeline-controls-right">
                <span id="timelineTotalTime">Total: ${this.formatTime(this.totalRuntime)}</span>
            </div>
        `;
        
        // Re-attach event listeners after rendering
        setTimeout(() => {
            this.attachControlListeners();
        }, 10);
    },
    
    // Attach event listeners to control buttons
    attachControlListeners() {
        // Play/Pause button
        const playPauseBtn = document.getElementById('timelinePlayPause');
        if (playPauseBtn) {
            // Remove old listeners by cloning
            const newBtn = playPauseBtn.cloneNode(true);
            playPauseBtn.parentNode.replaceChild(newBtn, playPauseBtn);
            newBtn.addEventListener('click', () => this.togglePlayback());
        }

        // Rewind/Forward buttons
        const rewindBtn = document.getElementById('timelineRewind');
        if (rewindBtn) {
            const newBtn = rewindBtn.cloneNode(true);
            rewindBtn.parentNode.replaceChild(newBtn, rewindBtn);
            newBtn.addEventListener('click', () => this.seekRelative(-1));
        }

        const forwardBtn = document.getElementById('timelineForward');
        if (forwardBtn) {
            const newBtn = forwardBtn.cloneNode(true);
            forwardBtn.parentNode.replaceChild(newBtn, forwardBtn);
            newBtn.addEventListener('click', () => this.seekRelative(1));
        }
    },

    // Setup event listeners
    setupEventListeners() {
        // Attach control button listeners
        this.attachControlListeners();

        // Timeline scrub (click/drag)
        const timelineBar = document.getElementById('timelineBar');
        if (timelineBar) {
            let isDragging = false;

            timelineBar.addEventListener('mousedown', (e) => {
                isDragging = true;
                this.handleScrub(e);
            });

            document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    this.handleScrub(e);
                }
            });

            document.addEventListener('mouseup', () => {
                isDragging = false;
            });

            // Also handle click
            timelineBar.addEventListener('click', (e) => {
                if (!isDragging) {
                    this.handleScrub(e);
                }
            });
        }

        // Window resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const container = document.getElementById('timelineContainer');
                if (container && container.style.display !== 'none') {
                    this.renderTimelineBar();
                    this.updatePlayheadPosition();
                }
            }, 250);
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            // Only handle if timeline is visible
            const container = document.getElementById('timelineContainer');
            if (!container || container.style.display === 'none') return;

            if (e.code === 'Space' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.togglePlayback();
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                this.seekRelative(-0.1);
            } else if (e.code === 'ArrowRight') {
                e.preventDefault();
                this.seekRelative(0.1);
            }
        });
    },

    // Handle timeline scrub (click or drag)
    handleScrub(e) {
        const timelineBar = document.getElementById('timelineBar');
        if (!timelineBar || this.totalRuntime === 0) return;

        const rect = timelineBar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const time = Math.max(0, Math.min(this.totalRuntime, (x / width) * this.totalRuntime));

        this.seekTo(time);
    },

    // Seek to specific time
    seekTo(time) {
        this.playbackState.offsetSeconds = Math.max(0, Math.min(this.totalRuntime, time));
        if (this.playbackState.playing) {
            this.playbackState.startTimestamp = performance.now();
        }
        this.updateDisplay();
    },

    // Seek relative to current time
    seekRelative(seconds) {
        this.seekTo(this.playbackState.offsetSeconds + seconds);
    },

    // Toggle play/pause
    togglePlayback() {
        if (this.playbackState.playing) {
            this.pause();
        } else {
            this.play();
        }
    },

    // Start playback
    play() {
        if (this.totalRuntime === 0) {
            console.log('Cannot play: total runtime is 0');
            return;
        }
        
        this.playbackState.playing = true;
        // Calculate start timestamp so that elapsed time equals current offset
        this.playbackState.startTimestamp = performance.now() - (this.playbackState.offsetSeconds * 1000);
        
        const icon = document.getElementById('playPauseIcon');
        if (icon) icon.textContent = '⏸';
        
        console.log('Starting playback at', this.playbackState.offsetSeconds, 'seconds');
        this.startPlaybackLoop();
    },

    // Pause playback
    pause() {
        this.playbackState.playing = false;
        
        const icon = document.getElementById('playPauseIcon');
        if (icon) icon.textContent = '▶';
        
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    },

    // Playback loop using requestAnimationFrame
    startPlaybackLoop() {
        // Cancel any existing loop
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
        
        const tick = () => {
            if (!this.playbackState.playing) {
                this.rafId = null;
                return;
            }

            const now = performance.now();
            const elapsed = (now - this.playbackState.startTimestamp) / 1000;
            const currentTime = Math.max(0, Math.min(this.totalRuntime, elapsed));

            if (currentTime >= this.totalRuntime) {
                // Reached end
                this.pause();
                this.seekTo(this.totalRuntime);
                this.rafId = null;
                return;
            }

            this.playbackState.offsetSeconds = currentTime;
            this.updateDisplay();

            this.rafId = requestAnimationFrame(tick);
        };

        this.rafId = requestAnimationFrame(tick);
    },

    // Update display (playhead position, theatre view, time display)
    updateDisplay() {
        const currentTime = this.playbackState.offsetSeconds;
        
        // Update playhead position
        this.updatePlayheadPosition();
        
        // Update theatre view if panel changed
        const newPanelIndex = this.getPanelIndexAtTime(currentTime);
        if (newPanelIndex !== this.currentPanelIndex) {
            this.currentPanelIndex = newPanelIndex;
            this.renderTheatre();
        }
        
        // Update time display
        const timeDisplay = document.getElementById('timelineTime');
        if (timeDisplay) {
            timeDisplay.textContent = this.formatTime(currentTime);
        }
    },

    // Update playhead position
    updatePlayheadPosition() {
        const playhead = document.getElementById('timelinePlayhead');
        const timelineBar = document.getElementById('timelineBar');
        if (!playhead || !timelineBar || this.totalRuntime === 0) {
            // If playhead doesn't exist, try to create it
            if (!playhead && timelineBar && this.totalRuntime > 0) {
                const newPlayhead = document.createElement('div');
                newPlayhead.id = 'timelinePlayhead';
                newPlayhead.className = 'timeline-playhead';
                newPlayhead.style.position = 'absolute';
                newPlayhead.style.top = '0';
                newPlayhead.style.width = '2px';
                newPlayhead.style.height = '100%';
                newPlayhead.style.backgroundColor = '#ff0000';
                newPlayhead.style.zIndex = '10';
                newPlayhead.style.pointerEvents = 'none';
                timelineBar.appendChild(newPlayhead);
                // Recursively call to update position
                this.updatePlayheadPosition();
                return;
            }
            return;
        }

        const width = timelineBar.offsetWidth || timelineBar.clientWidth || 800;
        if (width === 0) return; // Can't calculate if width is 0
        
        const pxPerSecond = width / this.totalRuntime;
        const position = Math.max(0, Math.min(width, this.playbackState.offsetSeconds * pxPerSecond));

        playhead.style.left = `${position}px`;
    },

    // Get panel index at given time
    getPanelIndexAtTime(time) {
        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i];
            if (time >= segment.start && time < segment.end) {
                return i;
            }
        }
        // If at or past end, return last panel
        if (this.segments.length > 0 && time >= this.totalRuntime) {
            return this.segments.length - 1;
        }
        return -1;
    },

    // Get current panel based on playback state
    getCurrentPanel() {
        const index = this.getPanelIndexAtTime(this.playbackState.offsetSeconds);
        if (index >= 0 && index < this.panels.length) {
            return { ...this.panels[index], index };
        }
        return null;
    },

    // Format time as mm:ss.s
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = (seconds % 60).toFixed(1);
        return `${mins.toString().padStart(2, '0')}:${secs.padStart(4, '0')}`;
    },

    // Show timeline view
    async show() {
        const container = document.getElementById('timelineContainer');
        if (!container) return;

        // Only init if not already initialized or if panels changed
        if (this.panels.length === 0 || this.segments.length === 0) {
            await this.init();
        } else {
            // Just refresh the display
            this.render();
            // Re-attach event listeners after rendering
            setTimeout(() => {
                this.setupEventListeners();
            }, 100);
        }
        container.style.display = 'flex';
        
        // Small delay to ensure layout is calculated
        setTimeout(() => {
            this.renderTimelineBar();
            this.updatePlayheadPosition();
            this.updateDisplay();
        }, 100);
    },

    // Hide timeline view
    hide() {
        const container = document.getElementById('timelineContainer');
        if (!container) return;

        this.pause();
        container.style.display = 'none';
    },

    // Refresh timeline (reload panels and recompute)
    async refresh() {
        await this.loadPanels();
        this.computeSegments();
        this.preloadImages();
        this.render();
        // Re-attach event listeners after rendering
        setTimeout(() => {
            this.setupEventListeners();
        }, 100);
    }
};
