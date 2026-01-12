// Panel rendering and management

const Drawing = {
    canvas: null,
    ctx: null,
    isDrawing: false,
    currentPanel: null,
    history: [],
    brushSize: 2,
    color: '#000000',

    init(panel) {
        this.canvas = document.getElementById('drawingCanvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.currentPanel = panel;
        this.history = [];

        // Load existing image if present
        if (panel.image_data) {
            const img = new Image();
            img.onload = () => {
                this.ctx.drawImage(img, 0, 0);
                this.saveState();
            };
            img.src = panel.image_data;
        } else {
            // Fill with white background
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.saveState();
        }

        // Setup event listeners
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseleave', () => this.stopDrawing());
    },

    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
    },

    draw(e) {
        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.ctx.lineTo(x, y);
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.brushSize;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();
    },

    stopDrawing(e) {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveState();
            this.saveToPanel();
        }
    },

    saveState() {
        this.history.push(this.canvas.toDataURL());
        if (this.history.length > 20) {
            this.history.shift();
        }
    },

    async saveToPanel() {
        if (!this.currentPanel) return;
        const imageData = this.canvas.toDataURL('image/png');
        await app.updatePanelField(this.currentPanel.id, 'image_data', imageData);
        await app.refreshPanels();
    },

    undo() {
        if (this.history.length > 1) {
            this.history.pop();
            const prevState = this.history[this.history.length - 1];
            const img = new Image();
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0);
            };
            img.src = prevState;
            this.saveToPanel();
        }
    },

    clear() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.saveState();
        this.saveToPanel();
    },

    setBrushSize(size) {
        this.brushSize = parseInt(size);
    },

    setColor(color) {
        this.color = color;
    }
};

function renderPanelGrid(panels) {
    const grid = document.getElementById('panelGrid');

    if (!panels || panels.length === 0) {
        grid.innerHTML = '<div class="empty-state">No panels yet. Click "Add Panel" to get started.</div>';
        return;
    }

    grid.innerHTML = panels.map((panel, index) => `
        <div class="panel-card ${panel.id === app.selectedPanelId ? 'selected' : ''}" 
             onclick="app.selectPanel('${panel.id}')"
             draggable="true"
             ondragstart="handleDragStart(event, '${panel.id}')"
             ondragover="handleDragOver(event)"
             ondragleave="handleDragLeave(event)"
             ondrop="handleDrop(event, '${panel.id}')">
            <div class="panel-number">Panel ${panel.order + 1}</div>
            <div class="panel-thumbnail">
                ${panel.image_data ? `<img src="${panel.image_data}" alt="Panel ${panel.order + 1}">` : 'No image'}
            </div>
            <div class="panel-meta">
                ${panel.shot_type} / ${panel.camera_angle}<br>
                ${panel.duration}s
            </div>
            <div class="panel-actions">
                <button onclick="event.stopPropagation(); app.movePanel('${panel.id}', -1)" ${index === 0 ? 'disabled' : ''} title="Move Backward">&lt;</button>
                <button onclick="event.stopPropagation(); app.movePanel('${panel.id}', 1)" ${index === panels.length - 1 ? 'disabled' : ''} title="Move Forward">&gt;</button>
                <button onclick="event.stopPropagation(); app.duplicatePanel('${panel.id}')">Dup</button>
                <button onclick="event.stopPropagation(); app.deletePanel('${panel.id}')">Del</button>
            </div>
        </div>
    `).join('');
}

let draggedPanelId = null;

function handleDragStart(e, panelId) {
    draggedPanelId = panelId;
    e.dataTransfer.effectAllowed = 'move';
    e.target.classList.add('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault(); // Necessary. Allows us to drop.
    }
    e.dataTransfer.dropEffect = 'move';

    // Add visual cue
    const card = e.target.closest('.panel-card');
    if (card) {
        card.classList.add('drag-over');
    }

    return false;
}

function handleDragLeave(e) {
    const card = e.target.closest('.panel-card');
    if (card) {
        card.classList.remove('drag-over');
    }
}

function handleDrop(e, targetPanelId) {
    if (e.stopPropagation) {
        e.stopPropagation(); // stops the browser from redirecting.
    }

    // Remove visual cues
    document.querySelectorAll('.panel-card').forEach(el => {
        el.classList.remove('dragging');
        el.classList.remove('drag-over');
    });

    if (draggedPanelId !== targetPanelId) {
        const cards = Array.from(document.querySelectorAll('.panel-card'));
        const targetIndex = cards.findIndex(c => c.onclick.toString().includes(targetPanelId));

        if (targetIndex !== -1) {
            app.reorderPanel(draggedPanelId, targetIndex);
        }
    }

    return false;
}

function renderPanelEditor(panel) {
    const editor = document.getElementById('panelEditor');

    // Character Selection
    let charSection = '';
    if (typeof Characters !== 'undefined' && Characters.list && Characters.list.length > 0) {
        charSection = `
            <div class="form-group">
                <label>Characters</label>
                <div class="character-tags">
        `;

        Characters.list.forEach(char => {
            const isSelected = panel.character_ids && panel.character_ids.includes(char.id);
            charSection += `
                <label class="character-tag">
                    <input type="checkbox" 
                           ${isSelected ? 'checked' : ''} 
                           onchange="togglePanelCharacter('${panel.id}', '${char.id}', this.checked)">
                    ${char.name}
                </label>
            `;
        });

        charSection += `</div></div>`;
    }

    editor.innerHTML = `
        <h3>Panel ${panel.order + 1}</h3>
        
        <div class="form-group">
            <label>Visual Frame</label>
            <div class="canvas-container">
                <canvas id="drawingCanvas" width="640" height="360"></canvas>
            </div>
            <div class="canvas-toolbar">
                <button onclick="Drawing.clear()">Clear</button>
                <button onclick="Drawing.undo()">Undo</button>
                <label>
                    Brush Size: 
                    <input type="range" id="brushSize" min="1" max="10" value="2" 
                           onchange="Drawing.setBrushSize(this.value)">
                </label>
                <label>
                    Color: 
                    <input type="color" id="brushColor" value="#000000" 
                           onchange="Drawing.setColor(this.value)">
                </label>
            </div>
        </div>
        
        ${charSection}
        
        <div class="form-group">
            <label>Action Notes</label>
            <textarea id="actionNotes" onchange="app.updatePanelField('${panel.id}', 'action_notes', this.value)">${panel.action_notes || ''}</textarea>
        </div>
        
        <div class="form-group">
            <label>Dialogue</label>
            <textarea id="dialogue" onchange="app.updatePanelField('${panel.id}', 'dialogue', this.value)">${panel.dialogue || ''}</textarea>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Shot Type</label>
                <select id="shotType" onchange="app.updatePanelField('${panel.id}', 'shot_type', this.value)">
                    <option value="Wide" ${panel.shot_type === 'Wide' ? 'selected' : ''}>Wide</option>
                    <option value="Medium" ${panel.shot_type === 'Medium' ? 'selected' : ''}>Medium</option>
                    <option value="Close-up" ${panel.shot_type === 'Close-up' ? 'selected' : ''}>Close-up</option>
                    <option value="Extreme Close-up" ${panel.shot_type === 'Extreme Close-up' ? 'selected' : ''}>Extreme Close-up</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Camera Angle</label>
                <select id="cameraAngle" onchange="app.updatePanelField('${panel.id}', 'camera_angle', this.value)">
                    <option value="Eye-level" ${panel.camera_angle === 'Eye-level' ? 'selected' : ''}>Eye-level</option>
                    <option value="Low" ${panel.camera_angle === 'Low' ? 'selected' : ''}>Low</option>
                    <option value="High" ${panel.camera_angle === 'High' ? 'selected' : ''}>High</option>
                    <option value="Dutch" ${panel.camera_angle === 'Dutch' ? 'selected' : ''}>Dutch</option>
                </select>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Camera Movement</label>
                <select id="cameraMove" onchange="app.updatePanelField('${panel.id}', 'camera_move', this.value)">
                    <option value="Static" ${panel.camera_move === 'Static' ? 'selected' : ''}>Static</option>
                    <option value="Pan" ${panel.camera_move === 'Pan' ? 'selected' : ''}>Pan</option>
                    <option value="Tilt" ${panel.camera_move === 'Tilt' ? 'selected' : ''}>Tilt</option>
                    <option value="Zoom" ${panel.camera_move === 'Zoom' ? 'selected' : ''}>Zoom</option>
                    <option value="Dolly" ${panel.camera_move === 'Dolly' ? 'selected' : ''}>Dolly</option>
                    <option value="Truck" ${panel.camera_move === 'Truck' ? 'selected' : ''}>Truck</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Duration (seconds)</label>
                <input type="number" id="duration" step="0.1" value="${panel.duration}" 
                       onchange="app.updatePanelField('${panel.id}', 'duration', parseFloat(this.value))">
            </div>
        </div>
    `;

    // Initialize drawing after rendering
    Drawing.init(panel);
}

async function togglePanelCharacter(panelId, charId, isChecked) {
    try {
        const panelsStr = await getPanels();
        const panels = JSON.parse(panelsStr);
        const panel = panels.find(p => p.id === panelId);

        if (!panel) return;

        let ids = panel.character_ids || [];

        if (isChecked) {
            if (!ids.includes(charId)) {
                ids.push(charId);
            }
        } else {
            ids = ids.filter(id => id !== charId);
        }

        await app.updatePanelField(panelId, 'character_ids', ids);
    } catch (err) {
        console.error('Error toggling character:', err);
    }
}
