// Main application state and handlers
const app = {
    currentProject: null,
    selectedPanelId: null,

    async init() {
        // Create a default project on startup
        this.newProject();
        await this.refreshPanels();
    },

    async newProject() {
        // Auto-generate name: project_YYYY-MM-DD_HH-mm-ss
        const now = new Date();
        const pad = n => n.toString().padStart(2, '0');
        const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        const name = `project_${timestamp}`;

        try {
            await createNewProject(name);
            this.currentProject = { name };
            this.selectedPanelId = null;
            document.getElementById('projectName').textContent = name;
            await this.refreshPanels();
            this.clearEditor();
        } catch (err) {
            alert('Error creating project: ' + err);
        }
    },

    async saveProject() {
        if (!this.currentProject) {
            alert('No project to save');
            return;
        }

        try {
            const result = await saveProject();
            alert('Project saved successfully!');
        } catch (err) {
            alert('Error saving project: ' + err);
        }
    },

    async loadProject() {
        try {
            const resultStr = await loadProject();
            const result = JSON.parse(resultStr);
            this.currentProject = { name: result.name || 'Loaded Project' };
            this.selectedPanelId = null;
            document.getElementById('projectName').textContent = this.currentProject.name;
            await this.refreshPanels();
            this.clearEditor();
        } catch (err) {
            alert('Error loading project: ' + err);
        }
    },

    async addPanel() {
        try {
            const panelStr = await createPanel();
            const panel = JSON.parse(panelStr);
            await this.refreshPanels();
            this.selectPanel(panel.id);
        } catch (err) {
            alert('Error adding panel: ' + err);
        }
    },

    async refreshPanels() {
        try {
            const panelsStr = await getPanels();
            const panels = JSON.parse(panelsStr);
            renderPanelGrid(panels);
        } catch (err) {
            console.error('Error refreshing panels:', err);
        }
    },

    selectPanel(panelId) {
        this.selectedPanelId = panelId;
        this.refreshPanels(); // Re-render to show selection
        this.loadPanelEditor(panelId);
    },

    async loadPanelEditor(panelId) {
        try {
            const panelsStr = await getPanels();
            const panels = JSON.parse(panelsStr);
            const panel = panels.find(p => p.id === panelId);
            if (!panel) return;

            renderPanelEditor(panel);
        } catch (err) {
            console.error('Error loading panel editor:', err);
        }
    },

    clearEditor() {
        const editor = document.getElementById('panelEditor');
        editor.innerHTML = '<p class="placeholder">Select a panel to edit</p>';
    },

    async updatePanelField(panelId, field, value) {
        try {
            await updatePanel(panelId, field, value);
        } catch (err) {
            console.error('Error updating panel:', err);
        }
    },

    async deletePanel(panelId) {
        if (!confirm('Delete this panel?')) return;

        try {
            await deletePanel(panelId);
            if (this.selectedPanelId === panelId) {
                this.selectedPanelId = null;
                this.clearEditor();
            }
            await this.refreshPanels();
        } catch (err) {
            alert('Error deleting panel: ' + err);
        }
    }
};

// Initialize app when page loads
window.addEventListener('DOMContentLoaded', () => {
    app.init();
});
