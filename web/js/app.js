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
        const name = prompt('Enter project name:', 'Untitled Project');
        if (!name) return;

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
            const result = await loadProject();
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
            const panel = await createPanel();
            await this.refreshPanels();
            this.selectPanel(panel.id);
        } catch (err) {
            alert('Error adding panel: ' + err);
        }
    },

    async refreshPanels() {
        try {
            const panels = await getPanels();
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
            const panels = await getPanels();
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
