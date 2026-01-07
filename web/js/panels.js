// Panel rendering and management

function renderPanelGrid(panels) {
    const grid = document.getElementById('panelGrid');

    if (!panels || panels.length === 0) {
        grid.innerHTML = '<div class="empty-state">No panels yet. Click "Add Panel" to get started.</div>';
        return;
    }

    grid.innerHTML = panels.map(panel => `
        <div class="panel-card ${panel.id === app.selectedPanelId ? 'selected' : ''}" 
             onclick="app.selectPanel('${panel.id}')">
            <div class="panel-number">Panel ${panel.order + 1}</div>
            <div class="panel-thumbnail">
                ${panel.image_data ? `<img src="${panel.image_data}" alt="Panel ${panel.order + 1}">` : 'No image'}
            </div>
            <div class="panel-meta">
                ${panel.shot_type} / ${panel.camera_angle}<br>
                ${panel.duration}s
            </div>
            <div class="panel-actions">
                <button onclick="event.stopPropagation(); app.deletePanel('${panel.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function renderPanelEditor(panel) {
    const editor = document.getElementById('panelEditor');

    editor.innerHTML = `
        <h3>Panel ${panel.order + 1}</h3>
        
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
}
